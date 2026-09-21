import type { LocationResolution } from './locationLookup'
import type { PrivatePlate } from './types'

export type ValidLocatedPlate = {
  plate: PrivatePlate
  resolution: Exclude<LocationResolution, { kind: 'unknown' }>
}

export function createStabilizer(now: () => number = Date.now) {
  let identity: string | null = null
  let firstSeenAt = 0
  let count = 0

  const reset = () => {
    identity = null
    firstSeenAt = 0
    count = 0
  }

  return {
    observe(result: ValidLocatedPlate): ValidLocatedPlate | null {
      const timestamp = now()
      if (identity !== result.plate.identity || timestamp - firstSeenAt > 2000) {
        identity = result.plate.identity
        firstSeenAt = timestamp
        count = 1
        return null
      }
      count += 1
      return count >= 3 ? result : null
    },
    reset,
  }
}

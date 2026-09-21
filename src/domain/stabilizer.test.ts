import { createStabilizer } from './stabilizer'
import type { ValidLocatedPlate } from './stabilizer'

const plate10Be: ValidLocatedPlate = {
  plate: { display: '۱۲ ب ۳۴۵ ایران ۱۰', iranCode: '10', middleLetter: 'ب', identity: '10:ب' },
  resolution: { kind: 'resolved', locations: [{ city: 'تهران', province: 'تهران', sourceId: 'pishkhanak' }] },
}
const plate13Je: ValidLocatedPlate = {
  ...plate10Be,
  plate: { ...plate10Be.plate, identity: '13:ج' },
}

it('emits only the third matching eligible reading inside two seconds', () => {
  const stable = createStabilizer(() => 1000)
  expect(stable.observe(plate10Be)).toBeNull()
  expect(stable.observe(plate10Be)).toBeNull()
  expect(stable.observe(plate10Be)).toEqual(plate10Be)
})

it('resets the count when the identity changes', () => {
  const stable = createStabilizer(() => 1000)
  stable.observe(plate10Be)
  stable.observe(plate10Be)
  expect(stable.observe(plate13Je)).toBeNull()
})

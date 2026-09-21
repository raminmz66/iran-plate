import records from '../data/iranPrivatePlateLocations.json'

export type PlateLocation = {
  city: string
  province: string
  sourceId: string
}

export type LocationResolution =
  | { kind: 'resolved'; locations: [PlateLocation] }
  | { kind: 'ambiguous'; locations: PlateLocation[] }
  | { kind: 'unknown'; locations: [] }

export function lookupLocation(identity: string): LocationResolution {
  const locations = records.filter((record) => record.identity === identity)
  if (locations.length === 0) return { kind: 'unknown', locations: [] }
  if (locations.length === 1) return { kind: 'resolved', locations: [locations[0]] }
  return { kind: 'ambiguous', locations }
}

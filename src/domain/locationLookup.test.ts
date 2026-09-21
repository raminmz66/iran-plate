import { lookupLocation } from './locationLookup'

it('returns one location for a verified identity', () => {
  expect(lookupLocation('10:ب')).toMatchObject({
    kind: 'resolved',
    locations: [{ city: 'تهران', province: 'تهران' }],
  })
})

it('keeps multiple verified locations explicit', () => {
  expect(lookupLocation('21:ل').kind).toBe('ambiguous')
})

it('does not invent a location for an unknown identity', () => {
  expect(lookupLocation('00:ب')).toEqual({ kind: 'unknown', locations: [] })
})

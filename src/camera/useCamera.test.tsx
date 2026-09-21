import { act, renderHook } from '@testing-library/react'
import { useCamera } from './useCamera'

const getUserMedia = vi.fn()

beforeEach(() => {
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  getUserMedia.mockReset()
})

afterEach(() => vi.unstubAllGlobals())

it('requests the rear camera only after start', async () => {
  getUserMedia.mockResolvedValue({ getTracks: () => [] })
  const { result } = renderHook(() => useCamera())
  expect(getUserMedia).not.toHaveBeenCalled()
  await act(() => result.current.start())
  expect(getUserMedia).toHaveBeenCalledWith({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  })
})

it('stops every track when stop is called', async () => {
  const track = { stop: vi.fn() }
  getUserMedia.mockResolvedValue({ getTracks: () => [track] })
  const { result } = renderHook(() => useCamera())
  await act(() => result.current.start())
  act(() => result.current.stop())
  expect(track.stop).toHaveBeenCalledOnce()
})

it('reports denied access without throwing', async () => {
  getUserMedia.mockRejectedValue(new DOMException('no', 'NotAllowedError'))
  const { result } = renderHook(() => useCamera())
  await act(() => result.current.start())
  expect(result.current.status).toBe('denied')
})

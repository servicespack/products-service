import type http from 'node:http'
import mongoose from 'mongoose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cooldown from './cooldown'
import { logger } from './logger'

vi.mock('mongoose', () => ({
  default: {
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('cooldown', () => {
  let mockServer: Partial<http.Server>
  let processOnSpy: any
  let processExitSpy: any

  beforeEach(() => {
    vi.mocked(mongoose.disconnect).mockResolvedValue(undefined)
    mockServer = {
      close: vi.fn((cb) => {
        if (cb)
          cb(undefined)
        return mockServer as http.Server
      }),
    }
    processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process)
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should register process event listeners', () => {
    cooldown({ server: mockServer as http.Server })

    expect(processOnSpy).toHaveBeenCalledWith('SIGHUP', expect.any(Function))
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
  })

  it('should close server, disconnect mongoose and exit process when signal is triggered', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    cooldown({ server: mockServer as http.Server })

    const sigtermCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGTERM')
    const sigtermHandler = sigtermCall[1]

    sigtermHandler()

    expect(logger.info).toHaveBeenCalledWith('Graceful shutdown initiated')
    expect(mockServer.close).toHaveBeenCalled()
    await new Promise(process.nextTick)

    expect(mongoose.disconnect).toHaveBeenCalled()
    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(processExitSpy).toHaveBeenCalledWith(128 + 15)
  })

  it('should handle SIGHUP signal and exit with code 129', async () => {
    cooldown({ server: mockServer as http.Server })

    const sighupCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGHUP')
    const sighupHandler = sighupCall[1]

    sighupHandler()

    expect(mockServer.close).toHaveBeenCalled()
    await new Promise(process.nextTick)

    expect(mongoose.disconnect).toHaveBeenCalled()
    expect(processExitSpy).toHaveBeenCalledWith(128 + 1)
  })

  it('should log error if mongoose disconnect fails', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const error = new Error('Disconnect failed')
    vi.mocked(mongoose.disconnect).mockRejectedValueOnce(error)

    cooldown({ server: mockServer as http.Server })

    const sigtermCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGTERM')
    const sigtermHandler = sigtermCall[1]

    sigtermHandler()

    expect(mockServer.close).toHaveBeenCalled()
    await new Promise(process.nextTick)

    expect(mongoose.disconnect).toHaveBeenCalled()
    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(error)
    expect(processExitSpy).toHaveBeenCalledWith(128 + 15)
  })

  it('should force exit when graceful shutdown times out after 10 seconds', () => {
    vi.useFakeTimers()
    mockServer.close = vi.fn()

    cooldown({ server: mockServer as http.Server })

    const sigintCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGINT')
    const sigintHandler = sigintCall[1]

    sigintHandler()

    expect(mockServer.close).toHaveBeenCalled()
    expect(processExitSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(10000)

    expect(logger.error).toHaveBeenCalledWith('Graceful shutdown timed out, force exiting')
    expect(processExitSpy).toHaveBeenCalledWith(128 + 2)
    vi.useRealTimers()
  })
})

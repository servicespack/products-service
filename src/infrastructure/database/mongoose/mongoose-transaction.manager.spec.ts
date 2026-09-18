import mongoose from 'mongoose'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MongooseTransactionManager } from './mongoose-transaction.manager'
import { transactionStorage } from './transaction.context'

describe(MongooseTransactionManager.name, () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should run work in a transaction and return the result', async () => {
    const manager = new MongooseTransactionManager()
    const mockSession = {
      withTransaction: vi.fn(async (cb: () => Promise<unknown>) => cb()),
      endSession: vi.fn(),
    }
    vi.spyOn(mongoose, 'startSession').mockResolvedValueOnce(mockSession as any)

    let capturedSession: unknown
    const result = await manager.runInTransaction(async () => {
      capturedSession = transactionStorage.getStore()
      return 'success'
    })

    expect(result).toBe('success')
    expect(capturedSession).toBe(mockSession)
    expect(mockSession.withTransaction).toHaveBeenCalledOnce()
    expect(mockSession.endSession).toHaveBeenCalledOnce()
  })

  it('should end session even if work throws an error', async () => {
    const manager = new MongooseTransactionManager()
    const mockSession = {
      withTransaction: vi.fn(async (cb: () => Promise<unknown>) => cb()),
      endSession: vi.fn(),
    }
    vi.spyOn(mongoose, 'startSession').mockResolvedValueOnce(mockSession as any)

    await expect(manager.runInTransaction(async () => {
      throw new Error('failed transaction')
    })).rejects.toThrow('failed transaction')

    expect(mockSession.endSession).toHaveBeenCalledOnce()
  })

  it('should reuse existing session when nested in another transaction', async () => {
    const manager = new MongooseTransactionManager()
    const mockSession = {
      withTransaction: vi.fn(async (cb: () => Promise<unknown>) => cb()),
      endSession: vi.fn(),
    }
    const startSessionSpy = vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any)

    let innerSession: unknown
    let outerSession: unknown

    const result = await manager.runInTransaction(async () => {
      outerSession = transactionStorage.getStore()
      return manager.runInTransaction(async () => {
        innerSession = transactionStorage.getStore()
        return 'nested success'
      })
    })

    expect(result).toBe('nested success')
    expect(outerSession).toBe(mockSession)
    expect(innerSession).toBe(mockSession)
    expect(startSessionSpy).toHaveBeenCalledOnce()
    expect(mockSession.withTransaction).toHaveBeenCalledOnce()
    expect(mockSession.endSession).toHaveBeenCalledOnce()
  })
})

import mongoose from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configuration } from './configuration'
import { connectDatabase } from './database'
import { logger } from './logger'

vi.mock('./configuration', () => ({
  configuration: {
    database: {
      uri: 'mongodb://localhost:27017/test',
    },
  },
}))

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('database Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should connect to database and create collection if it does not exist', async () => {
    const mockDb = {
      listCollections: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      createCollection: vi.fn().mockResolvedValue({}),
      command: vi.fn(),
    }
    const mockConnection = {
      connection: {
        db: mockDb,
      },
    }
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection as any)

    const result = await connectDatabase()

    expect(mongoose.connect).toHaveBeenCalledWith(configuration.database.uri)
    expect(mockDb.listCollections).toHaveBeenCalledWith({ name: 'products' })
    expect(mockDb.listCollections).toHaveBeenCalledWith({ name: 'stockmovements' })
    expect(mockDb.listCollections).toHaveBeenCalledWith({ name: 'reservations' })
    expect(mockDb.createCollection).toHaveBeenCalledWith('products', expect.any(Object))
    expect(mockDb.createCollection).toHaveBeenCalledWith('stockmovements', expect.any(Object))
    expect(mockDb.createCollection).toHaveBeenCalledWith('reservations', expect.any(Object))
    expect(mockDb.command).not.toHaveBeenCalled()
    expect(result).toBe(mockConnection)
    expect(logger.info).toHaveBeenCalledWith('Connected to the database')
    expect(logger.info).toHaveBeenCalledWith('Schema validation applied to products collection')
    expect(logger.info).toHaveBeenCalledWith('Schema validation applied to stockmovements collection')
    expect(logger.info).toHaveBeenCalledWith('Schema validation applied to reservations collection')
  })

  it('should connect to database and apply validation if collection exists', async () => {
    const mockDb = {
      listCollections: vi.fn()
        .mockReturnValueOnce({ toArray: vi.fn().mockResolvedValue([{ name: 'products' }]) })
        .mockReturnValueOnce({ toArray: vi.fn().mockResolvedValue([{ name: 'stockmovements' }]) })
        .mockReturnValueOnce({ toArray: vi.fn().mockResolvedValue([{ name: 'reservations' }]) }),
      createCollection: vi.fn(),
      command: vi.fn().mockResolvedValue({}),
    }
    const mockConnection = {
      connection: {
        db: mockDb,
      },
    }
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection as any)

    const result = await connectDatabase()

    expect(mockDb.listCollections).toHaveBeenCalledWith({ name: 'products' })
    expect(mockDb.listCollections).toHaveBeenCalledWith({ name: 'stockmovements' })
    expect(mockDb.listCollections).toHaveBeenCalledWith({ name: 'reservations' })
    expect(mockDb.createCollection).not.toHaveBeenCalled()
    expect(mockDb.command).toHaveBeenCalledWith({ collMod: 'products', validator: expect.any(Object) })
    expect(mockDb.command).toHaveBeenCalledWith({ collMod: 'stockmovements', validator: expect.any(Object) })
    expect(mockDb.command).toHaveBeenCalledWith({ collMod: 'reservations', validator: expect.any(Object) })
    expect(result).toBe(mockConnection)
  })

  it('should throw error if db connection is not established', async () => {
    const mockConnection = {
      connection: {
        db: null,
      },
    }
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection as any)

    await expect(connectDatabase()).rejects.toThrow('Database connection not established')
  })
})

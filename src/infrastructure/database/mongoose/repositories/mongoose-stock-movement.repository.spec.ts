import type { Model } from 'mongoose'
import type { IStockMovementDoc } from '../models/stock-movement.model'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StockMovement } from '../../../../domain/entities/stock-movement.entity'
import { MongooseStockMovementRepository } from './mongoose-stock-movement.repository'

describe(MongooseStockMovementRepository.name, () => {
  let repository: MongooseStockMovementRepository
  let mockModel: any

  beforeEach(() => {
    mockModel = {
      create: vi.fn(),
      find: vi.fn(),
    }
    repository = new MongooseStockMovementRepository(mockModel as unknown as Model<IStockMovementDoc>)
  })

  it('should create and return a stock movement', async () => {
    const movement = new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 5,
      previousStock: 0,
      currentStock: 5,
      reason: 'Initial stock',
    })

    const fakeDoc = {
      _id: 'mov-1',
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 5,
      previousStock: 0,
      currentStock: 5,
      reason: 'Initial stock',
      createdAt: new Date(),
    }

    mockModel.create.mockResolvedValueOnce(fakeDoc)

    const result = await repository.create(movement)

    expect(mockModel.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 5,
      previousStock: 0,
      currentStock: 5,
      reason: 'Initial stock',
    }))
    expect(result.id).toBe('mov-1')
    expect(result.quantity).toBe(5)
  })

  it('should list stock movements by productId with pagination', async () => {
    const fakeDoc = {
      _id: 'mov-1',
      productId: 'prod-1',
      type: 'DECREMENT',
      quantity: 2,
      previousStock: 5,
      currentStock: 3,
      createdAt: new Date(),
    }

    const mockChain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce([fakeDoc]),
    }
    mockModel.find.mockReturnValueOnce(mockChain)

    const result = await repository.listByProductId({
      productId: 'prod-1',
      page: 2,
      pageSize: 5,
    })

    expect(mockModel.find).toHaveBeenCalledWith({ productId: 'prod-1' })
    expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(mockChain.skip).toHaveBeenCalledWith(5)
    expect(mockChain.limit).toHaveBeenCalledWith(5)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('mov-1')
  })
})

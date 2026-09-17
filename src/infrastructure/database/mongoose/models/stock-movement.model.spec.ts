import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { stockMovementSchema } from './stock-movement.model'

describe('stockMovementModel transformations', () => {
  it('should transform toJSON correctly', () => {
    const transform = (stockMovementSchema as any).options.toJSON.transform

    const mockId = new mongoose.Types.ObjectId()
    const doc = {}
    const ret = {
      _id: mockId,
      __v: 0,
      productId: 'prod-123',
      type: 'INCREMENT',
      quantity: 5,
      previousStock: 10,
      currentStock: 15,
      reason: 'Restock',
      createdAt: new Date(),
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: mockId.toHexString(),
      productId: 'prod-123',
      type: 'INCREMENT',
      quantity: 5,
      previousStock: 10,
      currentStock: 15,
      reason: 'Restock',
      createdAt: expect.any(Date),
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })

  it('should transform toObject correctly', () => {
    const transform = (stockMovementSchema as any).options.toObject.transform

    const mockId = new mongoose.Types.ObjectId()
    const doc = {}
    const ret = {
      _id: mockId,
      __v: 0,
      productId: 'prod-123',
      type: 'INCREMENT',
      quantity: 5,
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: mockId.toHexString(),
      productId: 'prod-123',
      type: 'INCREMENT',
      quantity: 5,
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })
})

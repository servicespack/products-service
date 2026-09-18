import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { stockMovementSchema, stockMovementValidationRules } from './stock-movement.model'

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

  it('should configure schema paths correctly', () => {
    const productIdPath = stockMovementSchema.path('productId') as any
    expect(productIdPath.options.type).toBe(String)
    expect(productIdPath.options.required).toBe(true)
    expect(productIdPath.options.index).toBe(true)

    const typePath = stockMovementSchema.path('type') as any
    expect(typePath.options.type).toBe(String)
    expect(typePath.options.required).toBe(true)
    expect(typePath.options.enum).toEqual(['INCREMENT', 'DECREMENT'])

    const quantityPath = stockMovementSchema.path('quantity') as any
    expect(quantityPath.options.type).toBe(Number)
    expect(quantityPath.options.required).toBe(true)

    const prevStockPath = stockMovementSchema.path('previousStock') as any
    expect(prevStockPath.options.type).toBe(Number)
    expect(prevStockPath.options.required).toBe(true)

    const currStockPath = stockMovementSchema.path('currentStock') as any
    expect(currStockPath.options.type).toBe(Number)
    expect(currStockPath.options.required).toBe(true)

    const reasonPath = stockMovementSchema.path('reason') as any
    expect(reasonPath.options.type).toBe(String)
    expect(reasonPath.options.default).toBeNull()

    expect((stockMovementSchema as any).options.timestamps).toEqual({
      createdAt: true,
      updatedAt: false,
    })
  })

  it('should configure schema indexes correctly', () => {
    const indexes = stockMovementSchema.indexes()
    expect(indexes).toContainEqual([{ productId: 1, createdAt: -1 }, expect.any(Object)])
  })

  it('should define stockMovementValidationRules correctly', () => {
    expect(stockMovementValidationRules).toEqual({
      $jsonSchema: {
        bsonType: 'object',
        required: ['productId', 'type', 'quantity', 'previousStock', 'currentStock'],
        properties: {
          productId: { bsonType: 'string', description: 'must be a string and is required' },
          type: { enum: ['INCREMENT', 'DECREMENT'], description: 'must be INCREMENT or DECREMENT' },
          quantity: { bsonType: 'number', description: 'must be a number and is required' },
          previousStock: { bsonType: 'number', description: 'must be a number and is required' },
          currentStock: { bsonType: 'number', description: 'must be a number and is required' },
          reason: { bsonType: ['string', 'null'] },
          createdAt: { bsonType: 'date' },
        },
      },
    })
  })
})

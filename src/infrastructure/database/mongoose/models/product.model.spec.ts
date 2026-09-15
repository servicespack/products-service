import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { productSchema } from './product.model'

describe('productModel transformations', () => {
  it('should transform toJSON correctly', () => {
    const transform = (productSchema as any).options.toJSON.transform

    const mockId = new mongoose.Types.ObjectId()
    const doc = {}
    const ret = {
      _id: mockId,
      __v: 0,
      name: 'Test Product',
      price: 99.99,
      description: 'A great product',
      sku: 'SKU-001',
      active: true,
      stock: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: mockId.toHexString(),
      name: 'Test Product',
      price: 99.99,
      description: 'A great product',
      sku: 'SKU-001',
      active: true,
      stock: 10,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })

  it('should transform toObject correctly', () => {
    const transform = (productSchema as any).options.toObject.transform

    const mockId = new mongoose.Types.ObjectId()
    const doc = {}
    const ret = {
      _id: mockId,
      __v: 0,
      name: 'Test Product',
      price: 99.99,
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: mockId.toHexString(),
      name: 'Test Product',
      price: 99.99,
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })

  it('should define name with trim option', () => {
    const namePath = productSchema.path('name') as any
    expect(namePath.options.trim).toBe(true)
    expect(namePath.options.required).toBe(true)
  })
})

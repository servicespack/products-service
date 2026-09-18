import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { productSchema, productValidationRules } from './product.model'

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

  it('should configure schema paths correctly', () => {
    const namePath = productSchema.path('name') as any
    expect(namePath.options.type).toBe(String)
    expect(namePath.options.required).toBe(true)
    expect(namePath.options.trim).toBe(true)

    const pricePath = productSchema.path('price') as any
    expect(pricePath.options.type).toBe(Number)
    expect(pricePath.options.required).toBe(true)

    const descriptionPath = productSchema.path('description') as any
    expect(descriptionPath.options.type).toBe(String)
    expect(descriptionPath.options.default).toBeNull()

    const skuPath = productSchema.path('sku') as any
    expect(skuPath.options.type).toBe(String)
    expect(skuPath.options.default).toBeNull()

    const categoriesPath = productSchema.path('categories') as any
    expect(categoriesPath.options.type).toEqual([String])
    expect(categoriesPath.options.default).toEqual([])

    const tagsPath = productSchema.path('tags') as any
    expect(tagsPath.options.type).toEqual([String])
    expect(tagsPath.options.default).toEqual([])

    const activePath = productSchema.path('active') as any
    expect(activePath.options.type).toBe(Boolean)
    expect(activePath.options.default).toBe(true)

    const stockPath = productSchema.path('stock') as any
    expect(stockPath.options.type).toBe(Number)
    expect(stockPath.options.default).toBe(0)

    const deletedAtPath = productSchema.path('deletedAt') as any
    expect(deletedAtPath.options.type).toBe(Date)
    expect(deletedAtPath.options.default).toBeNull()

    expect((productSchema as any).options.timestamps).toBe(true)
  })

  it('should configure schema indexes correctly', () => {
    const indexes = productSchema.indexes()
    expect(indexes).toContainEqual([{ name: 'text', description: 'text' }, expect.any(Object)])
    expect(indexes).toContainEqual([{ categories: 1 }, expect.any(Object)])
    expect(indexes).toContainEqual([{ tags: 1 }, expect.any(Object)])
    expect(indexes).toContainEqual([{ deletedAt: 1 }, expect.any(Object)])
  })

  it('should define productValidationRules correctly', () => {
    expect(productValidationRules).toEqual({
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'price'],
        properties: {
          name: { bsonType: 'string', description: 'must be a string and is required' },
          price: { bsonType: 'number', description: 'must be a number and is required' },
          description: { bsonType: ['string', 'null'] },
          sku: { bsonType: ['string', 'null'] },
          categories: { bsonType: 'array', items: { bsonType: 'string' } },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
          active: { bsonType: 'bool' },
          stock: { bsonType: 'number' },
          deletedAt: { bsonType: ['date', 'null'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    })
  })
})

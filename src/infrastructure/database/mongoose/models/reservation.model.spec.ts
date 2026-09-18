import { describe, expect, it } from 'vitest'
import { reservationSchema, reservationValidationRules } from './reservation.model'

describe('reservationModel transformations', () => {
  it('should transform toJSON correctly', () => {
    const transform = (reservationSchema as any).options.toJSON.transform

    const doc = {}
    const ret = {
      _id: 'res-123',
      __v: 0,
      productId: 'prod-123',
      quantity: 5,
      status: 'ACTIVE',
      reason: 'Hold',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: 'res-123',
      productId: 'prod-123',
      quantity: 5,
      status: 'ACTIVE',
      reason: 'Hold',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })

  it('should transform toObject correctly', () => {
    const transform = (reservationSchema as any).options.toObject.transform

    const doc = {}
    const ret = {
      _id: 'res-123',
      __v: 0,
      productId: 'prod-123',
      quantity: 5,
      status: 'ACTIVE',
    }

    transform(doc, ret)

    expect(ret).toEqual({
      id: 'res-123',
      productId: 'prod-123',
      quantity: 5,
      status: 'ACTIVE',
    })
    expect((ret as any)._id).toBeUndefined()
    expect((ret as any).__v).toBeUndefined()
  })

  it('should configure schema paths correctly', () => {
    const idPath = reservationSchema.path('_id') as any
    expect(idPath.options.type).toBe(String)
    expect(idPath.options.required).toBe(true)

    const productIdPath = reservationSchema.path('productId') as any
    expect(productIdPath.options.type).toBe(String)
    expect(productIdPath.options.required).toBe(true)
    expect(productIdPath.options.index).toBe(true)

    const quantityPath = reservationSchema.path('quantity') as any
    expect(quantityPath.options.type).toBe(Number)
    expect(quantityPath.options.required).toBe(true)

    const statusPath = reservationSchema.path('status') as any
    expect(statusPath.options.type).toBe(String)
    expect(statusPath.options.required).toBe(true)
    expect(statusPath.options.enum).toEqual(['ACTIVE', 'CANCELLED'])
    expect(statusPath.options.default).toBe('ACTIVE')

    const reasonPath = reservationSchema.path('reason') as any
    expect(reasonPath.options.type).toBe(String)
    expect(reasonPath.options.default).toBeNull()

    expect((reservationSchema as any).options.timestamps).toBe(true)
  })

  it('should configure schema indexes correctly', () => {
    const indexes = reservationSchema.indexes()
    expect(indexes).toContainEqual([{ productId: 1, status: 1 }, expect.any(Object)])
  })

  it('should define reservationValidationRules correctly', () => {
    expect(reservationValidationRules).toEqual({
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'productId', 'quantity', 'status'],
        properties: {
          _id: { bsonType: 'string', description: 'must be a string and is required' },
          productId: { bsonType: 'string', description: 'must be a string and is required' },
          quantity: { bsonType: 'number', description: 'must be a number and is required' },
          status: { enum: ['ACTIVE', 'CANCELLED'], description: 'must be ACTIVE or CANCELLED' },
          reason: { bsonType: ['string', 'null'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    })
  })
})

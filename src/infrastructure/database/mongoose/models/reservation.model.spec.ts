import { describe, expect, it } from 'vitest'
import { reservationSchema } from './reservation.model'

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
})

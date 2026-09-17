import type { IReservationDoc } from '../models/reservation.model'
import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { Reservation } from '../../../../domain/entities/reservation.entity'
import { ReservationMapper } from './reservation.mapper'

describe('reservationMapper', () => {
  it('should map from document to domain entity using doc.id', () => {
    const createdAt = new Date('2026-01-01')
    const updatedAt = new Date('2026-01-02')

    const doc = {
      id: 'res-123',
      productId: 'prod-456',
      quantity: 5,
      status: 'ACTIVE' as const,
      reason: 'Hold',
      createdAt,
      updatedAt,
    } as unknown as IReservationDoc

    const entity = ReservationMapper.toDomain(doc)

    expect(entity.id).toBe('res-123')
    expect(entity.productId).toBe('prod-456')
    expect(entity.quantity).toBe(5)
    expect(entity.status).toBe('ACTIVE')
    expect(entity.reason).toBe('Hold')
    expect(entity.createdAt).toEqual(createdAt)
    expect(entity.updatedAt).toEqual(updatedAt)
  })

  it('should map from document to domain entity using _id when id is absent', () => {
    const objectId = new mongoose.Types.ObjectId()
    const doc = {
      _id: objectId,
      productId: 'prod-789',
      quantity: 2,
      status: 'CANCELLED' as const,
    } as unknown as IReservationDoc

    const entity = ReservationMapper.toDomain(doc)

    expect(entity.id).toBe(objectId.toHexString())
    expect(entity.reason).toBeUndefined()
  })

  it('should map from domain entity to persistence with all fields', () => {
    const createdAt = new Date('2026-01-01')
    const updatedAt = new Date('2026-01-02')

    const entity = new Reservation({
      id: 'res-100',
      productId: 'prod-200',
      quantity: 3,
      status: 'ACTIVE',
      reason: 'Customer request',
      createdAt,
      updatedAt,
    })

    const persistence = ReservationMapper.toPersistence(entity)

    expect(persistence).toEqual({
      _id: 'res-100',
      productId: 'prod-200',
      quantity: 3,
      status: 'ACTIVE',
      reason: 'Customer request',
      createdAt,
      updatedAt,
    })
  })

  it('should map from domain entity to persistence omitting optional fields when undefined', () => {
    const entity = {
      id: 'res-101',
      productId: 'prod-201',
      quantity: 1,
      status: 'ACTIVE' as const,
      reason: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    } as unknown as Reservation

    const persistence = ReservationMapper.toPersistence(entity)

    expect(persistence).toEqual({
      _id: 'res-101',
      productId: 'prod-201',
      quantity: 1,
      status: 'ACTIVE',
    })
    expect(persistence.reason).toBeUndefined()
    expect(persistence.createdAt).toBeUndefined()
    expect(persistence.updatedAt).toBeUndefined()
  })
})

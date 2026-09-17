import { describe, expect, it } from 'vitest'
import { InvalidStockQuantityError } from '../errors/invalid-stock-quantity.error'
import { ReservationAlreadyCancelledError } from '../errors/reservation-already-cancelled.error'
import { Reservation } from './reservation.entity'

describe(Reservation.name, () => {
  it('should create an active reservation with valid props', () => {
    const reservation = new Reservation({
      id: 'res-1',
      productId: 'prod-1',
      quantity: 5,
      reason: 'Hold for order',
    })

    expect(reservation.id).toBe('res-1')
    expect(reservation.productId).toBe('prod-1')
    expect(reservation.quantity).toBe(5)
    expect(reservation.status).toBe('ACTIVE')
    expect(reservation.reason).toBe('Hold for order')
    expect(reservation.createdAt).toBeInstanceOf(Date)
    expect(reservation.updatedAt).toBeInstanceOf(Date)
  })

  it('should throw when productId is empty', () => {
    expect(() => new Reservation({ productId: '', quantity: 2 })).toThrow('Product ID is required')
  })

  it('should throw InvalidStockQuantityError when quantity is not a positive integer', () => {
    expect(() => new Reservation({ productId: 'prod-1', quantity: 0 })).toThrow(InvalidStockQuantityError)
    expect(() => new Reservation({ productId: 'prod-1', quantity: -2 })).toThrow(InvalidStockQuantityError)
    expect(() => new Reservation({ productId: 'prod-1', quantity: 1.5 })).toThrow(InvalidStockQuantityError)
  })

  it('should cancel active reservation', () => {
    const reservation = new Reservation({
      id: 'res-1',
      productId: 'prod-1',
      quantity: 2,
    })

    reservation.cancel()

    expect(reservation.status).toBe('CANCELLED')
  })

  it('should throw ReservationAlreadyCancelledError on repeated cancellation', () => {
    const reservation = new Reservation({
      id: 'res-1',
      productId: 'prod-1',
      quantity: 2,
      status: 'CANCELLED',
    })

    expect(() => reservation.cancel()).toThrow(ReservationAlreadyCancelledError)
  })

  it('should serialize to JSON properly', () => {
    const now = new Date()
    const reservation = new Reservation({
      id: 'res-1',
      productId: 'prod-1',
      quantity: 3,
      reason: 'Test',
      createdAt: now,
      updatedAt: now,
    })

    expect(reservation.toJSON()).toEqual({
      id: 'res-1',
      productId: 'prod-1',
      quantity: 3,
      status: 'ACTIVE',
      reason: 'Test',
      createdAt: now,
      updatedAt: now,
    })
  })
})

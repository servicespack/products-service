import { describe, expect, it } from 'vitest'
import {
  DomainError,
  InsufficientStockError,
  InvalidPaginationError,
  InvalidStockQuantityError,
  ProductNotFoundError,
  ReservationAlreadyCancelledError,
  ReservationNotFoundError,
} from './index'

describe('domain Errors', () => {
  it('should instantiate InvalidPaginationError with default message', () => {
    const error = new InvalidPaginationError()
    expect(error).toBeInstanceOf(DomainError)
    expect(error.message).toBe('Invalid pagination parameters')
    expect(error.name).toBe('InvalidPaginationError')
  })

  it('should instantiate InvalidStockQuantityError with default and custom messages', () => {
    const defaultError = new InvalidStockQuantityError()
    expect(defaultError.message).toBe('Stock quantity must be a positive integer')

    const customError = new InvalidStockQuantityError('Custom quantity message')
    expect(customError.message).toBe('Custom quantity message')
  })

  it('should instantiate ReservationAlreadyCancelledError with default message and name', () => {
    const defaultError = new ReservationAlreadyCancelledError()
    expect(defaultError.message).toBe('Reservation has already been cancelled')
    expect(defaultError.name).toBe('ReservationAlreadyCancelledError')

    const customError = new ReservationAlreadyCancelledError('Custom already cancelled')
    expect(customError.message).toBe('Custom already cancelled')
    expect(customError.name).toBe('ReservationAlreadyCancelledError')
  })

  it('should instantiate ReservationNotFoundError with default message and name', () => {
    const defaultError = new ReservationNotFoundError()
    expect(defaultError.message).toBe('Reservation not found')
    expect(defaultError.name).toBe('ReservationNotFoundError')

    const customError = new ReservationNotFoundError('Custom not found')
    expect(customError.message).toBe('Custom not found')
    expect(customError.name).toBe('ReservationNotFoundError')
  })

  it('should instantiate InsufficientStockError and ProductNotFoundError properly', () => {
    const stockError = new InsufficientStockError()
    expect(stockError.message).toBe('Insufficient stock')

    const notFoundError = new ProductNotFoundError()
    expect(notFoundError.message).toBe('Product not found')
  })
})

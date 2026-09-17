import type { Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import {
  DomainError,
  InsufficientStockError,
  InvalidStockQuantityError,
  ProductNotFoundError,
  ReservationAlreadyCancelledError,
  ReservationNotFoundError,
} from '../../domain/errors'
import { handleHttpError } from './http-error.helper'

describe('handleHttpError', () => {
  const createMockResponse = () => {
    const res: Partial<Response> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    return res as Response
  }

  it('should return 404 for ProductNotFoundError', () => {
    const res = createMockResponse()
    const error = new ProductNotFoundError('Product not found')

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' })
  })

  it('should return 404 for ReservationNotFoundError', () => {
    const res = createMockResponse()
    const error = new ReservationNotFoundError('Reservation not found')

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Reservation not found' })
  })

  it('should return 409 for InsufficientStockError', () => {
    const res = createMockResponse()
    const error = new InsufficientStockError()

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: error.message })
  })

  it('should return 409 for ReservationAlreadyCancelledError', () => {
    const res = createMockResponse()
    const error = new ReservationAlreadyCancelledError()

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: error.message })
  })

  it('should return 400 for ZodError', () => {
    const res = createMockResponse()
    const error = new ZodError([])

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to process request. Please verify the input data and try again.',
    })
  })

  it('should return 400 for DomainError', () => {
    const res = createMockResponse()
    const error = new InvalidStockQuantityError('Custom domain error')

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Custom domain error' })
  })

  it('should return 400 for generic DomainError instance', () => {
    const res = createMockResponse()
    class CustomDomainError extends DomainError {}
    const error = new CustomDomainError('Generic domain issue')

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Generic domain issue' })
  })

  it('should return 500 for unknown errors', () => {
    const res = createMockResponse()
    const error = new Error('Unexpected crash')

    handleHttpError(error, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
  })
})

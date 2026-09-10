import type { Response } from 'express'
import { ZodError } from 'zod'
import { DomainError, InsufficientStockError, ProductNotFoundError } from '../../domain/errors'

export function handleHttpError(error: unknown, response: Response): Response {
  if (error instanceof ProductNotFoundError) {
    return response.status(404).json({ error: error.message })
  }
  if (error instanceof InsufficientStockError) {
    return response.status(409).json({ error: error.message })
  }
  if (error instanceof ZodError) {
    return response.status(400).json({ error: 'Failed to process request. Please verify the input data and try again.' })
  }
  if (error instanceof DomainError) {
    return response.status(400).json({ error: error.message })
  }

  return response.status(400).json({ error: (error as Error).message || 'Error' })
}

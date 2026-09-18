import { DomainError } from './domain.error'

export class InvalidStockQuantityError extends DomainError {
  constructor(message = 'Stock quantity must be a positive integer') {
    super(message)
  }
}

import { DomainError } from './domain.error'

export class InsufficientStockError extends DomainError {
  constructor(message = 'Insufficient stock') {
    super(message)
  }
}

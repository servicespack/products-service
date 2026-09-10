import { DomainError } from './domain.error'

export class ProductNotFoundError extends DomainError {
  constructor(message = 'Product not found') {
    super(message)
  }
}

import { DomainError } from './domain.error'

export class InvalidPaginationError extends DomainError {
  constructor() {
    super('Invalid pagination parameters')
  }
}
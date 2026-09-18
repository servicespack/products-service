import { DomainError } from './domain.error'

export class ReservationNotFoundError extends DomainError {
  constructor(message = 'Reservation not found') {
    super(message)
    this.name = 'ReservationNotFoundError'
  }
}

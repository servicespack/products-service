import { DomainError } from './domain.error'

export class ReservationAlreadyCancelledError extends DomainError {
  constructor(message = 'Reservation has already been cancelled') {
    super(message)
    this.name = 'ReservationAlreadyCancelledError'
  }
}

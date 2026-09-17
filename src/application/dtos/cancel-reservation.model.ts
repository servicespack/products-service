import type { Product } from '../../domain/entities/product.entity'
import type { Reservation } from '../../domain/entities/reservation.entity'

export interface CancelReservationRequest {
  readonly reservationId: string
  readonly reason?: string
}

export interface CancelReservationResponse {
  readonly reservation: Reservation
  readonly product: Product
}

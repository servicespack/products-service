import type { Product } from '../../domain/entities/product.entity'
import type { Reservation } from '../../domain/entities/reservation.entity'

export interface ReserveProductRequest {
  readonly quantity?: number
  readonly reason?: string
}

export interface ReserveProductResponse {
  readonly reservation: Reservation
  readonly product: Product
}

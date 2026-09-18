import type { IReservationDoc } from '../models/reservation.model'
import { Reservation } from '../../../../domain/entities/reservation.entity'

export class ReservationMapper {
  static toDomain(doc: IReservationDoc): Reservation {
    const id = doc.id ? doc.id : (doc._id as string | object).toString()

    return new Reservation({
      id,
      productId: doc.productId,
      quantity: doc.quantity,
      status: doc.status,
      reason: doc.reason ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  }

  static toPersistence(reservation: Reservation): Record<string, unknown> {
    const persistence: Record<string, unknown> = {
      _id: reservation.id,
      productId: reservation.productId,
      quantity: reservation.quantity,
      status: reservation.status,
    }

    if (reservation.reason !== undefined) {
      persistence.reason = reservation.reason
    }

    if (reservation.createdAt !== undefined) {
      persistence.createdAt = reservation.createdAt
    }

    if (reservation.updatedAt !== undefined) {
      persistence.updatedAt = reservation.updatedAt
    }

    return persistence
  }
}

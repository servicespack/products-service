import type { Reservation } from '../entities/reservation.entity'

export interface IReservationRepository {
  create: (reservation: Reservation) => Promise<Reservation>
  findById: (id: string) => Promise<Reservation | null>
  update: (reservation: Reservation) => Promise<Reservation>
}

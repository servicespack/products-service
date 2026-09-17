import type { Model } from 'mongoose'
import type { Reservation } from '../../../../domain/entities/reservation.entity'
import type { IReservationRepository } from '../../../../domain/repositories/reservation.repository.interface'
import type { IReservationDoc } from '../models/reservation.model'
import { ReservationMapper } from '../mappers/reservation.mapper'
import { transactionStorage } from '../transaction.context'

export class MongooseReservationRepository implements IReservationRepository {
  constructor(private readonly model: Model<IReservationDoc>) {}

  async create(reservation: Reservation): Promise<Reservation> {
    const session = transactionStorage.getStore()
    const result = await this.model.create(
      [ReservationMapper.toPersistence(reservation)],
      session ? { session } : undefined,
    )
    const created = Array.isArray(result) ? result[0] : result
    return ReservationMapper.toDomain(created)
  }

  async findById(id: string): Promise<Reservation | null> {
    const session = transactionStorage.getStore()
    const doc = await this.model.findById(id, null, session ? { session } : undefined)
    return doc ? ReservationMapper.toDomain(doc) : null
  }

  async update(reservation: Reservation): Promise<Reservation> {
    const session = transactionStorage.getStore()
    const doc = await this.model.findByIdAndUpdate(
      reservation.id,
      ReservationMapper.toPersistence(reservation),
      { new: true, session },
    )

    if (!doc) {
      throw new Error('Reservation not found')
    }

    return ReservationMapper.toDomain(doc)
  }
}

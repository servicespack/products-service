import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import type { ReserveProductRequest, ReserveProductResponse } from '../../dtos/reserve-product.model'
import type { ITransactionManager } from '../../interfaces/transaction-manager.interface'
import type { DecreaseStockUseCase } from './decrease-stock.use-case'
import crypto from 'node:crypto'
import { Reservation } from '../../../domain/entities/reservation.entity'

export class ReserveProductUseCase {
  constructor(
    private readonly decreaseStockUseCase: DecreaseStockUseCase,
    private readonly reservationRepository: IReservationRepository,
    private readonly transactionManager: ITransactionManager = { runInTransaction: work => work() },
  ) {}

  async execute(productId: string, request: ReserveProductRequest = {}): Promise<ReserveProductResponse> {
    const quantity = request.quantity ?? 1
    const reason = request.reason || 'Reservation'

    return this.transactionManager.runInTransaction(async () => {
      const product = await this.decreaseStockUseCase.execute(productId, { quantity, reason })

      const reservation = new Reservation({
        id: crypto.randomUUID(),
        productId,
        quantity,
        status: 'ACTIVE',
        reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const createdReservation = await this.reservationRepository.create(reservation)

      return {
        product,
        reservation: createdReservation,
      }
    })
  }
}

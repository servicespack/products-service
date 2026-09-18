import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import type { CancelReservationRequest, CancelReservationResponse } from '../../dtos/cancel-reservation.model'
import type { ITransactionManager } from '../../interfaces/transaction-manager.interface'
import type { IncreaseStockUseCase } from './increase-stock.use-case'
import { ReservationNotFoundError } from '../../../domain/errors'

export class CancelReservationUseCase {
  constructor(
    private readonly increaseStockUseCase: IncreaseStockUseCase,
    private readonly reservationRepository: IReservationRepository,
    private readonly transactionManager: ITransactionManager = { runInTransaction: work => work() },
  ) {}

  async execute(request: CancelReservationRequest): Promise<CancelReservationResponse> {
    if (!request.reservationId || request.reservationId.trim() === '') {
      throw new ReservationNotFoundError('Reservation ID is required')
    }

    return this.transactionManager.runInTransaction(async () => {
      const reservation = await this.reservationRepository.findById(request.reservationId)

      if (!reservation) {
        throw new ReservationNotFoundError()
      }

      reservation.cancel(request.reason)
      const updatedReservation = await this.reservationRepository.update(reservation)

      const product = await this.increaseStockUseCase.execute(reservation.productId, {
        quantity: reservation.quantity,
        reason: request.reason || 'Reservation Cancellation',
      })

      return {
        product,
        reservation: updatedReservation,
      }
    })
  }
}

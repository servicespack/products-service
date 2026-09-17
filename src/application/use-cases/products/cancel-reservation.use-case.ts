import type { Product } from '../../../domain/entities/product.entity'
import type { CancelReservationRequest } from '../../dtos/cancel-reservation.model'
import type { IncreaseStockUseCase } from './increase-stock.use-case'

export class CancelReservationUseCase {
  constructor(
    private readonly increaseStockUseCase: IncreaseStockUseCase,
  ) {}

  async execute(id: string, request: CancelReservationRequest = {}): Promise<Product> {
    const quantity = request.quantity ?? 1
    const reason = request.reason || 'Reservation Cancellation'

    return this.increaseStockUseCase.execute(id, { quantity, reason })
  }
}

import type { Product } from '../../../domain/entities/product.entity'
import type { ReserveProductRequest } from '../../dtos/reserve-product.model'
import type { DecreaseStockUseCase } from './decrease-stock.use-case'

export class ReserveProductUseCase {
  constructor(
    private readonly decreaseStockUseCase: DecreaseStockUseCase,
  ) {}

  async execute(id: string, request: ReserveProductRequest = {}): Promise<Product> {
    const quantity = request.quantity ?? 1
    const reason = request.reason || 'Reservation'

    return this.decreaseStockUseCase.execute(id, { quantity, reason })
  }
}

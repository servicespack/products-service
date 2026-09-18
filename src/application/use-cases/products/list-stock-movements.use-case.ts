import type { StockMovement } from '../../../domain/entities/stock-movement.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import type { ListStockMovementsRequest } from '../../dtos/list-stock-movements.model'
import { ProductNotFoundError } from '../../../domain/errors'

export class ListStockMovementsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(productId: string, request: ListStockMovementsRequest = {}): Promise<Array<StockMovement>> {
    const product = await this.productRepository.findById(productId, true)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    return this.stockMovementRepository.listByProductId({
      productId,
      page: request.page,
      pageSize: request.pageSize,
    })
  }
}

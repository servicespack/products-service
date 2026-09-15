import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import type { IncreaseStockRequest } from '../../dtos/increase-stock.model'
import crypto from 'node:crypto'
import { StockMovement } from '../../../domain/entities/stock-movement.entity'
import { InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'

export class IncreaseStockUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(id: string, request: IncreaseStockRequest): Promise<Product> {
    if (!Number.isInteger(request.quantity) || request.quantity <= 0) {
      throw new InvalidStockQuantityError()
    }

    const product = await this.productRepository.findById(id)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    const previousStock = product.stock
    const updatedProduct = await this.productRepository.incrementStock(id, request.quantity)

    if (updatedProduct === null) {
      throw new ProductNotFoundError()
    }

    await this.stockMovementRepository.create(new StockMovement({
      id: crypto.randomUUID(),
      productId: id,
      type: 'INCREMENT',
      quantity: request.quantity,
      previousStock,
      currentStock: updatedProduct.stock,
      reason: request.reason,
      createdAt: new Date(),
    }))

    return updatedProduct
  }
}

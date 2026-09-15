import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import type { DecreaseStockRequest } from '../../dtos/decrease-stock.model'
import crypto from 'node:crypto'
import { StockMovement } from '../../../domain/entities/stock-movement.entity'
import { InsufficientStockError, InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'

export class DecreaseStockUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(id: string, request: DecreaseStockRequest): Promise<Product> {
    if (!Number.isInteger(request.quantity) || request.quantity <= 0) {
      throw new InvalidStockQuantityError()
    }

    const product = await this.productRepository.findById(id)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    const previousStock = product.stock
    const updatedProduct = await this.productRepository.decrementStock(id, request.quantity)

    if (updatedProduct === null) {
      throw new InsufficientStockError()
    }

    await this.stockMovementRepository.create(new StockMovement({
      id: crypto.randomUUID(),
      productId: id,
      type: 'DECREMENT',
      quantity: request.quantity,
      previousStock,
      currentStock: updatedProduct.stock,
      reason: request.reason,
      createdAt: new Date(),
    }))

    return updatedProduct
  }
}

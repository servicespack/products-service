import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import type { DecreaseStockRequest } from '../../dtos/decrease-stock.model'
import type { ITransactionManager } from '../../interfaces/transaction-manager.interface'
import crypto from 'node:crypto'
import { StockMovement } from '../../../domain/entities/stock-movement.entity'
import { InsufficientStockError, InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'

export class DecreaseStockUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly transactionManager: ITransactionManager = { runInTransaction: work => work() },
  ) {}

  async execute(id: string, request: DecreaseStockRequest): Promise<Product> {
    if (!Number.isInteger(request.quantity) || request.quantity <= 0) {
      throw new InvalidStockQuantityError()
    }

    const product = await this.productRepository.findById(id)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    return this.transactionManager.runInTransaction(async () => {
      const updatedProduct = await this.productRepository.decrementStock(id, request.quantity)

      if (updatedProduct === null) {
        throw new InsufficientStockError()
      }

      const previousStock = updatedProduct.stock + request.quantity

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
    })
  }
}

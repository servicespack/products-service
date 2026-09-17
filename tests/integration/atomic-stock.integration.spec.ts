import { beforeEach, describe, expect, it } from 'vitest'
import { DecreaseStockUseCase } from '../../src/application/use-cases/products/decrease-stock.use-case'
import { IncreaseStockUseCase } from '../../src/application/use-cases/products/increase-stock.use-case'
import { Product } from '../../src/domain/entities/product.entity'
import { ProductModel } from '../../src/infrastructure/database/mongoose/models/product.model'
import { StockMovementModel } from '../../src/infrastructure/database/mongoose/models/stock-movement.model'
import { MongooseTransactionManager } from '../../src/infrastructure/database/mongoose/mongoose-transaction.manager'
import { MongooseProductRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-product.repository'
import { MongooseStockMovementRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-stock-movement.repository'

describe('atomic Stock Operations (Integration)', () => {
  let productRepository: MongooseProductRepository
  let stockMovementRepository: MongooseStockMovementRepository
  let transactionManager: MongooseTransactionManager
  let decreaseStockUseCase: DecreaseStockUseCase
  let increaseStockUseCase: IncreaseStockUseCase

  beforeEach(async () => {
    await ProductModel.deleteMany({})
    await StockMovementModel.deleteMany({})

    productRepository = new MongooseProductRepository(ProductModel)
    stockMovementRepository = new MongooseStockMovementRepository(StockMovementModel)
    transactionManager = new MongooseTransactionManager()

    decreaseStockUseCase = new DecreaseStockUseCase(productRepository, stockMovementRepository, transactionManager)
    increaseStockUseCase = new IncreaseStockUseCase(productRepository, stockMovementRepository, transactionManager)
  })

  it('should roll back stock decrement when movement creation fails', async () => {
    const product = await productRepository.create(new Product({
      name: 'Atomic Test Item',
      price: 50,
      stock: 10,
    }))

    // Mock stockMovementRepository.create to fail inside transaction
    const originalCreate = stockMovementRepository.create.bind(stockMovementRepository)
    stockMovementRepository.create = async () => {
      throw new Error('Simulated audit movement creation failure')
    }

    await expect(
      decreaseStockUseCase.execute(product.id!, { quantity: 4 }),
    ).rejects.toThrow('Simulated audit movement creation failure')

    // Stock must remain 10 because transaction rolled back
    const freshProduct = await productRepository.findById(product.id!)
    expect(freshProduct?.stock).toBe(10)

    const movements = await StockMovementModel.find({ productId: product.id })
    expect(movements).toHaveLength(0)

    stockMovementRepository.create = originalCreate
  })

  it('should roll back stock increment when movement creation fails', async () => {
    const product = await productRepository.create(new Product({
      name: 'Atomic Test Item 2',
      price: 50,
      stock: 10,
    }))

    const originalCreate = stockMovementRepository.create.bind(stockMovementRepository)
    stockMovementRepository.create = async () => {
      throw new Error('Simulated audit movement creation failure')
    }

    await expect(
      increaseStockUseCase.execute(product.id!, { quantity: 5 }),
    ).rejects.toThrow('Simulated audit movement creation failure')

    // Stock must remain 10 because transaction rolled back
    const freshProduct = await productRepository.findById(product.id!)
    expect(freshProduct?.stock).toBe(10)

    const movements = await StockMovementModel.find({ productId: product.id })
    expect(movements).toHaveLength(0)

    stockMovementRepository.create = originalCreate
  })
})

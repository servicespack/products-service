import { beforeEach, describe, expect, it } from 'vitest'
import { DecreaseStockUseCase } from '../../src/application/use-cases/products/decrease-stock.use-case'
import { IncreaseStockUseCase } from '../../src/application/use-cases/products/increase-stock.use-case'
import { ReserveProductUseCase } from '../../src/application/use-cases/products/reserve-product.use-case'
import { Product } from '../../src/domain/entities/product.entity'
import { ProductModel } from '../../src/infrastructure/database/mongoose/models/product.model'
import { ReservationModel } from '../../src/infrastructure/database/mongoose/models/reservation.model'
import { StockMovementModel } from '../../src/infrastructure/database/mongoose/models/stock-movement.model'
import { MongooseTransactionManager } from '../../src/infrastructure/database/mongoose/mongoose-transaction.manager'
import { MongooseProductRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-product.repository'
import { MongooseReservationRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-reservation.repository'
import { MongooseStockMovementRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-stock-movement.repository'

describe('atomic Stock Operations (Integration)', () => {
  let productRepository: MongooseProductRepository
  let stockMovementRepository: MongooseStockMovementRepository
  let reservationRepository: MongooseReservationRepository
  let transactionManager: MongooseTransactionManager
  let decreaseStockUseCase: DecreaseStockUseCase
  let increaseStockUseCase: IncreaseStockUseCase
  let reserveProductUseCase: ReserveProductUseCase

  beforeEach(async () => {
    await ProductModel.deleteMany({})
    await StockMovementModel.deleteMany({})
    await ReservationModel.deleteMany({})

    productRepository = new MongooseProductRepository(ProductModel)
    stockMovementRepository = new MongooseStockMovementRepository(StockMovementModel)
    reservationRepository = new MongooseReservationRepository(ReservationModel)
    transactionManager = new MongooseTransactionManager()

    decreaseStockUseCase = new DecreaseStockUseCase(productRepository, stockMovementRepository, transactionManager)
    increaseStockUseCase = new IncreaseStockUseCase(productRepository, stockMovementRepository, transactionManager)
    reserveProductUseCase = new ReserveProductUseCase(decreaseStockUseCase, reservationRepository, transactionManager)
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

  it('should roll back stock decrement in nested transaction when reservation creation fails', async () => {
    const product = await productRepository.create(new Product({
      name: 'Nested Atomic Test Item',
      price: 100,
      stock: 10,
    }))

    const originalCreate = reservationRepository.create.bind(reservationRepository)
    reservationRepository.create = async () => {
      throw new Error('Simulated reservation creation failure')
    }

    await expect(
      reserveProductUseCase.execute(product.id!, { quantity: 4 }),
    ).rejects.toThrow('Simulated reservation creation failure')

    // Stock must remain 10 because outer transaction rolled back inner decrease
    const freshProduct = await productRepository.findById(product.id!)
    expect(freshProduct?.stock).toBe(10)

    const movements = await StockMovementModel.find({ productId: product.id })
    expect(movements).toHaveLength(0)

    const reservations = await ReservationModel.find({ productId: product.id })
    expect(reservations).toHaveLength(0)

    reservationRepository.create = originalCreate
  })
})

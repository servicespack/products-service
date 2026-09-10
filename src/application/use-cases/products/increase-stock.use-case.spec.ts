import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'
import { IncreaseStockUseCase } from './increase-stock.use-case'

describe(IncreaseStockUseCase.name, () => {
  let productRepository: IProductRepository
  let stockMovementRepository: IStockMovementRepository
  let increaseStockUseCase: IncreaseStockUseCase

  beforeEach(() => {
    productRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      restore: vi.fn(),
      list: vi.fn(),
      decrementStock: vi.fn(),
      incrementStock: vi.fn(),
    }
    stockMovementRepository = {
      create: vi.fn(),
      listByProductId: vi.fn(),
    }
    increaseStockUseCase = new IncreaseStockUseCase(productRepository, stockMovementRepository)
  })

  it('should increase stock, create stock movement and return updated product', async () => {
    const existingProduct = new Product({
      id: faker.string.uuid(),
      name: 'Test Product',
      price: 100,
      stock: 5,
    })

    const updatedProduct = new Product({
      id: existingProduct.id,
      name: 'Test Product',
      price: 100,
      stock: 15,
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existingProduct)
    vi.mocked(productRepository.incrementStock).mockResolvedValueOnce(updatedProduct)

    const result = await increaseStockUseCase.execute(existingProduct.id!, { quantity: 10, reason: 'Restock' })

    expect(productRepository.findById).toHaveBeenCalledWith(existingProduct.id)
    expect(productRepository.incrementStock).toHaveBeenCalledWith(existingProduct.id, 10)
    expect(stockMovementRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: existingProduct.id,
      type: 'INCREMENT',
      quantity: 10,
      previousStock: 5,
      currentStock: 15,
      reason: 'Restock',
    }))
    expect(result.stock).toBe(15)
  })

  it('should throw InvalidStockQuantityError on non-positive or non-integer quantities', async () => {
    const id = faker.string.uuid()

    await expect(increaseStockUseCase.execute(id, { quantity: 0 }))
      .rejects
      .toThrow(InvalidStockQuantityError)
    await expect(increaseStockUseCase.execute(id, { quantity: -3 }))
      .rejects
      .toThrow(InvalidStockQuantityError)
    await expect(increaseStockUseCase.execute(id, { quantity: 1.1 }))
      .rejects
      .toThrow(InvalidStockQuantityError)
  })

  it('should throw ProductNotFoundError when product does not exist', async () => {
    const id = faker.string.uuid()
    vi.mocked(productRepository.findById).mockResolvedValueOnce(null)

    await expect(increaseStockUseCase.execute(id, { quantity: 5 }))
      .rejects
      .toThrow(ProductNotFoundError)

    expect(productRepository.incrementStock).not.toHaveBeenCalled()
  })
})

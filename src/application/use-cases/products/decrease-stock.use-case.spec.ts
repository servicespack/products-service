import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { InsufficientStockError, InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'
import { DecreaseStockUseCase } from './decrease-stock.use-case'

describe(DecreaseStockUseCase.name, () => {
  let productRepository: IProductRepository
  let stockMovementRepository: IStockMovementRepository
  let decreaseStockUseCase: DecreaseStockUseCase

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
    decreaseStockUseCase = new DecreaseStockUseCase(productRepository, stockMovementRepository)
  })

  it('should decrease stock, create stock movement and return updated product', async () => {
    const existingProduct = new Product({
      id: faker.string.uuid(),
      name: 'Test Product',
      price: 100,
      stock: 10,
    })

    const updatedProduct = new Product({
      id: existingProduct.id,
      name: 'Test Product',
      price: 100,
      stock: 7,
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existingProduct)
    vi.mocked(productRepository.decrementStock).mockResolvedValueOnce(updatedProduct)

    const result = await decreaseStockUseCase.execute(existingProduct.id!, { quantity: 3, reason: 'Sale' })

    expect(productRepository.findById).toHaveBeenCalledWith(existingProduct.id)
    expect(productRepository.decrementStock).toHaveBeenCalledWith(existingProduct.id, 3)
    expect(stockMovementRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: existingProduct.id,
      type: 'DECREMENT',
      quantity: 3,
      previousStock: 10,
      currentStock: 7,
      reason: 'Sale',
    }))
    expect(result.stock).toBe(7)
  })

  it('should throw InvalidStockQuantityError on non-positive or non-integer quantities', async () => {
    const id = faker.string.uuid()

    await expect(decreaseStockUseCase.execute(id, { quantity: 0 }))
      .rejects
      .toThrow(InvalidStockQuantityError)
    await expect(decreaseStockUseCase.execute(id, { quantity: -5 }))
      .rejects
      .toThrow(InvalidStockQuantityError)
    await expect(decreaseStockUseCase.execute(id, { quantity: 2.5 }))
      .rejects
      .toThrow(InvalidStockQuantityError)
  })

  it('should throw ProductNotFoundError when product does not exist', async () => {
    const id = faker.string.uuid()
    vi.mocked(productRepository.findById).mockResolvedValueOnce(null)

    await expect(decreaseStockUseCase.execute(id, { quantity: 2 }))
      .rejects
      .toThrow(ProductNotFoundError)

    expect(productRepository.decrementStock).not.toHaveBeenCalled()
  })

  it('should throw InsufficientStockError when decrementStock returns null (insufficient stock)', async () => {
    const existingProduct = new Product({
      id: faker.string.uuid(),
      name: 'Test Product',
      price: 100,
      stock: 2,
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existingProduct)
    vi.mocked(productRepository.decrementStock).mockResolvedValueOnce(null)

    await expect(decreaseStockUseCase.execute(existingProduct.id!, { quantity: 5 }))
      .rejects
      .toThrow(InsufficientStockError)
  })
})

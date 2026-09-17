import type { DecreaseStockUseCase } from './decrease-stock.use-case'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { InsufficientStockError, InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'
import { ReserveProductUseCase } from './reserve-product.use-case'

describe(ReserveProductUseCase.name, () => {
  let decreaseStockUseCase: DecreaseStockUseCase
  let reserveProductUseCase: ReserveProductUseCase

  beforeEach(() => {
    decreaseStockUseCase = {
      execute: vi.fn(),
    } as unknown as DecreaseStockUseCase

    reserveProductUseCase = new ReserveProductUseCase(decreaseStockUseCase)
  })

  it('should reserve product with default quantity 1 and default reason Reservation', async () => {
    const productId = faker.string.uuid()
    const product = new Product({
      id: productId,
      name: 'Test Product',
      price: 100,
      stock: 9,
    })

    vi.mocked(decreaseStockUseCase.execute).mockResolvedValueOnce(product)

    const result = await reserveProductUseCase.execute(productId)

    expect(decreaseStockUseCase.execute).toHaveBeenCalledWith(productId, {
      quantity: 1,
      reason: 'Reservation',
    })
    expect(result).toBe(product)
  })

  it('should reserve product with custom quantity and reason', async () => {
    const productId = faker.string.uuid()
    const product = new Product({
      id: productId,
      name: 'Test Product',
      price: 100,
      stock: 5,
    })

    vi.mocked(decreaseStockUseCase.execute).mockResolvedValueOnce(product)

    const result = await reserveProductUseCase.execute(productId, {
      quantity: 5,
      reason: 'Order #1234',
    })

    expect(decreaseStockUseCase.execute).toHaveBeenCalledWith(productId, {
      quantity: 5,
      reason: 'Order #1234',
    })
    expect(result).toBe(product)
  })

  it('should throw ProductNotFoundError if product does not exist', async () => {
    const productId = faker.string.uuid()

    vi.mocked(decreaseStockUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

    await expect(reserveProductUseCase.execute(productId)).rejects.toThrow(ProductNotFoundError)
  })

  it('should throw InsufficientStockError if stock is insufficient', async () => {
    const productId = faker.string.uuid()

    vi.mocked(decreaseStockUseCase.execute).mockRejectedValueOnce(new InsufficientStockError())

    await expect(reserveProductUseCase.execute(productId, { quantity: 10 })).rejects.toThrow(InsufficientStockError)
  })

  it('should throw InvalidStockQuantityError if quantity is invalid', async () => {
    const productId = faker.string.uuid()

    vi.mocked(decreaseStockUseCase.execute).mockRejectedValueOnce(new InvalidStockQuantityError())

    await expect(reserveProductUseCase.execute(productId, { quantity: -1 })).rejects.toThrow(InvalidStockQuantityError)
  })
})

import type { IncreaseStockUseCase } from './increase-stock.use-case'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { InvalidStockQuantityError, ProductNotFoundError } from '../../../domain/errors'
import { CancelReservationUseCase } from './cancel-reservation.use-case'

describe(CancelReservationUseCase.name, () => {
  let increaseStockUseCase: IncreaseStockUseCase
  let cancelReservationUseCase: CancelReservationUseCase

  beforeEach(() => {
    increaseStockUseCase = {
      execute: vi.fn(),
    } as unknown as IncreaseStockUseCase

    cancelReservationUseCase = new CancelReservationUseCase(increaseStockUseCase)
  })

  it('should cancel reservation with default quantity 1 and default reason', async () => {
    const productId = faker.string.uuid()
    const product = new Product({
      id: productId,
      name: 'Test Product',
      price: 100,
      stock: 10,
    })

    vi.mocked(increaseStockUseCase.execute).mockResolvedValueOnce(product)

    const result = await cancelReservationUseCase.execute(productId)

    expect(increaseStockUseCase.execute).toHaveBeenCalledWith(productId, {
      quantity: 1,
      reason: 'Reservation Cancellation',
    })
    expect(result).toBe(product)
  })

  it('should cancel reservation with custom quantity and reason', async () => {
    const productId = faker.string.uuid()
    const product = new Product({
      id: productId,
      name: 'Test Product',
      price: 100,
      stock: 15,
    })

    vi.mocked(increaseStockUseCase.execute).mockResolvedValueOnce(product)

    const result = await cancelReservationUseCase.execute(productId, {
      quantity: 5,
      reason: 'Order #123 Cancelled',
    })

    expect(increaseStockUseCase.execute).toHaveBeenCalledWith(productId, {
      quantity: 5,
      reason: 'Order #123 Cancelled',
    })
    expect(result).toBe(product)
  })

  it('should throw ProductNotFoundError if product does not exist', async () => {
    const productId = faker.string.uuid()

    vi.mocked(increaseStockUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

    await expect(cancelReservationUseCase.execute(productId)).rejects.toThrow(ProductNotFoundError)
  })

  it('should throw InvalidStockQuantityError if quantity is invalid', async () => {
    const productId = faker.string.uuid()

    vi.mocked(increaseStockUseCase.execute).mockRejectedValueOnce(new InvalidStockQuantityError())

    await expect(cancelReservationUseCase.execute(productId, { quantity: -1 })).rejects.toThrow(InvalidStockQuantityError)
  })
})

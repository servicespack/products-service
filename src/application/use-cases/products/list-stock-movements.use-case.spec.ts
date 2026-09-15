import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { IStockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { StockMovement } from '../../../domain/entities/stock-movement.entity'
import { ProductNotFoundError } from '../../../domain/errors'
import { ListStockMovementsUseCase } from './list-stock-movements.use-case'

describe(ListStockMovementsUseCase.name, () => {
  let productRepository: IProductRepository
  let stockMovementRepository: IStockMovementRepository
  let useCase: ListStockMovementsUseCase

  beforeEach(() => {
    productRepository = {
      findById: vi.fn(),
    } as unknown as IProductRepository

    stockMovementRepository = {
      listByProductId: vi.fn(),
    } as unknown as IStockMovementRepository

    useCase = new ListStockMovementsUseCase(productRepository, stockMovementRepository)
  })

  it('should list stock movements for an existing product', async () => {
    const product = new Product({ id: 'prod-1', name: 'Item', price: 10 })
    const movements = [
      new StockMovement({
        id: 'mov-1',
        productId: 'prod-1',
        type: 'INCREMENT',
        quantity: 10,
        previousStock: 0,
        currentStock: 10,
      }),
    ]

    vi.mocked(productRepository.findById).mockResolvedValueOnce(product)
    vi.mocked(stockMovementRepository.listByProductId).mockResolvedValueOnce(movements)

    const result = await useCase.execute('prod-1', { page: 1, pageSize: 10 })

    expect(result).toEqual(movements)
    expect(productRepository.findById).toHaveBeenCalledWith('prod-1', true)
    expect(stockMovementRepository.listByProductId).toHaveBeenCalledWith({
      productId: 'prod-1',
      page: 1,
      pageSize: 10,
    })
  })

  it('should throw ProductNotFoundError if product does not exist', async () => {
    vi.mocked(productRepository.findById).mockResolvedValueOnce(null)

    await expect(useCase.execute('non-existent')).rejects.toThrow(ProductNotFoundError)
    expect(stockMovementRepository.listByProductId).not.toHaveBeenCalled()
  })
})

import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { GetLowStockProductsUseCase } from './get-low-stock-products.use-case'

describe(GetLowStockProductsUseCase.name, () => {
  let productRepository: IProductRepository
  let getLowStockProductsUseCase: GetLowStockProductsUseCase

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
      getCatalogSummary: vi.fn(),
      getLowStock: vi.fn(),
    }
    getLowStockProductsUseCase = new GetLowStockProductsUseCase(productRepository)
  })

  it('should return low stock products from repository with default threshold 5', async () => {
    const products = [
      new Product({ name: 'Low Stock Item', price: 10, stock: 2 }),
    ]

    vi.mocked(productRepository.getLowStock).mockResolvedValueOnce(products)

    const result = await getLowStockProductsUseCase.execute()

    expect(productRepository.getLowStock).toHaveBeenCalledWith(5)
    expect(result).toEqual(products)
  })

  it('should pass custom threshold to repository', async () => {
    vi.mocked(productRepository.getLowStock).mockResolvedValueOnce([])

    const result = await getLowStockProductsUseCase.execute(10)

    expect(productRepository.getLowStock).toHaveBeenCalledWith(10)
    expect(result).toEqual([])
  })
})

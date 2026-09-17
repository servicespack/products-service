import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvalidPaginationError } from '../../../domain/errors'
import { ListProductsUseCase } from './list-products.use-case'

describe(ListProductsUseCase.name, () => {
  let productRepository: IProductRepository
  let listProductsUseCase: ListProductsUseCase

  beforeEach(() => {
    productRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      restore: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      decrementStock: vi.fn(),
      incrementStock: vi.fn(),
      getCatalogSummary: vi.fn(),
      getLowStock: vi.fn(),
    }
    listProductsUseCase = new ListProductsUseCase(productRepository)
  })

  it('should throw InvalidPaginationError when page is less than 1', async () => {
    await expect(listProductsUseCase.execute({ page: 0 }))
      .rejects
      .toThrow(InvalidPaginationError)
  })

  it('should throw InvalidPaginationError when pageSize is less than 1', async () => {
    await expect(listProductsUseCase.execute({ pageSize: 0 }))
      .rejects
      .toThrow(InvalidPaginationError)
  })

  it('should return a list of products with default params', async () => {
    const returned = await listProductsUseCase.execute()

    expect(returned).toEqual([])
    expect(productRepository.list).toHaveBeenCalledWith({
      search: undefined,
      sku: undefined,
      category: undefined,
      tag: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      active: undefined,
      includeDeleted: undefined,
      onlyDeleted: undefined,
      page: 1,
      pageSize: 20,
    })
  })

  it('should call productRepository.list with correct params', async () => {
    const request = {
      search: faker.commerce.product(),
      sku: 'SKU-123',
      category: 'Electronics',
      tag: 'sale',
      minPrice: 10,
      maxPrice: 100,
      active: true,
      includeDeleted: true,
      onlyDeleted: false,
      page: 2,
      pageSize: 10,
    }

    await listProductsUseCase.execute(request)

    expect(productRepository.list).toHaveBeenCalledWith({
      search: request.search,
      sku: 'SKU-123',
      category: 'Electronics',
      tag: 'sale',
      minPrice: 10,
      maxPrice: 100,
      active: true,
      includeDeleted: true,
      onlyDeleted: false,
      page: 2,
      pageSize: 10,
    })
  })
})

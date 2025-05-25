import type { IProductRepository } from '../interfaces/product-repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListProductsUseCase } from './list-products.use-case'

describe(ListProductsUseCase.name, () => {
  let productRepository: IProductRepository
  let listProductsUseCase: ListProductsUseCase

  beforeEach(() => {
    productRepository = {
      findAll: vi.fn().mockResolvedValueOnce([]),
    } as unknown as IProductRepository
    listProductsUseCase = new ListProductsUseCase(productRepository)
  })

  it('should return a list of products', async () => {
    const returned = await listProductsUseCase.execute({})

    expect(returned).toEqual([])
  })
})

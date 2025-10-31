import type { IProductRepository } from '../interfaces/product-repository.interface'
import { faker } from '@faker-js/faker'
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

  it('should call productRepository.findAll with default params', async () => {
    await listProductsUseCase.execute({})

    expect(productRepository.findAll).toHaveBeenCalledWith({
      search: undefined,
      offset: 0,
      limit: 20,
    })
  })

  it('should call productRepository.findAll with correct params', async () => {
    const dto = {
      search: faker.commerce.product(),
      page: 2,
      pageSize: 10,
    }

    await listProductsUseCase.execute(dto)

    expect(productRepository.findAll).toHaveBeenCalledWith({
      search: dto.search,
      offset: 10,
      limit: 10,
    })
  })
})

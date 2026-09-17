import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { ProductNotFoundError } from '../../../domain/errors'
import { GetProductByIdUseCase } from './get-product-by-id.use-case'

describe(GetProductByIdUseCase.name, () => {
  let productRepository: IProductRepository
  let getProductByIdUseCase: GetProductByIdUseCase

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
    getProductByIdUseCase = new GetProductByIdUseCase(productRepository)
  })

  it('should return the product when found', async () => {
    const product = new Product({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(product)

    const result = await getProductByIdUseCase.execute(product.id!)

    expect(result).toEqual(product)
    expect(productRepository.findById).toHaveBeenCalledWith(product.id, false)
  })

  it('should pass includeDeleted parameter to repository', async () => {
    const product = new Product({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
      deletedAt: new Date(),
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(product)

    const result = await getProductByIdUseCase.execute(product.id!, true)

    expect(result).toEqual(product)
    expect(productRepository.findById).toHaveBeenCalledWith(product.id, true)
  })

  it('should throw ProductNotFoundError when product is not found', async () => {
    const id = faker.string.uuid()
    vi.mocked(productRepository.findById).mockResolvedValueOnce(null)

    await expect(getProductByIdUseCase.execute(id)).rejects.toThrow(ProductNotFoundError)
    expect(productRepository.findById).toHaveBeenCalledWith(id, false)
  })
})

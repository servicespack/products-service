import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { ProductNotFoundError } from '../../../domain/errors'
import { DeleteProductUseCase } from './delete-product.use-case'

describe(DeleteProductUseCase.name, () => {
  let productRepository: IProductRepository
  let deleteProductUseCase: DeleteProductUseCase

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
    deleteProductUseCase = new DeleteProductUseCase(productRepository)
  })

  it('should delete the product when found', async () => {
    const existingProduct = new Product({
      id: faker.string.uuid(),
      name: 'Product to delete',
      price: 50,
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existingProduct)
    vi.mocked(productRepository.delete).mockResolvedValueOnce(true)

    await deleteProductUseCase.execute(existingProduct.id!)

    expect(productRepository.findById).toHaveBeenCalledWith(existingProduct.id)
    expect(productRepository.delete).toHaveBeenCalledWith(existingProduct.id)
  })

  it('should throw ProductNotFoundError when product does not exist', async () => {
    vi.mocked(productRepository.findById).mockResolvedValueOnce(null)

    const id = faker.string.uuid()
    await expect(deleteProductUseCase.execute(id))
      .rejects
      .toThrow(ProductNotFoundError)

    expect(productRepository.findById).toHaveBeenCalledWith(id)
    expect(productRepository.delete).not.toHaveBeenCalled()
  })
})

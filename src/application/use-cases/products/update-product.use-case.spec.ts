import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { ProductNotFoundError } from '../../../domain/errors'
import { UpdateProductUseCase } from './update-product.use-case'

describe(UpdateProductUseCase.name, () => {
  let productRepository: IProductRepository
  let updateProductUseCase: UpdateProductUseCase

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
    updateProductUseCase = new UpdateProductUseCase(productRepository)
  })

  it('should update and return the product', async () => {
    const existingProduct = new Product({
      id: faker.string.uuid(),
      name: 'Original Name',
      price: 100,
      description: 'Original Description',
      sku: 'SKU-ORIG',
      stock: 10,
      active: true,
    })

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existingProduct)
    vi.mocked(productRepository.update).mockImplementationOnce(async product => product)

    const updateData = {
      name: 'Updated Name',
      price: 150,
      description: 'Updated Description',
      sku: 'SKU-UPDATED',
      categories: ['Peripherals'],
      tags: ['wireless'],
      stock: 20,
      active: false,
    }

    const result = await updateProductUseCase.execute(existingProduct.id!, updateData)

    expect(productRepository.findById).toHaveBeenCalledWith(existingProduct.id)
    expect(productRepository.update).toHaveBeenCalledWith(existingProduct)
    expect(result.name).toBe('Updated Name')
    expect(result.price).toBe(150)
    expect(result.description).toBe('Updated Description')
    expect(result.sku).toBe('SKU-UPDATED')
    expect(result.categories).toEqual(['Peripherals'])
    expect(result.tags).toEqual(['wireless'])
    expect(result.stock).toBe(20)
    expect(result.active).toBe(false)
  })

  it('should throw ProductNotFoundError when product does not exist', async () => {
    vi.mocked(productRepository.findById).mockResolvedValueOnce(null)

    const id = faker.string.uuid()
    await expect(updateProductUseCase.execute(id, { name: 'New Name' }))
      .rejects
      .toThrow(ProductNotFoundError)

    expect(productRepository.findById).toHaveBeenCalledWith(id)
    expect(productRepository.update).not.toHaveBeenCalled()
  })
})

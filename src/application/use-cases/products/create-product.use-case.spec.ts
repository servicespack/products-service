import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { CreateProductRequest } from '../../dtos/create-product.model'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { CreateProductUseCase } from './create-product.use-case'

describe(CreateProductUseCase.name, () => {
  let createProductUseCase: CreateProductUseCase
  let productRepository: IProductRepository

  beforeEach(() => {
    productRepository = {
      create: vi.fn(entity => Promise.resolve(entity)),
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

    createProductUseCase = new CreateProductUseCase(productRepository)
  })

  it('should create and return product', async () => {
    const request: CreateProductRequest = {
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
      description: faker.commerce.productDescription(),
      sku: 'SKU-123',
      categories: ['Hardware', 'Accessories'],
      tags: ['usb', 'tech'],
      stock: 50,
      active: true,
    }

    const output = await createProductUseCase.execute(request)

    expect(output).toBeInstanceOf(Product)
    expect(output.id).toEqual(expect.any(String))
    expect(output.name).toBe(request.name)
    expect(output.price).toBe(request.price)
    expect(output.description).toBe(request.description)
    expect(output.sku).toBe(request.sku)
    expect(output.categories).toEqual(['Hardware', 'Accessories'])
    expect(output.tags).toEqual(['usb', 'tech'])
    expect(output.stock).toBe(request.stock)
    expect(output.active).toBe(true)
    expect(output.createdAt).toEqual(expect.any(Date))
    expect(output.updatedAt).toEqual(expect.any(Date))
    expect(productRepository.create).toHaveBeenCalledWith(output)
  })
})

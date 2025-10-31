import type { CreateProductDto } from '../../dtos/create-product.dto'
import type { IProductRepository } from '../interfaces/product-repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateProductUseCase } from './create-product.use-case'

describe(CreateProductUseCase.name, () => {
  let createProductUseCase: CreateProductUseCase
  let mocksProductRepository: IProductRepository

  beforeEach(() => {
    mocksProductRepository = {
      insert: vi.fn(entity => entity),
    }

    createProductUseCase = new CreateProductUseCase(
      mocksProductRepository,
    )
  })

  it('should return the created product', async () => {
    const input = {
      name: 'Product 1',
      price: 100,
      description: 'A great product',
      sku: 'PROD-001',
      stock: 50,
    } as CreateProductDto

    const output = await createProductUseCase.execute(input)

    expect(output).toEqual({
      id: expect.any(String),
      name: input.name,
      price: input.price,
      description: input.description,
      sku: input.sku,
      stock: input.stock,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })
  })
})

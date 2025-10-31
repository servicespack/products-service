import type { CreateProductInputDto } from '../dtos/create-product-input.dto'
import type { IProductRepository } from '../interfaces/product-repository.interface'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateProductUseCase } from './create-product.use-case'

describe(CreateProductUseCase.name, () => {
  let createProductUseCase: CreateProductUseCase
  let mocksProductRepository: IProductRepository

  beforeEach(() => {
    mocksProductRepository = {
      insert: vi.fn(entity => entity),
    } as unknown as IProductRepository

    createProductUseCase = new CreateProductUseCase(
      mocksProductRepository,
    )
  })

  it('should return the created product', async () => {
    const input = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.number.float({ min: 0, max: 1000 }),
      sku: 'PROD-001',
      stock: 50,
    } as CreateProductInputDto

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

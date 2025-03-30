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
    }

    const output = await createProductUseCase.execute(input)

    expect(output).toEqual({
      id: expect.any(String),
      ...input,
    })
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { CreateProductUseCase } from './create-product.use-case'

describe(CreateProductUseCase.name, () => {
  let createProductUseCase: CreateProductUseCase

  beforeEach(() => {
    createProductUseCase = new CreateProductUseCase()
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

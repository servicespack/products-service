import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../domain/entities/product.entity'
import { ProductNotFoundError } from '../../../domain/errors'
import { RestoreProductUseCase } from './restore-product.use-case'

describe(RestoreProductUseCase.name, () => {
  let useCase: RestoreProductUseCase
  let repository: IProductRepository

  beforeEach(() => {
    repository = {
      findById: vi.fn(),
      restore: vi.fn(),
    } as unknown as IProductRepository

    useCase = new RestoreProductUseCase(repository)
  })

  it('should restore a soft-deleted product', async () => {
    const deletedProduct = new Product({
      id: 'prod-1',
      name: 'Item',
      price: 100,
      deletedAt: new Date(),
    })

    const restoredProduct = new Product({
      id: 'prod-1',
      name: 'Item',
      price: 100,
      deletedAt: null,
    })

    vi.mocked(repository.findById).mockResolvedValueOnce(deletedProduct)
    vi.mocked(repository.restore).mockResolvedValueOnce(restoredProduct)

    const result = await useCase.execute('prod-1')

    expect(result).toBe(restoredProduct)
    expect(repository.findById).toHaveBeenCalledWith('prod-1', true)
    expect(repository.restore).toHaveBeenCalledWith('prod-1')
  })

  it('should throw ProductNotFoundError if product does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValueOnce(null)

    await expect(useCase.execute('non-existent')).rejects.toThrow(ProductNotFoundError)
  })

  it('should throw ProductNotFoundError if restore fails or returns null', async () => {
    const product = new Product({ id: 'prod-1', name: 'Item', price: 100 })
    vi.mocked(repository.findById).mockResolvedValueOnce(product)
    vi.mocked(repository.restore).mockResolvedValueOnce(null)

    await expect(useCase.execute('prod-1')).rejects.toThrow(ProductNotFoundError)
  })
})

import type { CatalogSummary, IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetCatalogSummaryUseCase } from './get-catalog-summary.use-case'

describe(GetCatalogSummaryUseCase.name, () => {
  let productRepository: IProductRepository
  let getCatalogSummaryUseCase: GetCatalogSummaryUseCase

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
    getCatalogSummaryUseCase = new GetCatalogSummaryUseCase(productRepository)
  })

  it('should return catalog summary from repository', async () => {
    const summary: CatalogSummary = {
      totalProducts: 10,
      categories: { Electronics: 5, Books: 5 },
      priceRange: {
        min: 10,
        max: 100,
        average: 55,
      },
    }

    vi.mocked(productRepository.getCatalogSummary).mockResolvedValueOnce(summary)

    const result = await getCatalogSummaryUseCase.execute()

    expect(productRepository.getCatalogSummary).toHaveBeenCalledOnce()
    expect(result).toEqual(summary)
  })
})

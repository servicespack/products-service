import type { CatalogSummary, IProductRepository } from '../../../domain/repositories/product.repository.interface'

export class GetCatalogSummaryUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(): Promise<CatalogSummary> {
    return this.productRepository.getCatalogSummary()
  }
}

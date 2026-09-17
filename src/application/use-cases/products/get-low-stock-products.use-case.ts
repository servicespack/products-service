import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'

export class GetLowStockProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(threshold = 5): Promise<Array<Product>> {
    return this.productRepository.getLowStock(threshold)
  }
}

import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { ProductNotFoundError } from '../../../domain/errors'

export class RestoreProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id, true)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    const restoredProduct = await this.productRepository.restore(id)

    if (restoredProduct === null) {
      throw new ProductNotFoundError()
    }

    return restoredProduct
  }
}

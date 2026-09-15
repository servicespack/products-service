import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { ProductNotFoundError } from '../../../domain/errors'

export class GetProductByIdUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, includeDeleted = false): Promise<Product> {
    const product = await this.productRepository.findById(id, includeDeleted)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    return product
  }
}

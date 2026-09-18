import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { UpdateProductRequest } from '../../dtos/update-product.model'
import { ProductNotFoundError } from '../../../domain/errors'

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, request: UpdateProductRequest): Promise<Product> {
    const product = await this.productRepository.findById(id)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    product.update(request)

    return this.productRepository.update(product)
  }
}

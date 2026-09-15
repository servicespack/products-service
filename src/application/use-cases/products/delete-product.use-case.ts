import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { ProductNotFoundError } from '../../../domain/errors'

export class DeleteProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id)

    if (product === null) {
      throw new ProductNotFoundError()
    }

    await this.productRepository.delete(id)
  }
}

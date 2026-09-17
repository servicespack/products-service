import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import { ProductNotFoundError } from '../../../domain/errors'

export class DeleteProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const success = await this.productRepository.delete(id)

    if (!success) {
      throw new ProductNotFoundError()
    }
  }
}

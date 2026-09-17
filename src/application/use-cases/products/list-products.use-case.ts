import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { ListProductsRequest } from '../../dtos/list-products.model'
import { InvalidPaginationError } from '../../../domain/errors'

export class ListProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(request: ListProductsRequest = {}): Promise<Array<Product>> {
    const { page = 1, pageSize = 20, search, sku, category, tag, minPrice, maxPrice, active, includeDeleted, onlyDeleted } = request

    if (!Number.isFinite(page) || page < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      throw new InvalidPaginationError()
    }

    return this.productRepository.list({
      search,
      sku,
      category,
      tag,
      minPrice,
      maxPrice,
      active,
      includeDeleted,
      onlyDeleted,
      page,
      pageSize,
    })
  }
}

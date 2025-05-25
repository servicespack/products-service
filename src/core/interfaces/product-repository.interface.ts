import type { ProductEntity } from '../entities/product.entity'

export interface IProductRepository {
  findAll: (params?: {
    search?: string
  }) => Promise<Array<ProductEntity>>
  insert: (product: ProductEntity) => Promise<ProductEntity>
}

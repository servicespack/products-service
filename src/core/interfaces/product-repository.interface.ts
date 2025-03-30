import type { ProductEntity } from '../entities/product.entity'

export interface IProductRepository {
  insert: (product: ProductEntity) => Promise<ProductEntity>
}

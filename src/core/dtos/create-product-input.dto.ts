import type { ProductEntity } from '../entities/product.entity'

export type CreateProductInputDto = Pick<ProductEntity, 'name' | 'description' | 'price' | 'sku' | 'stock' >

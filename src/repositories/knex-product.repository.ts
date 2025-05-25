import type { ProductEntity } from '../core/entities/product.entity'
import type { IProductRepository } from '../core/interfaces/product-repository.interface'
import { KnexRepository } from './knex.repository'

export class KnexProductRepository extends KnexRepository implements IProductRepository {
  public async insert(product: ProductEntity) {
    await this.knex('products').insert(product)
    return product
  }

  public async findAll(_params: { search?: string } = {}) {
    return []
  }
}

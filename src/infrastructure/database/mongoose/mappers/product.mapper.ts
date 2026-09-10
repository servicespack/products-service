import type { IProductDoc } from '../models/product.model'
import { Product } from '../../../../domain/entities/product.entity'

export class ProductMapper {
  static toDomain(doc: IProductDoc): Product {
    const id = doc.id ? doc.id : (doc._id as string | object).toString()

    return new Product({
      id,
      name: doc.name,
      price: doc.price,
      description: doc.description ?? undefined,
      sku: doc.sku ?? undefined,
      categories: doc.categories ?? [],
      tags: doc.tags ?? [],
      active: doc.active,
      stock: doc.stock,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  }

  static toPersistence(product: Product): Record<string, unknown> {
    const persistence: Record<string, unknown> = {
      name: product.name,
      price: product.price,
      categories: [...product.categories],
      tags: [...product.tags],
      active: product.active,
      stock: product.stock,
      deletedAt: product.deletedAt ?? null,
    }

    if (product.description !== undefined) {
      persistence.description = product.description
    }

    if (product.sku !== undefined) {
      persistence.sku = product.sku
    }

    return persistence
  }
}

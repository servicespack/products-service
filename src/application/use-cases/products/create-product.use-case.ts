import type { Product } from '../../../domain/entities/product.entity'
import type { IProductRepository } from '../../../domain/repositories/product.repository.interface'
import type { CreateProductRequest } from '../../dtos/create-product.model'
import crypto from 'node:crypto'
import { Product as ProductEntity } from '../../../domain/entities/product.entity'

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(request: CreateProductRequest): Promise<Product> {
    const product = new ProductEntity({
      id: crypto.randomUUID(),
      name: request.name,
      price: request.price,
      description: request.description,
      sku: request.sku,
      categories: request.categories,
      tags: request.tags,
      stock: request.stock,
      active: request.active,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return this.productRepository.create(product)
  }
}

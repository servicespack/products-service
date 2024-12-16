import { EntityManager } from '@mikro-orm/core';
import { CreateProductDto } from '../dtos/create-product.dto';
import { ProductEntity } from '../entities/product.entity';
import { err, ok, Result } from 'neverthrow';
import { logger } from '../logger';

export class ProductsService {
  constructor (
    private readonly em: EntityManager
  ) {}

  public async create(dto: CreateProductDto): Promise<Result<ProductEntity, string>> {
    try {
      const data = CreateProductDto.parse(dto)
  
      const product = new ProductEntity()
      product.name = data.name
  
      await this
        .em
        .persist(product)
        .flush()
  
      return ok(product)
    } catch (error) {
      logger.error(error)
      return err('Failed to create product. Please verify the input data and try again.')
    }
  }

  public async list(): Promise<Result<ProductEntity[], string>> {
    try {
      const products = await this
        .em
        .findAll(ProductEntity)
  
      return ok(products)
    } catch (error) {
      return err('Error')
    }
  }
}

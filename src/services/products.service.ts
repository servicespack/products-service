import type { Result } from 'neverthrow'
import { EntityManager } from '@mikro-orm/core'
import { inject, injectable } from 'inversify'
import { err, ok } from 'neverthrow'
import { logger } from '../config/logger.config'
import { CreateProductDto } from '../dtos/create-product.dto'
import { ProductEntity } from '../entities/product.entity'

@injectable()
export class ProductsService {
  @inject(EntityManager.name)
  private readonly em!: EntityManager

  public async create(dto: CreateProductDto): Promise<Result<ProductEntity, string>> {
    try {
      const data = CreateProductDto.parse(dto)

      const product = new ProductEntity()
      product.name = data.name
      product.price = data.price

      await this
        .em
        .persist(product)
        .flush()

      return ok(product)
    }
    catch (error) {
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
    }
    catch (error) {
      logger.error(error)
      return err('Error')
    }
  }

  public async findById(id: string): Promise<Result<ProductEntity, string>> {
    try {
      const product = await this
        .em
        .findOne(ProductEntity, { id })

      if (!product) {
        return err('Not found')
      }

      return ok(product)
    }
    catch (error) {
      logger.error(error)
      return err('Not found')
    }
  }
}

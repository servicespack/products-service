import type { CreateProductInputDto } from '../dtos/create-product-input.dto'
import type { CreateProductOutputDto } from '../dtos/create-product-output.dto'
import type { IUseCase } from '../interfaces/use-case.interface'
import * as crypto from 'node:crypto'
import { ProductEntity } from '../entities/product.entity'

export class CreateProductUseCase implements IUseCase<CreateProductInputDto, CreateProductOutputDto> {
  public async execute(input: CreateProductInputDto) {
    const product = new ProductEntity()

    product.id = crypto.randomUUID()
    product.name = input.name
    product.price = input.price

    return product
  }
}

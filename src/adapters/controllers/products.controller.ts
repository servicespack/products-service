import type { Request, Response } from 'express'
import type { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case'
import type { DecreaseStockUseCase } from '../../application/use-cases/products/decrease-stock.use-case'
import type { DeleteProductUseCase } from '../../application/use-cases/products/delete-product.use-case'
import type { GetProductByIdUseCase } from '../../application/use-cases/products/get-product-by-id.use-case'
import type { IncreaseStockUseCase } from '../../application/use-cases/products/increase-stock.use-case'
import type { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case'
import type { ListStockMovementsUseCase } from '../../application/use-cases/products/list-stock-movements.use-case'
import type { RestoreProductUseCase } from '../../application/use-cases/products/restore-product.use-case'
import type { UpdateProductUseCase } from '../../application/use-cases/products/update-product.use-case'
import { ChangeStockDto } from '../dtos/change-stock.dto'
import { CreateProductDto } from '../dtos/create-product.dto'
import { UpdateProductDto } from '../dtos/update-product.dto'
import { handleHttpError } from '../helpers/http-error.helper'

export interface ProductsControllerDependencies {
  createProductUseCase: CreateProductUseCase
  listProductsUseCase: ListProductsUseCase
  getProductByIdUseCase: GetProductByIdUseCase
  updateProductUseCase: UpdateProductUseCase
  deleteProductUseCase: DeleteProductUseCase
  restoreProductUseCase: RestoreProductUseCase
  decreaseStockUseCase: DecreaseStockUseCase
  increaseStockUseCase: IncreaseStockUseCase
  listStockMovementsUseCase: ListStockMovementsUseCase
}

export class ProductsController {
  constructor(private readonly dependencies: ProductsControllerDependencies) {}

  async list(request: Request, response: Response) {
    try {
      const { page, size, pageSize, search, sku, category, tag, minPrice, maxPrice, active, includeDeleted, onlyDeleted } = request.query
      const result = await this.dependencies.listProductsUseCase.execute({
        search: search as string,
        sku: sku as string,
        category: category as string,
        tag: tag as string,
        minPrice: minPrice !== undefined && !Number.isNaN(Number(minPrice)) ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined && !Number.isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined,
        active: active !== undefined ? active === 'true' : undefined,
        includeDeleted: includeDeleted !== undefined ? includeDeleted === 'true' : undefined,
        onlyDeleted: onlyDeleted !== undefined ? onlyDeleted === 'true' : undefined,
        page: page && !Number.isNaN(Number(page)) ? Number(page) : undefined,
        pageSize: (pageSize || size) && !Number.isNaN(Number(pageSize || size)) ? Number(pageSize || size) : undefined,
      })
      return response.status(200).json({ data: result })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async show(request: Request, response: Response) {
    try {
      const { includeDeleted } = request.query
      const product = await this.dependencies.getProductByIdUseCase.execute(
        request.params.id as string,
        includeDeleted === 'true',
      )
      return response.status(200).json(product)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async create(request: Request, response: Response) {
    try {
      const data = CreateProductDto.parse(request.body)
      const product = await this.dependencies.createProductUseCase.execute(data)
      return response.status(201).json(product)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async update(request: Request, response: Response) {
    try {
      const data = UpdateProductDto.parse(request.body)
      const product = await this.dependencies.updateProductUseCase.execute(request.params.id as string, data)
      return response.status(200).json(product)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async delete(request: Request, response: Response) {
    try {
      await this.dependencies.deleteProductUseCase.execute(request.params.id as string)
      return response.status(204).send()
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async restore(request: Request, response: Response) {
    try {
      const product = await this.dependencies.restoreProductUseCase.execute(request.params.id as string)
      return response.status(200).json(product)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async decreaseStock(request: Request, response: Response) {
    try {
      const data = ChangeStockDto.parse(request.body)
      const product = await this.dependencies.decreaseStockUseCase.execute(request.params.id as string, data)
      return response.status(200).json(product)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async increaseStock(request: Request, response: Response) {
    try {
      const data = ChangeStockDto.parse(request.body)
      const product = await this.dependencies.increaseStockUseCase.execute(request.params.id as string, data)
      return response.status(200).json(product)
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }

  async listStockMovements(request: Request, response: Response) {
    try {
      const { page, size, pageSize } = request.query
      const movements = await this.dependencies.listStockMovementsUseCase.execute(
        request.params.id as string,
        {
          page: page && !Number.isNaN(Number(page)) ? Number(page) : undefined,
          pageSize: (pageSize || size) && !Number.isNaN(Number(pageSize || size)) ? Number(pageSize || size) : undefined,
        },
      )
      return response.status(200).json({ data: movements })
    }
    catch (error) {
      return handleHttpError(error, response)
    }
  }
}

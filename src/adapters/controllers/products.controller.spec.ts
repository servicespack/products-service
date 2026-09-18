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
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../domain/entities/product.entity'
import { StockMovement } from '../../domain/entities/stock-movement.entity'
import { InsufficientStockError, ProductNotFoundError } from '../../domain/errors'
import { ProductsController } from './products.controller'

describe(ProductsController.name, () => {
  let controller: ProductsController
  let createProductUseCase: CreateProductUseCase
  let listProductsUseCase: ListProductsUseCase
  let getProductByIdUseCase: GetProductByIdUseCase
  let updateProductUseCase: UpdateProductUseCase
  let deleteProductUseCase: DeleteProductUseCase
  let restoreProductUseCase: RestoreProductUseCase
  let decreaseStockUseCase: DecreaseStockUseCase
  let increaseStockUseCase: IncreaseStockUseCase
  let listStockMovementsUseCase: ListStockMovementsUseCase
  let mockResponse: Response

  beforeEach(() => {
    createProductUseCase = {
      execute: vi.fn(),
    } as unknown as CreateProductUseCase

    listProductsUseCase = {
      execute: vi.fn(),
    } as unknown as ListProductsUseCase

    getProductByIdUseCase = {
      execute: vi.fn(),
    } as unknown as GetProductByIdUseCase

    updateProductUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateProductUseCase

    deleteProductUseCase = {
      execute: vi.fn(),
    } as unknown as DeleteProductUseCase

    restoreProductUseCase = {
      execute: vi.fn(),
    } as unknown as RestoreProductUseCase

    decreaseStockUseCase = {
      execute: vi.fn(),
    } as unknown as DecreaseStockUseCase

    increaseStockUseCase = {
      execute: vi.fn(),
    } as unknown as IncreaseStockUseCase

    listStockMovementsUseCase = {
      execute: vi.fn(),
    } as unknown as ListStockMovementsUseCase

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as Response

    controller = new ProductsController({
      createProductUseCase,
      listProductsUseCase,
      getProductByIdUseCase,
      updateProductUseCase,
      deleteProductUseCase,
      restoreProductUseCase,
      decreaseStockUseCase,
      increaseStockUseCase,
      listStockMovementsUseCase,
    })
  })

  describe('create', () => {
    it('should return 201 with created product on valid input', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        price: Number(faker.commerce.price()),
        categories: ['Electronics'],
        tags: ['audio'],
      })

      vi.mocked(createProductUseCase.execute).mockResolvedValueOnce(product)

      const request = {
        body: {
          name: product.name,
          price: product.price,
          categories: ['Electronics'],
          tags: ['audio'],
        },
      } as Request

      await controller.create(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith(product)
      expect(createProductUseCase.execute).toHaveBeenCalledWith(request.body)
    })

    it('should return 400 when body fails schema validation', async () => {
      const request = {
        body: {
          name: 123,
          price: 'not-a-number',
        },
      } as unknown as Request

      await controller.create(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to process request. Please verify the input data and try again.',
      })
      expect(createProductUseCase.execute).not.toHaveBeenCalled()
    })
  })

  describe('list', () => {
    it('should return 200 with list of products', async () => {
      const products = [new Product({ name: 'Item', price: 10 })]
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce(products)

      const request = {
        query: {
          search: 'phone',
          sku: 'SKU-1',
          category: 'Mobile',
          tag: 'smartphone',
          minPrice: '10',
          maxPrice: '100',
          active: 'true',
          includeDeleted: 'true',
          onlyDeleted: 'false',
          page: '1',
          size: '10',
        },
      } as unknown as Request

      await controller.list(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({ data: products })
      expect(listProductsUseCase.execute).toHaveBeenCalledWith({
        search: 'phone',
        sku: 'SKU-1',
        category: 'Mobile',
        tag: 'smartphone',
        minPrice: 10,
        maxPrice: 100,
        active: true,
        includeDeleted: true,
        onlyDeleted: false,
        page: 1,
        pageSize: 10,
      })
    })

    it('should return 400 when query parameter contains non-finite number', async () => {
      const request = {
        query: {
          minPrice: 'Infinity',
        },
      } as unknown as Request

      await controller.list(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to process request. Please verify the input data and try again.',
      })
      expect(listProductsUseCase.execute).not.toHaveBeenCalled()
    })
  })

  describe('show', () => {
    it('should return 200 when product is found', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: 'Item',
        price: 20,
      })
      vi.mocked(getProductByIdUseCase.execute).mockResolvedValueOnce(product)

      const request = {
        params: { id: product.id },
        query: {},
      } as unknown as Request

      await controller.show(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(product)
      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(product.id, false)
    })

    it('should return 404 when product is not found', async () => {
      const id = faker.string.uuid()
      vi.mocked(getProductByIdUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id },
        query: {},
      } as unknown as Request

      await controller.show(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })
  })

  describe('update', () => {
    it('should return 200 with updated product on valid input', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: 'Updated Name',
        price: 50,
      })

      vi.mocked(updateProductUseCase.execute).mockResolvedValueOnce(product)

      const request = {
        params: { id: product.id },
        body: {
          name: 'Updated Name',
          price: 50,
        },
      } as unknown as Request

      await controller.update(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(product)
      expect(updateProductUseCase.execute).toHaveBeenCalledWith(product.id, request.body)
    })

    it('should return 404 when product to update is not found', async () => {
      const id = faker.string.uuid()
      vi.mocked(updateProductUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id },
        body: { name: 'Updated Name' },
      } as unknown as Request

      await controller.update(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })
  })

  describe('delete', () => {
    it('should return 204 on successful delete', async () => {
      const id = faker.string.uuid()
      vi.mocked(deleteProductUseCase.execute).mockResolvedValueOnce(undefined)

      const request = {
        params: { id },
      } as unknown as Request

      await controller.delete(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(204)
      expect(mockResponse.send).toHaveBeenCalled()
      expect(deleteProductUseCase.execute).toHaveBeenCalledWith(id)
    })

    it('should return 404 when product to delete is not found', async () => {
      const id = faker.string.uuid()
      vi.mocked(deleteProductUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id },
      } as unknown as Request

      await controller.delete(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })
  })

  describe('restore', () => {
    it('should return 200 with restored product on valid id', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: 'Restored Product',
        price: 50,
      })

      vi.mocked(restoreProductUseCase.execute).mockResolvedValueOnce(product)

      const request = {
        params: { id: product.id },
      } as unknown as Request

      await controller.restore(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(product)
      expect(restoreProductUseCase.execute).toHaveBeenCalledWith(product.id)
    })

    it('should return 404 when product to restore is not found', async () => {
      const id = faker.string.uuid()
      vi.mocked(restoreProductUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id },
      } as unknown as Request

      await controller.restore(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })
  })

  describe('decreaseStock', () => {
    it('should return 200 with updated product on valid stock decrease', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: 'Item',
        price: 50,
        stock: 5,
      })

      vi.mocked(decreaseStockUseCase.execute).mockResolvedValueOnce(product)

      const request = {
        params: { id: product.id },
        body: { quantity: 2, reason: 'Sale' },
      } as unknown as Request

      await controller.decreaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(product)
      expect(decreaseStockUseCase.execute).toHaveBeenCalledWith(product.id, { quantity: 2, reason: 'Sale' })
    })

    it('should return 400 on invalid body quantity', async () => {
      const request = {
        params: { id: faker.string.uuid() },
        body: { quantity: -1 },
      } as unknown as Request

      await controller.decreaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to process request. Please verify the input data and try again.',
      })
      expect(decreaseStockUseCase.execute).not.toHaveBeenCalled()
    })

    it('should return 404 when product is not found', async () => {
      const id = faker.string.uuid()
      vi.mocked(decreaseStockUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id },
        body: { quantity: 1 },
      } as unknown as Request

      await controller.decreaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })

    it('should return 409 Conflict when stock is insufficient', async () => {
      const id = faker.string.uuid()
      vi.mocked(decreaseStockUseCase.execute).mockRejectedValueOnce(new InsufficientStockError())

      const request = {
        params: { id },
        body: { quantity: 10 },
      } as unknown as Request

      await controller.decreaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient stock' })
    })
  })

  describe('increaseStock', () => {
    it('should return 200 with updated product on valid stock increase', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: 'Item',
        price: 50,
        stock: 15,
      })

      vi.mocked(increaseStockUseCase.execute).mockResolvedValueOnce(product)

      const request = {
        params: { id: product.id },
        body: { quantity: 10, reason: 'Restock' },
      } as unknown as Request

      await controller.increaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(product)
      expect(increaseStockUseCase.execute).toHaveBeenCalledWith(product.id, { quantity: 10, reason: 'Restock' })
    })

    it('should return 400 on invalid body quantity', async () => {
      const request = {
        params: { id: faker.string.uuid() },
        body: { quantity: 0 },
      } as unknown as Request

      await controller.increaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(increaseStockUseCase.execute).not.toHaveBeenCalled()
    })

    it('should return 404 when product is not found', async () => {
      const id = faker.string.uuid()
      vi.mocked(increaseStockUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id },
        body: { quantity: 5 },
      } as unknown as Request

      await controller.increaseStock(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })
  })

  describe('listStockMovements', () => {
    it('should return 200 with list of movements', async () => {
      const productId = faker.string.uuid()
      const movements = [
        new StockMovement({
          id: faker.string.uuid(),
          productId,
          type: 'INCREMENT',
          quantity: 10,
          previousStock: 0,
          currentStock: 10,
        }),
      ]

      vi.mocked(listStockMovementsUseCase.execute).mockResolvedValueOnce(movements)

      const request = {
        params: { id: productId },
        query: { page: '1', size: '5' },
      } as unknown as Request

      await controller.listStockMovements(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({ data: movements })
      expect(listStockMovementsUseCase.execute).toHaveBeenCalledWith(productId, {
        page: 1,
        pageSize: 5,
      })
    })

    it('should parse pageSize query parameter directly', async () => {
      const productId = faker.string.uuid()
      vi.mocked(listStockMovementsUseCase.execute).mockResolvedValueOnce([])

      const request = {
        params: { id: productId },
        query: { page: '2', pageSize: '15' },
      } as unknown as Request

      await controller.listStockMovements(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(listStockMovementsUseCase.execute).toHaveBeenCalledWith(productId, {
        page: 2,
        pageSize: 15,
      })
    })

    it('should return 404 when product is not found', async () => {
      const productId = faker.string.uuid()
      vi.mocked(listStockMovementsUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const request = {
        params: { id: productId },
        query: {},
      } as unknown as Request

      await controller.listStockMovements(request, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Product not found' })
    })
  })
})

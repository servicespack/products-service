import type { CancelReservationUseCase } from '../../application/use-cases/products/cancel-reservation.use-case'
import type { GetCatalogSummaryUseCase } from '../../application/use-cases/products/get-catalog-summary.use-case'
import type { GetLowStockProductsUseCase } from '../../application/use-cases/products/get-low-stock-products.use-case'
import type { GetProductByIdUseCase } from '../../application/use-cases/products/get-product-by-id.use-case'
import type { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case'
import type { ListStockMovementsUseCase } from '../../application/use-cases/products/list-stock-movements.use-case'
import type { ReserveProductUseCase } from '../../application/use-cases/products/reserve-product.use-case'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../domain/entities/product.entity'
import { Reservation } from '../../domain/entities/reservation.entity'
import { StockMovement } from '../../domain/entities/stock-movement.entity'
import {
  InsufficientStockError,
  InvalidStockQuantityError,
  ProductNotFoundError,
  ReservationAlreadyCancelledError,
  ReservationNotFoundError,
} from '../../domain/errors'
import { ProductsMcpController } from './products.mcp-controller'

function getText(result: { content: Array<{ type: string }> }): string {
  const item = result.content[0] as { type: string, text?: string }
  return item.text ?? ''
}

describe(ProductsMcpController.name, () => {
  let controller: ProductsMcpController
  let listProductsUseCase: ListProductsUseCase
  let getProductByIdUseCase: GetProductByIdUseCase
  let reserveProductUseCase: ReserveProductUseCase
  let cancelReservationUseCase: CancelReservationUseCase
  let listStockMovementsUseCase: ListStockMovementsUseCase
  let getCatalogSummaryUseCase: GetCatalogSummaryUseCase
  let getLowStockProductsUseCase: GetLowStockProductsUseCase

  beforeEach(() => {
    listProductsUseCase = { execute: vi.fn() } as unknown as ListProductsUseCase
    getProductByIdUseCase = { execute: vi.fn() } as unknown as GetProductByIdUseCase
    reserveProductUseCase = { execute: vi.fn() } as unknown as ReserveProductUseCase
    cancelReservationUseCase = { execute: vi.fn() } as unknown as CancelReservationUseCase
    listStockMovementsUseCase = { execute: vi.fn() } as unknown as ListStockMovementsUseCase
    getCatalogSummaryUseCase = { execute: vi.fn() } as unknown as GetCatalogSummaryUseCase
    getLowStockProductsUseCase = { execute: vi.fn() } as unknown as GetLowStockProductsUseCase

    controller = new ProductsMcpController({
      listProductsUseCase,
      getProductByIdUseCase,
      reserveProductUseCase,
      cancelReservationUseCase,
      listStockMovementsUseCase,
      getCatalogSummaryUseCase,
      getLowStockProductsUseCase,
    })
  })

  describe('searchProducts', () => {
    it('should return serialized products when products are found', async () => {
      const product = new Product({
        id: faker.string.uuid(),
        name: 'Wireless Mouse',
        price: 29.99,
        stock: 50,
      })

      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce([product])

      const result = await controller.searchProducts({ search: 'Mouse', category: 'Tech' })

      expect(listProductsUseCase.execute).toHaveBeenCalledWith({
        search: 'Mouse',
        category: 'Tech',
        tag: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        active: true,
        page: undefined,
        pageSize: undefined,
      })
      expect(result.isError).toBeUndefined()
      expect(getText(result)).toContain('Wireless Mouse')
    })

    it('should return a friendly message when no products are found', async () => {
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce([])

      const result = await controller.searchProducts({ search: 'Nonexistent' })

      expect(result.isError).toBeUndefined()
      expect(getText(result)).toBe('No products found.')
    })

    it('should handle errors when searching products fails', async () => {
      vi.mocked(listProductsUseCase.execute).mockRejectedValueOnce(new Error('Search failed'))

      const result = await controller.searchProducts({ search: 'Error' })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('An error occurred while searching products.')
    })
  })

  describe('getProductDetails', () => {
    it('should return product by id', async () => {
      const id = faker.string.uuid()
      const product = new Product({ id, name: 'Phone', price: 500, stock: 10 })
      vi.mocked(getProductByIdUseCase.execute).mockResolvedValueOnce(product)

      const result = await controller.getProductDetails({ id })

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(id)
      expect(result.isError).toBeUndefined()
      expect(getText(result)).toContain('Phone')
    })

    it('should return product by sku', async () => {
      const sku = 'PHONE-123'
      const product = new Product({ id: faker.string.uuid(), name: 'Phone', sku, price: 500, stock: 10 })
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce([product])

      const result = await controller.getProductDetails({ sku })

      expect(listProductsUseCase.execute).toHaveBeenCalledWith({ sku })
      expect(result.isError).toBeUndefined()
      expect(getText(result)).toContain('PHONE-123')
    })

    it('should throw error if neither id nor sku provided', async () => {
      const result = await controller.getProductDetails({})
      expect(result.isError).toBe(true)
      expect(getText(result)).toContain('An error occurred while getting product details.')
    })

    it('should return Product not found when ProductNotFoundError is thrown by ID', async () => {
      const id = faker.string.uuid()
      vi.mocked(getProductByIdUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const result = await controller.getProductDetails({ id })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('Product not found.')
    })

    it('should return Product not found when product with sku is not found', async () => {
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce([])

      const result = await controller.getProductDetails({ sku: 'NONEXISTENT' })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('Product not found.')
    })
  })

  describe('reserveProduct', () => {
    it('should reserve product', async () => {
      const productId = faker.string.uuid()
      const product = new Product({ id: productId, name: 'Keyboard', price: 79.99, stock: 9 })
      const reservation = new Reservation({ id: 'res-1', productId, quantity: 1 })
      vi.mocked(reserveProductUseCase.execute).mockResolvedValueOnce({ product, reservation })

      const result = await controller.reserveProduct({ productId })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(getText(result))
      expect(parsed.message).toContain('Successfully reserved 1 unit(s)')
      expect(parsed.reservationId).toBe('res-1')
    })

    it('should return error when ProductNotFoundError is thrown', async () => {
      const productId = faker.string.uuid()
      vi.mocked(reserveProductUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const result = await controller.reserveProduct({ productId, quantity: 2 })

      expect(result.isError).toBe(true)
      expect(getText(result)).toContain(`Product with ID "${productId}" not found.`)
    })

    it('should return error when InsufficientStockError is thrown', async () => {
      const productId = faker.string.uuid()
      vi.mocked(reserveProductUseCase.execute).mockRejectedValueOnce(new InsufficientStockError())

      const result = await controller.reserveProduct({ productId, quantity: 5 })

      expect(result.isError).toBe(true)
      expect(getText(result)).toContain(`Insufficient stock to reserve 5 unit(s) of product with ID "${productId}".`)
    })

    it('should return error with default quantity 1 when InsufficientStockError is thrown without quantity', async () => {
      const productId = faker.string.uuid()
      vi.mocked(reserveProductUseCase.execute).mockRejectedValueOnce(new InsufficientStockError())

      const result = await controller.reserveProduct({ productId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toContain(`Insufficient stock to reserve 1 unit(s) of product with ID "${productId}".`)
    })

    it('should return error when InvalidStockQuantityError is thrown', async () => {
      const productId = faker.string.uuid()
      vi.mocked(reserveProductUseCase.execute).mockRejectedValueOnce(new InvalidStockQuantityError('Quantity must be greater than zero'))

      const result = await controller.reserveProduct({ productId, quantity: 0 })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('Quantity must be greater than zero')
    })

    it('should return generic error on unexpected failure', async () => {
      const productId = faker.string.uuid()
      vi.mocked(reserveProductUseCase.execute).mockRejectedValueOnce(new Error('DB failure'))

      const result = await controller.reserveProduct({ productId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('An error occurred while reserving the product.')
    })
  })

  describe('cancelReservation', () => {
    it('should cancel reservation and return updated product', async () => {
      const reservationId = faker.string.uuid()
      const productId = faker.string.uuid()
      const product = new Product({ id: productId, name: 'Keyboard', price: 79.99, stock: 10 })
      const reservation = new Reservation({ id: reservationId, productId, quantity: 2, status: 'CANCELLED' })
      vi.mocked(cancelReservationUseCase.execute).mockResolvedValueOnce({ product, reservation })

      const result = await controller.cancelReservation({ reservationId })

      expect(cancelReservationUseCase.execute).toHaveBeenCalledWith({ reservationId, reason: undefined })
      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(getText(result))
      expect(parsed.message).toContain(`Successfully cancelled reservation "${reservationId}"`)
    })

    it('should return error when ReservationNotFoundError is thrown', async () => {
      const reservationId = faker.string.uuid()
      vi.mocked(cancelReservationUseCase.execute).mockRejectedValueOnce(new ReservationNotFoundError())

      const result = await controller.cancelReservation({ reservationId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toContain(`Reservation with ID "${reservationId}" not found.`)
    })

    it('should return error when ReservationAlreadyCancelledError is thrown', async () => {
      const reservationId = faker.string.uuid()
      vi.mocked(cancelReservationUseCase.execute).mockRejectedValueOnce(new ReservationAlreadyCancelledError())

      const result = await controller.cancelReservation({ reservationId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toContain(`Reservation with ID "${reservationId}" has already been cancelled.`)
    })

    it('should return error when ProductNotFoundError is thrown on cancel', async () => {
      const reservationId = faker.string.uuid()
      vi.mocked(cancelReservationUseCase.execute).mockRejectedValueOnce(new ProductNotFoundError())

      const result = await controller.cancelReservation({ reservationId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('Product associated with reservation not found.')
    })

    it('should return generic error on unexpected cancel failure', async () => {
      const reservationId = faker.string.uuid()
      vi.mocked(cancelReservationUseCase.execute).mockRejectedValueOnce(new Error('Network error'))

      const result = await controller.cancelReservation({ reservationId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('An error occurred while cancelling the reservation.')
    })
  })

  describe('getStockHistory', () => {
    it('should return stock history for a product', async () => {
      const productId = faker.string.uuid()
      const movement = new StockMovement({
        productId,
        type: 'INCREMENT',
        quantity: 5,
        previousStock: 0,
        currentStock: 5,
        reason: 'Restock',
      })
      vi.mocked(listStockMovementsUseCase.execute).mockResolvedValueOnce([movement])

      const result = await controller.getStockHistory({ productId })

      expect(listStockMovementsUseCase.execute).toHaveBeenCalledWith(productId)
      expect(result.isError).toBeUndefined()
      expect(getText(result)).toContain('Restock')
    })

    it('should return error when getStockHistory fails', async () => {
      const productId = faker.string.uuid()
      vi.mocked(listStockMovementsUseCase.execute).mockRejectedValueOnce(new Error('DB error'))

      const result = await controller.getStockHistory({ productId })

      expect(result.isError).toBe(true)
      expect(getText(result)).toBe('An error occurred while getting the stock history.')
    })
  })

  describe('resources', () => {
    it('should return catalog summary', async () => {
      const summary = {
        totalProducts: 2,
        categories: { Tech: 2, Sale: 1 },
        priceRange: {
          min: 100,
          max: 200,
          average: 150,
        },
      }
      vi.mocked(getCatalogSummaryUseCase.execute).mockResolvedValueOnce(summary)

      const result = await controller.getCatalogSummary('products://catalog/summary')

      const text = (result.contents[0] as { type?: string, text?: string }).text
      expect(text).toContain('"totalProducts": 2')
      expect(text).toContain('"average": 150')
      expect(getCatalogSummaryUseCase.execute).toHaveBeenCalledOnce()
    })

    it('should handle empty catalog in catalog summary', async () => {
      const summary = {
        totalProducts: 0,
        categories: {},
        priceRange: {
          min: 0,
          max: 0,
          average: 0,
        },
      }
      vi.mocked(getCatalogSummaryUseCase.execute).mockResolvedValueOnce(summary)

      const result = await controller.getCatalogSummary('products://catalog/summary')
      const text = (result.contents[0] as { type?: string, text?: string }).text
      const parsed = JSON.parse(text!)

      expect(parsed.totalProducts).toBe(0)
      expect(parsed.priceRange.min).toBe(0)
      expect(parsed.priceRange.max).toBe(0)
      expect(parsed.priceRange.average).toBe(0)
    })

    it('should return low stock products', async () => {
      const products = [
        new Product({ name: 'B', price: 200, stock: 3 }),
      ]
      vi.mocked(getLowStockProductsUseCase.execute).mockResolvedValueOnce(products)

      const result = await controller.getLowStockProducts('products://stock/low-stock')

      const text = (result.contents[0] as { type?: string, text?: string }).text
      const parsed = JSON.parse(text!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].stock).toBe(3)
      expect(getLowStockProductsUseCase.execute).toHaveBeenCalledWith(5)
    })

    it('should return product details via resource', async () => {
      const id = faker.string.uuid()
      const product = new Product({ id, name: 'Phone', price: 500, stock: 10 })
      vi.mocked(getProductByIdUseCase.execute).mockResolvedValueOnce(product)

      const result = await controller.getProductResource('products://123', id)

      const text = (result.contents[0] as { type?: string, text?: string }).text
      expect(text).toContain('Phone')
    })

    it('should throw error when getCatalogSummary fails', async () => {
      vi.mocked(getCatalogSummaryUseCase.execute).mockRejectedValueOnce(new Error('Summary failed'))

      await expect(controller.getCatalogSummary('products://catalog/summary')).rejects.toThrow('Summary failed')
    })

    it('should throw error when getLowStockProducts fails', async () => {
      vi.mocked(getLowStockProductsUseCase.execute).mockRejectedValueOnce(new Error('Low stock failed'))

      await expect(controller.getLowStockProducts('products://stock/low-stock')).rejects.toThrow('Low stock failed')
    })

    it('should throw error when getProductResource fails', async () => {
      vi.mocked(getProductByIdUseCase.execute).mockRejectedValueOnce(new Error('Product resource failed'))

      await expect(controller.getProductResource('products://123', 'id-123')).rejects.toThrow('Product resource failed')
    })
  })

  describe('prompts', () => {
    it('should return recommend_products prompt', () => {
      const result = controller.getRecommendProductsPrompt({ category: 'Tech' })
      expect(result.messages[0].content.type).toBe('text')
      // @ts-expect-error type assertion
      expect(result.messages[0].content.text).toContain('category":"Tech')
    })

    it('should return recommend_products prompt when args is undefined', () => {
      const result = controller.getRecommendProductsPrompt(undefined)
      expect(result.messages[0].content.type).toBe('text')
      // @ts-expect-error type assertion
      expect(result.messages[0].content.text).toContain('Customer Criteria: {}')
    })
  })
})

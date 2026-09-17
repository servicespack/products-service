import type { CancelReservationUseCase } from '../../application/use-cases/products/cancel-reservation.use-case'
import type { GetProductByIdUseCase } from '../../application/use-cases/products/get-product-by-id.use-case'
import type { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case'
import type { ListStockMovementsUseCase } from '../../application/use-cases/products/list-stock-movements.use-case'
import type { ReserveProductUseCase } from '../../application/use-cases/products/reserve-product.use-case'
import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../domain/entities/product.entity'
import { StockMovement } from '../../domain/entities/stock-movement.entity'
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

  beforeEach(() => {
    listProductsUseCase = { execute: vi.fn() } as unknown as ListProductsUseCase
    getProductByIdUseCase = { execute: vi.fn() } as unknown as GetProductByIdUseCase
    reserveProductUseCase = { execute: vi.fn() } as unknown as ReserveProductUseCase
    cancelReservationUseCase = { execute: vi.fn() } as unknown as CancelReservationUseCase
    listStockMovementsUseCase = { execute: vi.fn() } as unknown as ListStockMovementsUseCase

    controller = new ProductsMcpController({
      listProductsUseCase,
      getProductByIdUseCase,
      reserveProductUseCase,
      cancelReservationUseCase,
      listStockMovementsUseCase,
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
  })

  describe('reserveProduct', () => {
    it('should reserve product', async () => {
      const productId = faker.string.uuid()
      const product = new Product({ id: productId, name: 'Keyboard', price: 79.99, stock: 9 })
      vi.mocked(reserveProductUseCase.execute).mockResolvedValueOnce(product)

      const result = await controller.reserveProduct({ productId })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(getText(result))
      expect(parsed.message).toContain('Successfully reserved 1 unit(s)')
    })
  })

  describe('cancelReservation', () => {
    it('should cancel reservation and return updated product', async () => {
      const productId = faker.string.uuid()
      const product = new Product({ id: productId, name: 'Keyboard', price: 79.99, stock: 10 })
      vi.mocked(cancelReservationUseCase.execute).mockResolvedValueOnce(product)

      const result = await controller.cancelReservation({ productId, quantity: 2 })

      expect(cancelReservationUseCase.execute).toHaveBeenCalledWith(productId, { quantity: 2, reason: undefined })
      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(getText(result))
      expect(parsed.message).toContain('Successfully cancelled reservation of 2 unit(s)')
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
  })

  describe('resources', () => {
    it('should return catalog summary', async () => {
      const products = [
        new Product({ name: 'A', price: 100, categories: ['Tech'], stock: 10 }),
        new Product({ name: 'B', price: 200, categories: ['Tech', 'Sale'], stock: 5 }),
      ]
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce(products)

      const result = await controller.getCatalogSummary('products://catalog/summary')

      const text = (result.contents[0] as { type?: string, text?: string }).text
      expect(text).toContain('"totalProducts": 2')
      expect(text).toContain('"average": 150')
    })

    it('should handle empty catalog in catalog summary', async () => {
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce([])

      const result = await controller.getCatalogSummary('products://catalog/summary')
      const text = (result.contents[0] as { type?: string, text?: string }).text
      const summary = JSON.parse(text!)

      expect(summary.totalProducts).toBe(0)
      expect(summary.priceRange.min).toBe(0)
      expect(summary.priceRange.max).toBe(0)
      expect(summary.priceRange.average).toBe(0)
    })

    it('should paginate and retrieve all products across multiple pages for catalog summary', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => new Product({ name: `Prod ${i}`, price: 10, stock: 10, categories: ['A'] }))
      const page2 = [new Product({ name: 'Prod 100', price: 20, stock: 10, categories: ['B'] })]

      vi.mocked(listProductsUseCase.execute)
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2)

      const result = await controller.getCatalogSummary('products://catalog/summary')
      const text = (result.contents[0] as { type?: string, text?: string }).text
      const summary = JSON.parse(text!)

      expect(summary.totalProducts).toBe(101)
      expect(summary.categories.A).toBe(100)
      expect(summary.categories.B).toBe(1)
      expect(listProductsUseCase.execute).toHaveBeenCalledTimes(2)
    })

    it('should return low stock products', async () => {
      const products = [
        new Product({ name: 'A', price: 100, stock: 10 }),
        new Product({ name: 'B', price: 200, stock: 3 }),
      ]
      vi.mocked(listProductsUseCase.execute).mockResolvedValueOnce(products)

      const result = await controller.getLowStockProducts('products://stock/low-stock')

      const text = (result.contents[0] as { type?: string, text?: string }).text
      const parsed = JSON.parse(text!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].stock).toBe(3)
    })

    it('should return product details via resource', async () => {
      const id = faker.string.uuid()
      const product = new Product({ id, name: 'Phone', price: 500, stock: 10 })
      vi.mocked(getProductByIdUseCase.execute).mockResolvedValueOnce(product)

      const result = await controller.getProductResource('products://123', id)

      const text = (result.contents[0] as { type?: string, text?: string }).text
      expect(text).toContain('Phone')
    })
  })

  describe('prompts', () => {
    it('should return recommend_products prompt', () => {
      const result = controller.getRecommendProductsPrompt({ category: 'Tech' })
      expect(result.messages[0].content.type).toBe('text')
      // @ts-expect-error type assertion
      expect(result.messages[0].content.text).toContain('category":"Tech')
    })
  })
})

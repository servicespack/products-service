import type { CallToolResult, GetPromptResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'
import type { CancelReservationUseCase } from '../../application/use-cases/products/cancel-reservation.use-case'
import type { GetCatalogSummaryUseCase } from '../../application/use-cases/products/get-catalog-summary.use-case'
import type { GetLowStockProductsUseCase } from '../../application/use-cases/products/get-low-stock-products.use-case'
import type { GetProductByIdUseCase } from '../../application/use-cases/products/get-product-by-id.use-case'
import type { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case'
import type { ListStockMovementsUseCase } from '../../application/use-cases/products/list-stock-movements.use-case'
import type { ReserveProductUseCase } from '../../application/use-cases/products/reserve-product.use-case'
import { logger } from '../../config'
import {
  InsufficientStockError,
  InvalidStockQuantityError,
  ProductNotFoundError,
  ReservationAlreadyCancelledError,
  ReservationNotFoundError,
} from '../../domain/errors'

export interface ProductsMcpControllerDependencies {
  readonly listProductsUseCase: ListProductsUseCase
  readonly getProductByIdUseCase: GetProductByIdUseCase
  readonly reserveProductUseCase: ReserveProductUseCase
  readonly cancelReservationUseCase: CancelReservationUseCase
  readonly listStockMovementsUseCase: ListStockMovementsUseCase
  readonly getCatalogSummaryUseCase: GetCatalogSummaryUseCase
  readonly getLowStockProductsUseCase: GetLowStockProductsUseCase
}

export interface SearchProductsInput {
  readonly search?: string
  readonly category?: string
  readonly tag?: string
  readonly minPrice?: number
  readonly maxPrice?: number
  readonly active?: boolean
  readonly page?: number
  readonly pageSize?: number
}

export interface GetProductDetailsInput {
  readonly id?: string
  readonly sku?: string
}

export interface ReserveProductInput {
  readonly productId: string
  readonly quantity?: number
  readonly reason?: string
}

export interface CancelReservationInput {
  readonly reservationId: string
  readonly reason?: string
}

export interface GetStockHistoryInput {
  readonly productId: string
}

export class ProductsMcpController {
  constructor(private readonly dependencies: ProductsMcpControllerDependencies) {}

  private logOperation(operation: string, details: Record<string, unknown>, startTime: number, success: boolean) {
    const durationMs = Date.now() - startTime
    logger.info({
      action: operation,
      ...details,
      durationMs,
      status: success ? 'success' : 'error',
    })
  }

  async searchProducts(input: SearchProductsInput = {}): Promise<CallToolResult> {
    const startTime = Date.now()
    try {
      const products = await this.dependencies.listProductsUseCase.execute({
        search: input.search,
        category: input.category,
        tag: input.tag,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        active: input.active ?? true,
        page: input.page,
        pageSize: input.pageSize,
      })

      this.logOperation('call_tool', { tool: 'search_products', params: input }, startTime, true)

      if (products.length === 0) {
        return {
          content: [{ type: 'text', text: 'No products found.' }],
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(products.map(p => p.toJSON()), null, 2) }],
      }
    }
    catch (error) {
      this.logOperation('call_tool', { tool: 'search_products', params: input, error }, startTime, false)
      return {
        isError: true,
        content: [{ type: 'text', text: `An error occurred while searching products.` }],
      }
    }
  }

  async getProductDetails(input: GetProductDetailsInput): Promise<CallToolResult> {
    const startTime = Date.now()
    try {
      let product
      if (input.id) {
        product = await this.dependencies.getProductByIdUseCase.execute(input.id)
      }
      else if (input.sku) {
        const products = await this.dependencies.listProductsUseCase.execute({ sku: input.sku })
        product = products[0]
      }
      else {
        throw new Error('Must provide either id or sku')
      }

      if (!product) {
        throw new ProductNotFoundError()
      }

      this.logOperation('call_tool', { tool: 'get_product_details', params: input }, startTime, true)

      return {
        content: [{ type: 'text', text: JSON.stringify(product.toJSON(), null, 2) }],
      }
    }
    catch (error) {
      this.logOperation('call_tool', { tool: 'get_product_details', params: input, error }, startTime, false)
      if (error instanceof ProductNotFoundError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Product not found.` }],
        }
      }
      return {
        isError: true,
        content: [{ type: 'text', text: `An error occurred while getting product details.` }],
      }
    }
  }

  async reserveProduct(input: ReserveProductInput): Promise<CallToolResult> {
    const startTime = Date.now()
    try {
      const quantity = input.quantity ?? 1
      const { product, reservation } = await this.dependencies.reserveProductUseCase.execute(input.productId, {
        quantity,
        reason: input.reason,
      })

      this.logOperation('call_tool', { tool: 'reserve_product', params: input }, startTime, true)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: `Successfully reserved ${quantity} unit(s) of "${product.name}".`,
              reservationId: reservation.id,
              reservation: reservation.toJSON(),
              product: product.toJSON(),
            }, null, 2),
          },
        ],
      }
    }
    catch (error) {
      this.logOperation('call_tool', { tool: 'reserve_product', params: input, error }, startTime, false)
      if (error instanceof ProductNotFoundError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Product with ID "${input.productId}" not found.` }],
        }
      }
      if (error instanceof InsufficientStockError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Insufficient stock to reserve ${input.quantity ?? 1} unit(s) of product with ID "${input.productId}".` }],
        }
      }
      if (error instanceof InvalidStockQuantityError) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.message }],
        }
      }
      return {
        isError: true,
        content: [{ type: 'text', text: `An error occurred while reserving the product.` }],
      }
    }
  }

  async cancelReservation(input: CancelReservationInput): Promise<CallToolResult> {
    const startTime = Date.now()
    try {
      const { product, reservation } = await this.dependencies.cancelReservationUseCase.execute({
        reservationId: input.reservationId,
        reason: input.reason,
      })

      this.logOperation('call_tool', { tool: 'cancel_reservation', params: input }, startTime, true)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: `Successfully cancelled reservation "${reservation.id}".`,
              reservation: reservation.toJSON(),
              product: product.toJSON(),
            }, null, 2),
          },
        ],
      }
    }
    catch (error) {
      this.logOperation('call_tool', { tool: 'cancel_reservation', params: input, error }, startTime, false)
      if (error instanceof ReservationNotFoundError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Reservation with ID "${input.reservationId}" not found.` }],
        }
      }
      if (error instanceof ReservationAlreadyCancelledError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Reservation with ID "${input.reservationId}" has already been cancelled.` }],
        }
      }
      if (error instanceof ProductNotFoundError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Product associated with reservation not found.` }],
        }
      }
      return {
        isError: true,
        content: [{ type: 'text', text: `An error occurred while cancelling the reservation.` }],
      }
    }
  }

  async getStockHistory(input: GetStockHistoryInput): Promise<CallToolResult> {
    const startTime = Date.now()
    try {
      const movements = await this.dependencies.listStockMovementsUseCase.execute(input.productId)

      this.logOperation('call_tool', { tool: 'get_stock_history', params: input }, startTime, true)

      return {
        content: [{ type: 'text', text: JSON.stringify(movements.map(m => m.toJSON()), null, 2) }],
      }
    }
    catch (error) {
      this.logOperation('call_tool', { tool: 'get_stock_history', params: input, error }, startTime, false)
      return {
        isError: true,
        content: [{ type: 'text', text: `An error occurred while getting the stock history.` }],
      }
    }
  }

  async getCatalogSummary(uri: string): Promise<ReadResourceResult> {
    const startTime = Date.now()
    try {
      const summary = await this.dependencies.getCatalogSummaryUseCase.execute()

      this.logOperation('read_resource', { resource: 'catalog_summary' }, startTime, true)

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      }
    }
    catch (error) {
      this.logOperation('read_resource', { resource: 'catalog_summary' }, startTime, false)
      throw error
    }
  }

  async getLowStockProducts(uri: string): Promise<ReadResourceResult> {
    const startTime = Date.now()
    try {
      const products = await this.dependencies.getLowStockProductsUseCase.execute(5)
      const lowStock = products.map(p => ({ id: p.id, name: p.name, stock: p.stock }))

      this.logOperation('read_resource', { resource: 'low_stock' }, startTime, true)

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(lowStock, null, 2),
          },
        ],
      }
    }
    catch (error) {
      this.logOperation('read_resource', { resource: 'low_stock' }, startTime, false)
      throw error
    }
  }

  async getProductResource(uri: string, id: string): Promise<ReadResourceResult> {
    const startTime = Date.now()
    try {
      const product = await this.dependencies.getProductByIdUseCase.execute(id)

      this.logOperation('read_resource', { resource: 'product', id }, startTime, true)

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(product.toJSON(), null, 2),
          },
        ],
      }
    }
    catch (error) {
      this.logOperation('read_resource', { resource: 'product', id }, startTime, false)
      throw error
    }
  }

  getRecommendProductsPrompt(args: Record<string, string> | undefined): GetPromptResult {
    const startTime = Date.now()
    this.logOperation('get_prompt', { prompt: 'recommend_products', args }, startTime, true)

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a helpful sales assistant for an e-commerce catalog. Your goal is to help the customer find the best products matching their criteria.
            
Customer Criteria: ${JSON.stringify(args || {})}

Please follow these steps:
1. Use the 'search_products' tool to find items matching the criteria (category, budget limits via minPrice/maxPrice).
2. If needed, use 'get_product_details' to check specifics.
3. Suggest the top 3 options to the customer, explaining why they fit.
4. Let the customer know you can reserve an item for them using 'reserve_product'.`,
          },
        },
      ],
    }
  }
}

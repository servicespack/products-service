import type { ProductsMcpController } from '../../adapters/mcp/products.mcp-controller'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProductsMcpServer } from './mcp.server'

describe('createProductsMcpServer', () => {
  let controller: ProductsMcpController

  beforeEach(() => {
    controller = {
      searchProducts: vi.fn(),
      getProductDetails: vi.fn(),
      reserveProduct: vi.fn(),
      cancelReservation: vi.fn(),
      getStockHistory: vi.fn(),
      getCatalogSummary: vi.fn(),
      getLowStockProducts: vi.fn(),
      getProductResource: vi.fn(),
      getRecommendProductsPrompt: vi.fn(),
    } as unknown as ProductsMcpController
  })

  it('should create an McpServer instance with registered tools, resources and prompts', () => {
    const server = createProductsMcpServer(controller)
    const registeredTools = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
    const registeredResources = (server as unknown as { _registeredResources: Record<string, unknown> })._registeredResources
    const registeredPrompts = (server as unknown as { _registeredPrompts: Record<string, unknown> })._registeredPrompts

    expect(registeredTools).toHaveProperty('search_products')
    expect(registeredTools).toHaveProperty('get_product_details')
    expect(registeredTools).toHaveProperty('reserve_product')
    expect(registeredTools).toHaveProperty('cancel_reservation')
    expect(registeredTools).toHaveProperty('get_stock_history')

    expect(registeredResources).toHaveProperty('products://catalog/summary')
    expect(registeredResources).toHaveProperty('products://stock/low-stock')

    expect(registeredPrompts).toHaveProperty('recommend_products')
  })

  it('should delegate search_products call to controller.searchProducts', async () => {
    const server = createProductsMcpServer(controller)
    const registeredTools = (server as unknown as {
      _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }>
    })._registeredTools

    const mockResult = { content: [{ type: 'text' as const, text: '[]' }] }
    vi.mocked(controller.searchProducts).mockResolvedValueOnce(mockResult)

    const args = { search: 'laptop', category: 'electronics' }
    const result = await registeredTools.search_products.handler(args)

    expect(controller.searchProducts).toHaveBeenCalledWith(args)
    expect(result).toBe(mockResult)
  })

  it('should delegate get_product_details call to controller.getProductDetails', async () => {
    const server = createProductsMcpServer(controller)
    const registeredTools = (server as unknown as {
      _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }>
    })._registeredTools

    const mockResult = { content: [{ type: 'text' as const, text: 'details' }] }
    vi.mocked(controller.getProductDetails).mockResolvedValueOnce(mockResult)

    const args = { id: '123' }
    const result = await registeredTools.get_product_details.handler(args)

    expect(controller.getProductDetails).toHaveBeenCalledWith(args)
    expect(result).toBe(mockResult)
  })

  it('should delegate reserve_product call to controller.reserveProduct', async () => {
    const server = createProductsMcpServer(controller)
    const registeredTools = (server as unknown as {
      _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }>
    })._registeredTools

    const mockResult = { content: [{ type: 'text' as const, text: 'reserved' }] }
    vi.mocked(controller.reserveProduct).mockResolvedValueOnce(mockResult)

    const args = { productId: '123', quantity: 2, reason: 'test' }
    const result = await registeredTools.reserve_product.handler(args)

    expect(controller.reserveProduct).toHaveBeenCalledWith(args)
    expect(result).toBe(mockResult)
  })

  it('should delegate cancel_reservation call to controller.cancelReservation', async () => {
    const server = createProductsMcpServer(controller)
    const registeredTools = (server as unknown as {
      _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }>
    })._registeredTools

    const mockResult = { content: [{ type: 'text' as const, text: 'cancelled' }] }
    vi.mocked(controller.cancelReservation).mockResolvedValueOnce(mockResult)

    const args = { reservationId: 'res-123', reason: 'test' }
    const result = await registeredTools.cancel_reservation.handler(args)

    expect(controller.cancelReservation).toHaveBeenCalledWith(args)
    expect(result).toBe(mockResult)
  })

  it('should delegate get_stock_history call to controller.getStockHistory', async () => {
    const server = createProductsMcpServer(controller)
    const registeredTools = (server as unknown as {
      _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }>
    })._registeredTools

    const mockResult = { content: [{ type: 'text' as const, text: '[]' }] }
    vi.mocked(controller.getStockHistory).mockResolvedValueOnce(mockResult)

    const args = { productId: 'prod-123' }
    const result = await registeredTools.get_stock_history.handler(args)

    expect(controller.getStockHistory).toHaveBeenCalledWith(args)
    expect(result).toBe(mockResult)
  })

  it('should delegate getCatalogSummary call to controller.getCatalogSummary', async () => {
    const server = createProductsMcpServer(controller)
    const registeredResources = (server as unknown as {
      _registeredResources: Record<string, { readCallback: (uri: URL) => Promise<unknown> }>
    })._registeredResources

    const mockResult = { contents: [] }
    vi.mocked(controller.getCatalogSummary).mockResolvedValueOnce(mockResult)

    const uri = new URL('products://catalog/summary')
    const result = await registeredResources['products://catalog/summary'].readCallback(uri)

    expect(controller.getCatalogSummary).toHaveBeenCalledWith('products://catalog/summary')
    expect(result).toBe(mockResult)
  })

  it('should delegate low_stock call to controller.getLowStockProducts', async () => {
    const server = createProductsMcpServer(controller)
    const registeredResources = (server as unknown as {
      _registeredResources: Record<string, { readCallback: (uri: URL) => Promise<unknown> }>
    })._registeredResources

    const mockResult = { contents: [] }
    vi.mocked(controller.getLowStockProducts).mockResolvedValueOnce(mockResult)

    const uri = new URL('products://stock/low-stock')
    const result = await registeredResources['products://stock/low-stock'].readCallback(uri)

    expect(controller.getLowStockProducts).toHaveBeenCalledWith('products://stock/low-stock')
    expect(result).toBe(mockResult)
  })

  it('should delegate product_by_id call to controller.getProductResource', async () => {
    const server = createProductsMcpServer(controller)
    const registeredResourceTemplates = (server as unknown as {
      _registeredResourceTemplates: Record<string, { readCallback: (uri: URL, vars: Record<string, unknown>) => Promise<unknown> }>
    })._registeredResourceTemplates

    const mockResult = { contents: [] }
    vi.mocked(controller.getProductResource).mockResolvedValueOnce(mockResult)

    const uri = new URL('products://prod-456')
    const result = await registeredResourceTemplates.product_by_id.readCallback(uri, { id: 'prod-456' })

    expect(controller.getProductResource).toHaveBeenCalledWith('products://prod-456', 'prod-456')
    expect(result).toBe(mockResult)
  })

  it('should delegate getRecommendProductsPrompt call to controller.getRecommendProductsPrompt', async () => {
    const server = createProductsMcpServer(controller)
    const registeredPrompts = (server as unknown as {
      _registeredPrompts: Record<string, { callback: (args: unknown) => unknown }>
    })._registeredPrompts

    const mockResult = { messages: [] }
    vi.mocked(controller.getRecommendProductsPrompt).mockReturnValueOnce(mockResult)

    const args = { category: 'Tech' }
    const result = registeredPrompts.recommend_products.callback(args)

    expect(controller.getRecommendProductsPrompt).toHaveBeenCalledWith({ category: 'Tech' })
    expect(result).toBe(mockResult)
  })
})

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
    const registeredTools = (server as unknown as { _registeredTools: Record<string, any> })._registeredTools
    const registeredResources = (server as unknown as { _registeredResources: Record<string, any> })._registeredResources
    const registeredTemplates = (server as unknown as { _registeredResourceTemplates: Record<string, any> })._registeredResourceTemplates
    const registeredPrompts = (server as unknown as { _registeredPrompts: Record<string, any> })._registeredPrompts

    expect((server as any).server?._serverInfo).toEqual({
      name: 'products-service',
      version: '1.0.0',
    })

    expect(registeredTools.search_products.description).toBe(
      'Search and filter products by keyword in name, category, tag, price range, and pagination.',
    )
    const searchShape = registeredTools.search_products.inputSchema.shape
    expect(searchShape.search.description).toBe('Keyword to search in product name')
    expect(searchShape.category.description).toBe('Filter by product category')
    expect(searchShape.tag.description).toBe('Filter by product tag')
    expect(searchShape.minPrice.description).toBe('Minimum price filter')
    expect(searchShape.maxPrice.description).toBe('Maximum price filter')
    expect(searchShape.active.description).toBe('Filter by active status (default: true)')
    expect(searchShape.page.description).toBe('Page number (default: 1)')
    expect(searchShape.pageSize.description).toBe('Items per page (default: 20)')

    expect(registeredTools.get_product_details.description).toBe('Get full details of a specific product by its ID or SKU.')
    const detailsShape = registeredTools.get_product_details.inputSchema.shape
    expect(detailsShape.id.description).toBe('Unique identifier (ID) of the product')
    expect(detailsShape.sku.description).toBe('SKU of the product')

    expect(registeredTools.reserve_product.description).toBe(
      'Reserve a quantity of a product, reducing available stock and recording the reservation.',
    )
    const reserveShape = registeredTools.reserve_product.inputSchema.shape
    expect(reserveShape.productId.description).toBe('Unique identifier (ID) of the product to reserve')
    expect(reserveShape.productId.safeParse('').success).toBe(false)
    expect(reserveShape.productId.safeParse('prod-123').success).toBe(true)
    expect(reserveShape.quantity.description).toBe('Quantity of product to reserve (default: 1)')
    expect(reserveShape.reason.description).toBe('Optional reason or reference for the reservation')

    expect(registeredTools.cancel_reservation.description).toBe(
      'Cancel a reservation using its reservation ID, returning the reserved quantity to available stock.',
    )
    const cancelShape = registeredTools.cancel_reservation.inputSchema.shape
    expect(cancelShape.reservationId.description).toBe('Unique identifier (ID) of the reservation to cancel')
    expect(cancelShape.reservationId.safeParse('').success).toBe(false)
    expect(cancelShape.reservationId.safeParse('res-123').success).toBe(true)
    expect(cancelShape.reason.description).toBe('Reason for cancellation')

    expect(registeredTools.get_stock_history.description).toBe('Get the stock movement history for a specific product.')
    const stockHistoryShape = registeredTools.get_stock_history.inputSchema.shape
    expect(stockHistoryShape.productId.description).toBe('Unique identifier (ID) of the product')
    expect(stockHistoryShape.productId.safeParse('').success).toBe(false)
    expect(stockHistoryShape.productId.safeParse('prod-123').success).toBe(true)

    expect(registeredResources['products://catalog/summary'].name).toBe('catalog_summary')
    expect(registeredResources['products://catalog/summary'].metadata).toEqual({
      description: 'Summary of active products, categories, and price ranges.',
      mimeType: 'application/json',
    })
    expect(registeredResources['products://stock/low-stock'].name).toBe('low_stock')
    expect(registeredResources['products://stock/low-stock'].metadata).toEqual({
      description: 'List of products with critically low stock (<= 5).',
      mimeType: 'application/json',
    })
    expect(registeredTemplates.product_by_id.metadata).toEqual({
      description: 'Dynamic resource for product details by ID',
      mimeType: 'application/json',
    })
    expect(registeredTemplates.product_by_id.resourceTemplate._uriTemplate.template).toBe('products://{id}')
    expect('list' in registeredTemplates.product_by_id.resourceTemplate._callbacks).toBe(true)
    expect(registeredTemplates.product_by_id.resourceTemplate._callbacks.list).toBeUndefined()

    expect(registeredPrompts.recommend_products.description).toBe(
      'Prompt guiding the LLM to recommend products based on user preferences and budget',
    )
    const promptShape = registeredPrompts.recommend_products.argsSchema.shape
    expect(promptShape.category.description).toBe('Preferred product category (optional)')
    expect(promptShape.budget.description).toBe('Customer budget limit (optional)')
    expect(promptShape.preferences.description).toBe('Specific preferences or requirements (optional)')
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

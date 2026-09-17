import type { ProductsMcpController } from '../../adapters/mcp/products.mcp-controller'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function createProductsMcpServer(controller: ProductsMcpController): McpServer {
  const server = new McpServer({
    name: 'products-service',
    version: '1.0.0',
  })

  // Tools
  server.registerTool('search_products', {
    description: 'Search and filter products by keyword in name, category, tag, price range, and pagination.',
    inputSchema: {
      search: z.string().optional().describe('Keyword to search in product name'),
      category: z.string().optional().describe('Filter by product category'),
      tag: z.string().optional().describe('Filter by product tag'),
      minPrice: z.number().nonnegative().optional().describe('Minimum price filter'),
      maxPrice: z.number().nonnegative().optional().describe('Maximum price filter'),
      active: z.boolean().optional().describe('Filter by active status (default: true)'),
      page: z.number().int().positive().optional().describe('Page number (default: 1)'),
      pageSize: z.number().int().positive().optional().describe('Items per page (default: 20)'),
    },
  }, async (args) => {
    return controller.searchProducts(args)
  })

  server.registerTool('get_product_details', {
    description: 'Get full details of a specific product by its ID or SKU.',
    inputSchema: {
      id: z.string().optional().describe('Unique identifier (ID) of the product'),
      sku: z.string().optional().describe('SKU of the product'),
    },
  }, async (args) => {
    return controller.getProductDetails(args)
  })

  server.registerTool('reserve_product', {
    description: 'Reserve a quantity of a product, reducing available stock and recording the reservation.',
    inputSchema: {
      productId: z.string().min(1).describe('Unique identifier (ID) of the product to reserve'),
      quantity: z.number().int().positive().optional().describe('Quantity of product to reserve (default: 1)'),
      reason: z.string().optional().describe('Optional reason or reference for the reservation'),
    },
  }, async (args) => {
    return controller.reserveProduct(args)
  })

  server.registerTool('cancel_reservation', {
    description: 'Cancel a reservation, returning the quantity to available stock.',
    inputSchema: {
      productId: z.string().min(1).describe('Unique identifier (ID) of the product'),
      quantity: z.number().int().positive().optional().describe('Quantity of product to return to stock (default: 1)'),
      reason: z.string().optional().describe('Reason for cancellation'),
    },
  }, async (args) => {
    return controller.cancelReservation(args)
  })

  server.registerTool('get_stock_history', {
    description: 'Get the stock movement history for a specific product.',
    inputSchema: {
      productId: z.string().min(1).describe('Unique identifier (ID) of the product'),
    },
  }, async (args) => {
    return controller.getStockHistory(args)
  })

  // Resources
  server.registerResource('catalog_summary', 'products://catalog/summary', {
    description: 'Summary of active products, categories, and price ranges.',
    mimeType: 'application/json',
  }, async (uri) => {
    return controller.getCatalogSummary(uri.href)
  })

  server.registerResource('low_stock', 'products://stock/low-stock', {
    description: 'List of products with critically low stock (<= 5).',
    mimeType: 'application/json',
  }, async (uri) => {
    return controller.getLowStockProducts(uri.href)
  })

  server.registerResource('product_by_id', new ResourceTemplate('products://{id}', { list: undefined }), {
    description: 'Dynamic resource for product details by ID',
    mimeType: 'application/json',
  }, async (uri, { id }) => {
    return controller.getProductResource(uri.href, id as string)
  })

  // Prompts
  server.registerPrompt('recommend_products', {
    description: 'Prompt guiding the LLM to recommend products based on user preferences and budget',
    argsSchema: {
      category: z.string().optional().describe('Preferred product category (optional)'),
      budget: z.string().optional().describe('Customer budget limit (optional)'),
      preferences: z.string().optional().describe('Specific preferences or requirements (optional)'),
    },
  }, (args) => {
    return controller.getRecommendProductsPrompt(args as Record<string, string>)
  })

  return server
}

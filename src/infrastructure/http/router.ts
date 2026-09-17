import type { Request, Response } from 'express'
import express from 'express'
import { ProductsController } from '../../adapters/controllers/products.controller'
import { ProductsMcpController } from '../../adapters/mcp'
import { authMiddleware } from '../../adapters/middlewares/auth.middleware'
import { CancelReservationUseCase } from '../../application/use-cases/products/cancel-reservation.use-case'
import { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case'
import { DecreaseStockUseCase } from '../../application/use-cases/products/decrease-stock.use-case'
import { DeleteProductUseCase } from '../../application/use-cases/products/delete-product.use-case'
import { GetCatalogSummaryUseCase } from '../../application/use-cases/products/get-catalog-summary.use-case'
import { GetLowStockProductsUseCase } from '../../application/use-cases/products/get-low-stock-products.use-case'
import { GetProductByIdUseCase } from '../../application/use-cases/products/get-product-by-id.use-case'
import { IncreaseStockUseCase } from '../../application/use-cases/products/increase-stock.use-case'
import { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case'
import { ListStockMovementsUseCase } from '../../application/use-cases/products/list-stock-movements.use-case'
import { ReserveProductUseCase } from '../../application/use-cases/products/reserve-product.use-case'
import { RestoreProductUseCase } from '../../application/use-cases/products/restore-product.use-case'
import { UpdateProductUseCase } from '../../application/use-cases/products/update-product.use-case'
import { ProductModel } from '../database/mongoose/models/product.model'
import { ReservationModel } from '../database/mongoose/models/reservation.model'
import { StockMovementModel } from '../database/mongoose/models/stock-movement.model'
import { MongooseTransactionManager } from '../database/mongoose/mongoose-transaction.manager'
import { MongooseProductRepository } from '../database/mongoose/repositories/mongoose-product.repository'
import { MongooseReservationRepository } from '../database/mongoose/repositories/mongoose-reservation.repository'
import { MongooseStockMovementRepository } from '../database/mongoose/repositories/mongoose-stock-movement.repository'
import { createMcpRouter, createProductsMcpServer } from '../mcp'

const router = express.Router()

// Infrastructure Adapters
const productRepository = new MongooseProductRepository(ProductModel)
const stockMovementRepository = new MongooseStockMovementRepository(StockMovementModel)
const reservationRepository = new MongooseReservationRepository(ReservationModel)
const transactionManager = new MongooseTransactionManager()

// Application Use Cases
const createProductUseCase = new CreateProductUseCase(productRepository)
const listProductsUseCase = new ListProductsUseCase(productRepository)
const getProductByIdUseCase = new GetProductByIdUseCase(productRepository)
const updateProductUseCase = new UpdateProductUseCase(productRepository)
const deleteProductUseCase = new DeleteProductUseCase(productRepository)
const restoreProductUseCase = new RestoreProductUseCase(productRepository)
const decreaseStockUseCase = new DecreaseStockUseCase(productRepository, stockMovementRepository, transactionManager)
const increaseStockUseCase = new IncreaseStockUseCase(productRepository, stockMovementRepository, transactionManager)
const listStockMovementsUseCase = new ListStockMovementsUseCase(productRepository, stockMovementRepository)
const reserveProductUseCase = new ReserveProductUseCase(decreaseStockUseCase, reservationRepository, transactionManager)
const cancelReservationUseCase = new CancelReservationUseCase(increaseStockUseCase, reservationRepository, transactionManager)
const getCatalogSummaryUseCase = new GetCatalogSummaryUseCase(productRepository)
const getLowStockProductsUseCase = new GetLowStockProductsUseCase(productRepository)

// Controllers
const productsController = new ProductsController({
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

const productsMcpController = new ProductsMcpController({
  listProductsUseCase,
  getProductByIdUseCase,
  reserveProductUseCase,
  cancelReservationUseCase,
  listStockMovementsUseCase,
  getCatalogSummaryUseCase,
  getLowStockProductsUseCase,
})

// MCP Infrastructure
const mcpRouter = createMcpRouter(() => createProductsMcpServer(productsMcpController))

router.use(authMiddleware)
router.use(mcpRouter)

router.post('/products', (req: Request, res: Response) => productsController.create(req, res))
router.get('/products', (req: Request, res: Response) => productsController.list(req, res))
router.get('/products/:id', (req: Request, res: Response) => productsController.show(req, res))
router.put('/products/:id', (req: Request, res: Response) => productsController.update(req, res))
router.patch('/products/:id', (req: Request, res: Response) => productsController.update(req, res))
router.delete('/products/:id', (req: Request, res: Response) => productsController.delete(req, res))
router.post('/products/:id/restore', (req: Request, res: Response) => productsController.restore(req, res))
router.post('/products/:id/decrease-stock', (req: Request, res: Response) => productsController.decreaseStock(req, res))
router.post('/products/:id/stock/decrease', (req: Request, res: Response) => productsController.decreaseStock(req, res))
router.post('/products/:id/increase-stock', (req: Request, res: Response) => productsController.increaseStock(req, res))
router.post('/products/:id/stock/increase', (req: Request, res: Response) => productsController.increaseStock(req, res))
router.get('/products/:id/stock-movements', (req: Request, res: Response) => productsController.listStockMovements(req, res))
router.get('/products/:id/movements', (req: Request, res: Response) => productsController.listStockMovements(req, res))

export default router

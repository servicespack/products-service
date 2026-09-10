import type { Request, Response } from 'express'
import express from 'express'
import { ProductsController } from '../../adapters/controllers/products.controller'
import { CreateProductUseCase } from '../../application/use-cases/products/create-product.use-case'
import { DecreaseStockUseCase } from '../../application/use-cases/products/decrease-stock.use-case'
import { DeleteProductUseCase } from '../../application/use-cases/products/delete-product.use-case'
import { GetProductByIdUseCase } from '../../application/use-cases/products/get-product-by-id.use-case'
import { IncreaseStockUseCase } from '../../application/use-cases/products/increase-stock.use-case'
import { ListProductsUseCase } from '../../application/use-cases/products/list-products.use-case'
import { ListStockMovementsUseCase } from '../../application/use-cases/products/list-stock-movements.use-case'
import { RestoreProductUseCase } from '../../application/use-cases/products/restore-product.use-case'
import { UpdateProductUseCase } from '../../application/use-cases/products/update-product.use-case'
import { ProductModel } from '../database/mongoose/models/product.model'
import { StockMovementModel } from '../database/mongoose/models/stock-movement.model'
import { MongooseProductRepository } from '../database/mongoose/repositories/mongoose-product.repository'
import { MongooseStockMovementRepository } from '../database/mongoose/repositories/mongoose-stock-movement.repository'

const router = express.Router()

// Infrastructure Adapters
const productRepository = new MongooseProductRepository(ProductModel)
const stockMovementRepository = new MongooseStockMovementRepository(StockMovementModel)

// Application Use Cases
const createProductUseCase = new CreateProductUseCase(productRepository)
const listProductsUseCase = new ListProductsUseCase(productRepository)
const getProductByIdUseCase = new GetProductByIdUseCase(productRepository)
const updateProductUseCase = new UpdateProductUseCase(productRepository)
const deleteProductUseCase = new DeleteProductUseCase(productRepository)
const restoreProductUseCase = new RestoreProductUseCase(productRepository)
const decreaseStockUseCase = new DecreaseStockUseCase(productRepository, stockMovementRepository)
const increaseStockUseCase = new IncreaseStockUseCase(productRepository, stockMovementRepository)
const listStockMovementsUseCase = new ListStockMovementsUseCase(productRepository, stockMovementRepository)

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

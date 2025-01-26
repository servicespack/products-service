import { Router } from 'express'
import { container } from '../config/container.config'
import { ProductsControllers } from '../controllers/products.controllers'

const router = Router()

const controllers = container.get<ProductsControllers>(ProductsControllers.name)

router
  .route('/products')
  .post(controllers.create.bind(controllers))
  .get(controllers.list.bind(controllers))

router
  .route('/products/:id')
  .get(controllers.findById.bind(controllers))

export { router }

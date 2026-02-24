import type { ProductsControllers } from '../controllers/products.controllers'
import { Router } from 'express'

export function createRouter(controllers: ProductsControllers) {
  const router = Router()

  router
    .route('/products')
    .post(controllers.create.bind(controllers))
    .get(controllers.list.bind(controllers))

  router
    .route('/products/:id')
    .get(controllers.findById.bind(controllers))

  return router
}

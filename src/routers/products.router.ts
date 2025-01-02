import { Router } from 'express'

import { database } from '../config/database.config'
import { ProductsControllers } from '../controllers/products.controllers'
import { ProductsService } from '../services/products.service'

const router = Router()

const service = new ProductsService(database.orm.em.fork())
const controllers = new ProductsControllers(service)

router
  .route('/products')
  .post(controllers.create.bind(controllers))
  .get(controllers.list.bind(controllers))

router
  .route('/products/:id')
  .get(controllers.findById.bind(controllers))

export { router }

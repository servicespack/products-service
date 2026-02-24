import * as process from 'node:process'

import { ProductsControllers } from './controllers/products.controllers'
import { ProductsService } from './services/products.service'

async function main() {
  const { database } = await import('./config/database.config')

  const em = database.orm.em.fork()
  const productsService = new ProductsService(em)
  const productsControllers = new ProductsControllers(productsService)
  const productsRouter = (await import('./routers/products.router')).createRouter(productsControllers)

  const [
    { logger },
    { createServer },
  ] = await Promise.all([
    import('./config/logger.config'),
    import('./server'),
  ])

  const server = createServer(productsRouter)

  await database
    .orm
    .schema
    .updateSchema()

  const { SERVER_PORT } = process.env

  server.listen(SERVER_PORT, () => logger.info(`Server listening on ${SERVER_PORT}`))
}

export default main()

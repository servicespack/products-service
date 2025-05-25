import * as process from 'node:process'
import { EntityManager } from '@mikro-orm/core'
import { container } from './config/container.config'
import { ProductsControllers } from './controllers/products.controllers'
import { ProductsService } from './services/products.service'

async function main() {
  const { database } = await import('./config/database.config')

  container.bind(EntityManager.name).toConstantValue(database.orm.em.fork())
  container.bind(ProductsService.name).to(ProductsService)
  container.bind(ProductsControllers.name).to(ProductsControllers)

  const [
    { logger },
    { server },
  ] = await Promise.all([
    import('./config/logger.config'),
    import('./server'),
  ])

  await database
    .orm
    .getSchemaGenerator()
    .updateSchema()

  const { SERVER_PORT } = process.env

  server.listen(SERVER_PORT, () => logger.info(`Server listening on ${SERVER_PORT}`))
}

export default main()

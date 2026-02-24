import type { Application } from 'express'
import { faker } from '@faker-js/faker'
import request from 'supertest'
import { beforeAll, describe, it } from 'vitest'

describe('products (e2e)', () => {
  let server: Application

  beforeAll(async () => {
    const { database } = await import('../../config/database.config')
    const { ProductsService } = await import('../../services/products.service')
    const { ProductsControllers } = await import('../../controllers/products.controllers')
    const { createRouter } = await import('../../routers/products.router')
    const { createServer } = await import('../../server')

    const em = database.orm.em.fork()
    const productsService = new ProductsService(em)
    const productsControllers = new ProductsControllers(productsService)
    const productsRouter = createRouter(productsControllers)

    await database
      .orm
      .schema
      .updateSchema()

    server = createServer(productsRouter)
  })

  it('should create a product', () => {
    return request(server)
      .post('/products')
      .send({
        name: faker.commerce.product(),
        price: Number(faker.commerce.price()),
      })
      .expect(201)
  })

  it('should list the products', () => {
    return request(server)
      .get('/products')
      .expect(200)
  })

  it('should find a product by id', async () => {
    const response = await request(server)
      .post('/products')
      .send({
        name: faker.commerce.product(),
        price: Number(faker.commerce.price()),
      })

    return request(server)
      .get(`/products/${response.body.id}`)
      .expect(200)
  })
})

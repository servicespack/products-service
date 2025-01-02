import type { Application } from 'express'
import { faker } from '@faker-js/faker'
import supertest from 'supertest'
import { beforeAll, describe, it } from 'vitest'

describe('products (e2e)', () => {
  let server: Application

  beforeAll(async () => {
    const { database } = await import('../../config/database.config')

    await database
      .orm
      .getSchemaGenerator()
      .updateSchema()

    server = (await import('../../server'))
      .server
  })

  it('should create a product', () => {
    return supertest(server)
      .post('/products')
      .send({
        name: faker.commerce.product(),
        price: Number(faker.commerce.price()),
      })
      .expect(201)
  })

  it('should list the products', () => {
    return supertest(server)
      .get('/products')
      .expect(200)
  })

  it('should find a product by id', async () => {
    const response = await supertest(server)
      .post('/products')
      .send({
        name: faker.commerce.product(),
        price: Number(faker.commerce.price()),
      })

    return supertest(server)
      .get(`/products/${response.body.id}`)
      .expect(200)
  })
})

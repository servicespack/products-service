import { beforeAll, describe, it } from 'vitest'
import supertest from 'supertest'
import type { Application } from 'express'

describe('Products (e2e)', () => {
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
        name: 'Something'
      })
      .expect(201)
  })

  it('should list the products', () => {
    return supertest(server)
      .get('/products')
      .expect(200)
  })
})

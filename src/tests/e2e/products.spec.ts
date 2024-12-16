import { beforeAll, describe, it } from 'vitest'
import supertest from 'supertest'
import type { Application } from 'express'

describe('Products (e2e)', () => {
  let server: Application

  beforeAll(async () => {
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

  it('shoudl list the products', () => {
    return supertest(server)
      .get('/products')
      .expect(200)
  })
})

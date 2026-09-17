import { faker } from '@faker-js/faker'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { connectDatabase } from '../../src/config/database'
import { server } from '../../src/infrastructure/http/server'
import { generateTestToken } from '../helpers/auth.helper'

describe('products (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    await connectDatabase()
    authToken = `Bearer ${generateTestToken()}`
  })

  afterAll(() => {
    server.close()
  })

  it('should reject unauthenticated requests', async () => {
    await request(server)
      .get('/products')
      .expect(401)
  })

  it('should create a product', async () => {
    const response = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: faker.commerce.product(),
        price: Number(faker.commerce.price()),
      })
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('price')
  })

  it('should list the products', async () => {
    const response = await request(server)
      .get('/products')
      .set('Authorization', authToken)
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('should find a product by id', async () => {
    const response = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: faker.commerce.product(),
        price: Number(faker.commerce.price()),
      })

    return request(server)
      .get(`/products/${response.body.id}`)
      .set('Authorization', authToken)
      .expect(200)
  })

  it('should update a product by id', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Initial Product',
        price: 99.99,
        sku: 'INIT-01',
      })
      .expect(201)

    const updateResponse = await request(server)
      .put(`/products/${created.body.id}`)
      .set('Authorization', authToken)
      .send({
        name: 'Updated Product Name',
        price: 149.99,
      })
      .expect(200)

    expect(updateResponse.body.id).toBe(created.body.id)
    expect(updateResponse.body.name).toBe('Updated Product Name')
    expect(updateResponse.body.price).toBe(149.99)

    const getResponse = await request(server)
      .get(`/products/${created.body.id}`)
      .set('Authorization', authToken)
      .expect(200)

    expect(getResponse.body.name).toBe('Updated Product Name')
    expect(getResponse.body.price).toBe(149.99)
  })

  it('should delete a product by id', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Product to Delete',
        price: 29.99,
      })
      .expect(201)

    await request(server)
      .delete(`/products/${created.body.id}`)
      .set('Authorization', authToken)
      .expect(204)

    await request(server)
      .get(`/products/${created.body.id}`)
      .set('Authorization', authToken)
      .expect(404)
  })

  it('should filter products by search, sku, price range, and active', async () => {
    const uniqueSku = `SKU-FILTER-${faker.string.alphanumeric(6)}`

    await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Special Searchable Item',
        price: 75,
        sku: uniqueSku,
        active: true,
      })
      .expect(201)

    const listResponse = await request(server)
      .get(`/products?search=Searchable&sku=${uniqueSku}&minPrice=50&maxPrice=100&active=true`)
      .set('Authorization', authToken)
      .expect(200)

    expect(listResponse.body.data.length).toBeGreaterThanOrEqual(1)
    expect(listResponse.body.data.some((p: { sku?: string }) => p.sku === uniqueSku)).toBe(true)
  })

  it('should return 400 Bad Request on missing required fields when creating', async () => {
    await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({})
      .expect(400)
  })

  it('should return 404 when product is not found', async () => {
    const nonExistentId = faker.string.uuid()
    const response = await request(server)
      .get(`/products/${nonExistentId}`)
      .set('Authorization', authToken)
      .expect(404)

    expect(response.body).toEqual({ error: 'Product not found' })
  })

  it('should return 404 when updating non-existent product', async () => {
    const nonExistentId = faker.string.uuid()
    const response = await request(server)
      .put(`/products/${nonExistentId}`)
      .set('Authorization', authToken)
      .send({ name: 'Does Not Exist' })
      .expect(404)

    expect(response.body).toEqual({ error: 'Product not found' })
  })

  it('should return 404 when deleting non-existent product', async () => {
    const nonExistentId = faker.string.uuid()
    const response = await request(server)
      .delete(`/products/${nonExistentId}`)
      .set('Authorization', authToken)
      .expect(404)

    expect(response.body).toEqual({ error: 'Product not found' })
  })

  it('should decrease and increase product stock', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Stock Managed Item',
        price: 50,
        stock: 10,
      })
      .expect(201)

    const decreaseRes = await request(server)
      .post(`/products/${created.body.id}/decrease-stock`)
      .set('Authorization', authToken)
      .send({ quantity: 4 })
      .expect(200)

    expect(decreaseRes.body.stock).toBe(6)

    const increaseRes = await request(server)
      .post(`/products/${created.body.id}/increase-stock`)
      .set('Authorization', authToken)
      .send({ quantity: 8 })
      .expect(200)

    expect(increaseRes.body.stock).toBe(14)
  })

  it('should return 409 Conflict when attempting to decrease more stock than available', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Low Stock Item',
        price: 30,
        stock: 2,
      })
      .expect(201)

    const response = await request(server)
      .post(`/products/${created.body.id}/decrease-stock`)
      .set('Authorization', authToken)
      .send({ quantity: 5 })
      .expect(409)

    expect(response.body).toEqual({ error: 'Insufficient stock' })
  })

  it('should prevent race condition when two concurrent requests try to take the last remaining unit', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Rare Item (Only 1 left)',
        price: 999.99,
        stock: 1,
      })
      .expect(201)

    const productId = created.body.id

    // Two concurrent users trying to buy/reserve the same single unit
    const [res1, res2] = await Promise.all([
      request(server).post(`/products/${productId}/decrease-stock`).set('Authorization', authToken).send({ quantity: 1 }),
      request(server).post(`/products/${productId}/decrease-stock`).set('Authorization', authToken).send({ quantity: 1 }),
    ])

    const statusCodes = [res1.status, res2.status].sort()
    expect(statusCodes).toEqual([200, 409])

    const successfulRes = res1.status === 200 ? res1 : res2
    const conflictedRes = res1.status === 409 ? res1 : res2

    expect(successfulRes.body.stock).toBe(0)
    expect(conflictedRes.body).toEqual({ error: 'Insufficient stock' })

    // Verify database state has exactly 0 stock
    const getRes = await request(server).get(`/products/${productId}`).set('Authorization', authToken).expect(200)
    expect(getRes.body.stock).toBe(0)
  })

  it('should support categories and tags in create, update, and filtering', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Gaming Laptop RTX',
        price: 2500,
        categories: ['Computers', 'Gaming'],
        tags: ['rtx4080', 'portable'],
      })
      .expect(201)

    expect(created.body.categories).toEqual(['Computers', 'Gaming'])
    expect(created.body.tags).toEqual(['rtx4080', 'portable'])

    const filterCategory = await request(server)
      .get('/products?category=Gaming')
      .set('Authorization', authToken)
      .expect(200)

    expect(filterCategory.body.data.some((p: { id: string }) => p.id === created.body.id)).toBe(true)

    const filterTag = await request(server)
      .get('/products?tag=rtx4080')
      .set('Authorization', authToken)
      .expect(200)

    expect(filterTag.body.data.some((p: { id: string }) => p.id === created.body.id)).toBe(true)
  })

  it('should soft delete and restore a product', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Product for Soft Delete Test',
        price: 120,
      })
      .expect(201)

    const productId = created.body.id

    // Soft delete
    await request(server)
      .delete(`/products/${productId}`)
      .set('Authorization', authToken)
      .expect(204)

    // Standard show should return 404
    await request(server)
      .get(`/products/${productId}`)
      .set('Authorization', authToken)
      .expect(404)

    // Show with includeDeleted=true should return product
    const getDeleted = await request(server)
      .get(`/products/${productId}?includeDeleted=true`)
      .set('Authorization', authToken)
      .expect(200)

    expect(getDeleted.body.deletedAt).not.toBeNull()

    // Restore product
    const restored = await request(server)
      .post(`/products/${productId}/restore`)
      .set('Authorization', authToken)
      .expect(200)

    expect(restored.body.deletedAt).toBeNull()

    // Now standard show should work again
    await request(server)
      .get(`/products/${productId}`)
      .set('Authorization', authToken)
      .expect(200)
  })

  it('should track stock movements history on stock changes', async () => {
    const created = await request(server)
      .post('/products')
      .set('Authorization', authToken)
      .send({
        name: 'Audited Inventory Item',
        price: 80,
        stock: 20,
      })
      .expect(201)

    const productId = created.body.id

    // Decrease stock
    await request(server)
      .post(`/products/${productId}/decrease-stock`)
      .set('Authorization', authToken)
      .send({ quantity: 5, reason: 'Customer order #1001' })
      .expect(200)

    // Increase stock
    await request(server)
      .post(`/products/${productId}/increase-stock`)
      .set('Authorization', authToken)
      .send({ quantity: 15, reason: 'Supplier restock #4002' })
      .expect(200)

    // Retrieve stock movements
    const movementsRes = await request(server)
      .get(`/products/${productId}/stock-movements`)
      .set('Authorization', authToken)
      .expect(200)

    expect(movementsRes.body).toHaveProperty('data')
    expect(movementsRes.body.data).toHaveLength(2)

    const [latest, first] = movementsRes.body.data

    expect(latest.type).toBe('INCREMENT')
    expect(latest.quantity).toBe(15)
    expect(latest.previousStock).toBe(15)
    expect(latest.currentStock).toBe(30)
    expect(latest.reason).toBe('Supplier restock #4002')

    expect(first.type).toBe('DECREMENT')
    expect(first.quantity).toBe(5)
    expect(first.previousStock).toBe(20)
    expect(first.currentStock).toBe(15)
    expect(first.reason).toBe('Customer order #1001')
  })
})

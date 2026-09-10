import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { server } from '../src/infrastructure/http/server'

describe('http server', () => {
  afterAll(() => {
    server.close()
  })

  it('should handle invalid JSON syntax errors', async () => {
    const response = await request(server)
      .post('/products')
      .set('Content-Type', 'application/json')
      .send('{"invalid json')

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })
})

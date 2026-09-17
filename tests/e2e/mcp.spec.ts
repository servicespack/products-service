import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { faker } from '@faker-js/faker'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { connectDatabase } from '../../src/config/database'
import { server } from '../../src/infrastructure/http/server'
import { generateTestToken } from '../helpers/auth.helper'

class SseMessageQueue {
  private buffer = ''
  private messages: Array<unknown> = []
  private waiters: Array<(msg: unknown) => void> = []

  constructor(private readonly reader: ReadableStreamDefaultReader<Uint8Array>) {
    this.startReading()
  }

  private async startReading() {
    try {
      while (true) {
        const { value, done } = await this.reader.read()
        if (done)
          break
        this.buffer += new TextDecoder().decode(value)
        const parts = this.buffer.split('\n\n')
        this.buffer = parts.pop() || ''

        for (const block of parts) {
          for (const line of block.split('\n')) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim()
              if (dataStr.startsWith('{')) {
                const parsed = JSON.parse(dataStr)
                if (this.waiters.length > 0) {
                  const waiter = this.waiters.shift()!
                  waiter(parsed)
                }
                else {
                  this.messages.push(parsed)
                }
              }
              else if (dataStr.includes('sessionId=')) {
                if (this.waiters.length > 0) {
                  const waiter = this.waiters.shift()!
                  waiter(dataStr)
                }
                else {
                  this.messages.push(dataStr)
                }
              }
            }
          }
        }
      }
    }
    catch {
      // Aborted or closed
    }
  }

  async nextMessage(timeoutMs = 5000): Promise<unknown> {
    if (this.messages.length > 0) {
      return this.messages.shift()
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.indexOf(resolve)
        if (idx !== -1)
          this.waiters.splice(idx, 1)
        reject(new Error(`Timed out waiting for SSE message after ${timeoutMs}ms`))
      }, timeoutMs)

      this.waiters.push((msg) => {
        clearTimeout(timer)
        resolve(msg)
      })
    })
  }
}

describe('mcp server (e2e)', () => {
  let httpServer: Server
  let baseUrl: string
  let abortController: AbortController
  let sseQueue: SseMessageQueue
  let sessionId: string
  let authToken: string

  beforeAll(async () => {
    await connectDatabase()

    authToken = generateTestToken()

    await new Promise<void>((resolve) => {
      httpServer = server.listen(0, () => resolve())
    })

    const port = (httpServer.address() as AddressInfo).port
    baseUrl = `http://localhost:${port}`

    abortController = new AbortController()
    const sseResponse = await fetch(`${baseUrl}/sse?token=${authToken}`, { signal: abortController.signal })
    expect(sseResponse.status).toBe(200)
    expect(sseResponse.headers.get('content-type')).toContain('text/event-stream')

    sseQueue = new SseMessageQueue(sseResponse.body!.getReader())

    // First SSE event is the endpoint info with sessionId
    const endpointData = (await sseQueue.nextMessage()) as string
    expect(endpointData).toContain('/messages?sessionId=')
    sessionId = endpointData.split('sessionId=')[1]
    expect(sessionId).toBeDefined()
  })

  afterAll(() => {
    abortController?.abort()
    httpServer?.closeAllConnections?.()
    httpServer?.close()
  })

  it('should initialize MCP session via JSON-RPC over HTTP and SSE', async () => {
    const initResponse = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'e2e-test-client', version: '1.0.0' },
        },
      }),
    })

    expect(initResponse.status).toBe(202)

    const initResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        serverInfo: { name: string, version: string }
        capabilities: { tools: unknown }
      }
    }

    expect(initResult.id).toBe(1)
    expect(initResult.result.serverInfo.name).toBe('products-service')
    expect(initResult.result.capabilities).toHaveProperty('tools')
  })

  it('should list registered tools: search_products and reserve_product', async () => {
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
    })

    const toolsResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        tools: Array<{ name: string, description: string }>
      }
    }

    expect(toolsResult.id).toBe(2)
    const toolNames = toolsResult.result.tools.map(t => t.name)
    expect(toolNames).toContain('search_products')
    expect(toolNames).toContain('reserve_product')
  })

  it('should call search_products and return matching products', async () => {
    const uniqueName = `MCP Gaming Laptop ${faker.string.alphanumeric(8)}`
    await request(httpServer)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: uniqueName,
        price: 1500,
        stock: 10,
        categories: ['Computers'],
      })
      .expect(201)

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'search_products',
          arguments: {
            search: uniqueName,
          },
        },
      }),
    })

    const callResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        content: Array<{ type: string, text: string }>
        isError?: boolean
      }
    }

    expect(callResult.id).toBe(3)
    expect(callResult.result.isError).toBeUndefined()
    expect(callResult.result.content[0].text).toContain(uniqueName)
  })

  it('should call reserve_product and decrement stock in the database', async () => {
    const created = await request(httpServer)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Reservable Product ${faker.string.alphanumeric(6)}`,
        price: 250,
        stock: 5,
      })
      .expect(201)

    const productId = created.body.id

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'reserve_product',
          arguments: {
            productId,
            quantity: 2,
            reason: 'Order #MCP-1',
          },
        },
      }),
    })

    const callResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        content: Array<{ type: string, text: string }>
        isError?: boolean
      }
    }

    expect(callResult.id).toBe(4)
    expect(callResult.result.isError).toBeUndefined()
    const parsed = JSON.parse(callResult.result.content[0].text)
    expect(parsed.message).toContain('Successfully reserved 2 unit(s)')
    expect(parsed.product.stock).toBe(3)
    expect(parsed.reservationId).toBeDefined()

    // Verify stock in database via HTTP API
    const checkProduct = await request(httpServer).get(`/products/${productId}`).set('Authorization', `Bearer ${authToken}`).expect(200)
    expect(checkProduct.body.stock).toBe(3)

    // Call cancel_reservation with the reservationId
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 41,
        method: 'tools/call',
        params: {
          name: 'cancel_reservation',
          arguments: {
            reservationId: parsed.reservationId,
            reason: 'Order cancelled',
          },
        },
      }),
    })

    const cancelResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        content: Array<{ type: string, text: string }>
        isError?: boolean
      }
    }

    expect(cancelResult.id).toBe(41)
    expect(cancelResult.result.isError).toBeUndefined()
    const cancelParsed = JSON.parse(cancelResult.result.content[0].text)
    expect(cancelParsed.product.stock).toBe(5)

    // Verify stock restored in database
    const restoredProduct = await request(httpServer).get(`/products/${productId}`).set('Authorization', `Bearer ${authToken}`).expect(200)
    expect(restoredProduct.body.stock).toBe(5)

    // Repeated cancellation should fail and not inflate stock
    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 42,
        method: 'tools/call',
        params: {
          name: 'cancel_reservation',
          arguments: {
            reservationId: parsed.reservationId,
          },
        },
      }),
    })

    const repeatedCancelResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        content: Array<{ type: string, text: string }>
        isError?: boolean
      }
    }

    expect(repeatedCancelResult.id).toBe(42)
    expect(repeatedCancelResult.result.isError).toBe(true)
    expect(repeatedCancelResult.result.content[0].text).toContain('has already been cancelled')

    const uninflatedProduct = await request(httpServer).get(`/products/${productId}`).set('Authorization', `Bearer ${authToken}`).expect(200)
    expect(uninflatedProduct.body.stock).toBe(5)
  })

  it('should return error when reserving more stock than available', async () => {
    const created = await request(httpServer)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Low Stock Item ${faker.string.alphanumeric(6)}`,
        price: 50,
        stock: 1,
      })
      .expect(201)

    const productId = created.body.id

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'reserve_product',
          arguments: {
            productId,
            quantity: 10,
          },
        },
      }),
    })

    const callResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        content: Array<{ type: string, text: string }>
        isError?: boolean
      }
    }

    expect(callResult.id).toBe(5)
    expect(callResult.result.isError).toBe(true)
    expect(callResult.result.content[0].text).toContain('Insufficient stock to reserve 10 unit(s)')
  })

  it('should return error when reserving a nonexistent product', async () => {
    const nonExistentId = '660000000000000000000099'

    await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'reserve_product',
          arguments: {
            productId: nonExistentId,
            quantity: 1,
          },
        },
      }),
    })

    const callResult = (await sseQueue.nextMessage()) as {
      jsonrpc: string
      id: number
      result: {
        content: Array<{ type: string, text: string }>
        isError?: boolean
      }
    }

    expect(callResult.id).toBe(6)
    expect(callResult.result.isError).toBe(true)
    expect(callResult.result.content[0].text).toContain(`Product with ID "${nonExistentId}" not found.`)
  })

  it('should support concurrent SSE connections simultaneously', async () => {
    const concurrentAbortController = new AbortController()
    try {
      const concurrentSseResponse = await fetch(`${baseUrl}/sse?token=${authToken}`, {
        signal: concurrentAbortController.signal,
      })
      expect(concurrentSseResponse.status).toBe(200)
      expect(concurrentSseResponse.headers.get('content-type')).toContain('text/event-stream')

      const concurrentQueue = new SseMessageQueue(concurrentSseResponse.body!.getReader())
      const endpointData = (await concurrentQueue.nextMessage()) as string
      expect(endpointData).toContain('/messages?sessionId=')
      const concurrentSessionId = endpointData.split('sessionId=')[1]
      expect(concurrentSessionId).toBeDefined()
      expect(concurrentSessionId).not.toBe(sessionId)
    }
    finally {
      concurrentAbortController.abort()
    }
  })
})

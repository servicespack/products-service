import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMcpRouter } from './mcp.router'

describe('createMcpRouter', () => {
  let mcpServer: McpServer
  let app: express.Express

  beforeEach(() => {
    mcpServer = {
      connect: vi.fn(),
    } as unknown as McpServer

    app = express()
    app.use(express.json())
    app.use(createMcpRouter(mcpServer))
  })

  it('should return 404 on POST /messages when sessionId is missing or invalid', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
      .expect(404)

    expect(res.body).toEqual({ error: 'Session not found' })
  })

  it('should return 404 on POST /mcp/messages when sessionId is invalid', async () => {
    const res = await request(app)
      .post('/mcp/messages?sessionId=invalid-id')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
      .expect(404)

    expect(res.body).toEqual({ error: 'Session not found' })
  })

  it('should establish SSE connection and connect transport to mcpServer', async () => {
    vi.mocked(mcpServer.connect).mockImplementation(async (transport) => {
      await transport.start()
    })

    const server = app.listen(0)
    const { port } = server.address() as { port: number }
    const abortController = new AbortController()

    try {
      const res = await fetch(`http://localhost:${port}/sse`, {
        signal: abortController.signal,
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/event-stream')

      const reader = res.body!.getReader()
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)

      expect(text).toContain('event: endpoint')
      expect(text).toContain('/messages?sessionId=')
      expect(mcpServer.connect).toHaveBeenCalledOnce()
    }
    finally {
      abortController.abort()
      server.close()
    }
  })

  it('should establish SSE connection on /mcp/sse with /mcp/messages endpoint', async () => {
    vi.mocked(mcpServer.connect).mockImplementation(async (transport) => {
      await transport.start()
    })

    const server = app.listen(0)
    const { port } = server.address() as { port: number }
    const abortController = new AbortController()

    try {
      const res = await fetch(`http://localhost:${port}/mcp/sse`, {
        signal: abortController.signal,
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/event-stream')

      const reader = res.body!.getReader()
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)

      expect(text).toContain('event: endpoint')
      expect(text).toContain('/mcp/messages?sessionId=')
    }
    finally {
      abortController.abort()
      server.close()
    }
  })

  it('should instantiate a new McpServer per SSE connection when factory is provided', async () => {
    const serverInstances: McpServer[] = []
    const factory = vi.fn(() => {
      const instance = {
        connect: vi.fn().mockImplementation(async (transport) => {
          await transport.start()
        }),
        close: vi.fn(),
      } as unknown as McpServer
      serverInstances.push(instance)
      return instance
    })

    const customApp = express()
    customApp.use(createMcpRouter(factory))

    const testServer = customApp.listen(0)
    const { port } = testServer.address() as { port: number }
    const abort1 = new AbortController()
    const abort2 = new AbortController()

    try {
      const res1 = await fetch(`http://localhost:${port}/sse`, { signal: abort1.signal })
      expect(res1.status).toBe(200)

      const res2 = await fetch(`http://localhost:${port}/sse`, { signal: abort2.signal })
      expect(res2.status).toBe(200)

      expect(factory).toHaveBeenCalledTimes(2)
      expect(serverInstances).toHaveLength(2)
      expect(serverInstances[0]).not.toBe(serverInstances[1])
    }
    finally {
      abort1.abort()
      abort2.abort()
      testServer.close()
    }
  })

  it('should handle errors gracefully in handlePostMessages when transport throws', async () => {
    vi.mocked(mcpServer.connect).mockImplementation(async (transport) => {
      await transport.start()
      // Mock handlePostMessage throwing an error
      ;(transport as SSEServerTransport).handlePostMessage = vi.fn().mockRejectedValueOnce(new Error('Transport processing failure'))
    })

    const server = app.listen(0)
    const { port } = server.address() as { port: number }
    const abortController = new AbortController()

    try {
      const res = await fetch(`http://localhost:${port}/sse`, { signal: abortController.signal })
      const reader = res.body!.getReader()
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)
      const sessionId = text.split('sessionId=')[1]?.trim()

      const postRes = await request(app)
        .post(`/messages?sessionId=${sessionId}`)
        .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
        .expect(500)

      expect(postRes.body).toEqual({ error: 'Transport processing failure' })
    }
    finally {
      abortController.abort()
      server.close()
    }
  })
})

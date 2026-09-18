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
      expect(text).not.toContain('/mcp/messages')
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

      expect(postRes.body).toEqual({ error: 'Failed to process MCP message' })
    }
    finally {
      abortController.abort()
      server.close()
    }
  })

  it('should return 500 on SSE connection error when headers are not sent', async () => {
    vi.mocked(mcpServer.connect).mockRejectedValueOnce(new Error('Connection failed'))

    const res = await request(app)
      .get('/sse')
      .expect(500)

    expect(res.body).toEqual({ error: 'Failed to establish MCP connection' })
  })

  it('should construct messagesEndpoint using req.baseUrl when router is mounted on a subpath', async () => {
    vi.mocked(mcpServer.connect).mockImplementation(async (transport) => {
      await transport.start()
    })

    const prefixedApp = express()
    prefixedApp.use('/api', createMcpRouter(mcpServer))

    const server = prefixedApp.listen(0)
    const { port } = server.address() as { port: number }
    const abortController = new AbortController()

    try {
      const res = await fetch(`http://localhost:${port}/api/sse`, { signal: abortController.signal })
      const reader = res.body!.getReader()
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)

      expect(text).toContain('/api/messages?sessionId=')
    }
    finally {
      abortController.abort()
      server.close()
    }
  })

  it('should clean up session on transport.onclose and handle close errors gracefully', async () => {
    let capturedTransport: any
    const mockClose = vi.fn().mockRejectedValueOnce(new Error('Close failure'))
    const closeableServer = {
      connect: vi.fn().mockImplementation(async (transport) => {
        capturedTransport = transport
        await transport.start()
      }),
      close: mockClose,
    } as unknown as McpServer

    const customApp = express()
    customApp.use(express.json())
    customApp.use(createMcpRouter(closeableServer))

    const server = customApp.listen(0)
    const { port } = server.address() as { port: number }
    const abortController = new AbortController()

    try {
      const res = await fetch(`http://localhost:${port}/sse`, { signal: abortController.signal })
      const reader = res.body!.getReader()
      const { value } = await reader.read()
      const text = new TextDecoder().decode(value)
      const sessionId = text.split('sessionId=')[1]?.trim()

      expect(capturedTransport).toBeDefined()

      // Trigger transport.onclose first time
      capturedTransport.onclose()
      await new Promise(process.nextTick)

      expect(mockClose).toHaveBeenCalledTimes(1)

      // Trigger transport.onclose second time - should be ignored (isClosing)
      capturedTransport.onclose()
      await new Promise(process.nextTick)

      expect(mockClose).toHaveBeenCalledTimes(1)

      // Session should have been deleted
      await request(customApp)
        .post(`/messages?sessionId=${sessionId}`)
        .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
        .expect(404)
    }
    finally {
      abortController.abort()
      server.close()
    }
  })

  it('should support x-session-id header in handlePostMessages', async () => {
    vi.mocked(mcpServer.connect).mockImplementation(async (transport) => {
      await transport.start()
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
        .post('/messages')
        .set('x-session-id', sessionId)
        .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
        .expect(202)

      expect(postRes.status).toBe(202)
    }
    finally {
      abortController.abort()
      server.close()
    }
  })

  it('should not send 500 when headers were already sent on error', async () => {
    vi.mocked(mcpServer.connect).mockImplementation(async () => {
      throw new Error('Connection failed')
    })

    const customApp = express()
    customApp.get('/sse', (_req, res, next) => {
      res.writeHead(200)
      res.end('already sent')
      next()
    })
    customApp.use(createMcpRouter(mcpServer))

    const res = await request(customApp).get('/sse')
    expect(res.status).toBe(200)
  })
})

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Request, Response } from 'express'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'

export type McpServerFactory = () => McpServer

export function createMcpRouter(mcpServerOrFactory: McpServer | McpServerFactory): express.Router {
  const router = express.Router()
  const transports = new Map<string, SSEServerTransport>()
  const servers = new Map<string, McpServer>()

  const handleSse = async (req: Request, res: Response) => {
    try {
      const messagesEndpoint = req.baseUrl
        ? `${req.baseUrl}/messages`
        : (req.path.startsWith('/mcp') ? '/mcp/messages' : '/messages')

      const transport = new SSEServerTransport(messagesEndpoint, res)
      const server = typeof mcpServerOrFactory === 'function' ? mcpServerOrFactory() : mcpServerOrFactory

      transports.set(transport.sessionId, transport)
      servers.set(transport.sessionId, server)

      let isClosing = false
      const cleanup = async () => {
        if (isClosing) {
          return
        }
        isClosing = true
        transports.delete(transport.sessionId)
        servers.delete(transport.sessionId)
        try {
          if (typeof server?.close === 'function') {
            await server.close()
          }
        }
        catch {
          // Ignore close errors during disconnect
        }
      }

      transport.onclose = () => {
        void cleanup()
      }

      req.on('close', () => {
        void cleanup()
      })

      await server.connect(transport)
    }
    catch {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish MCP connection' })
      }
    }
  }

  const handlePostMessages = async (req: Request, res: Response) => {
    try {
      const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string)
      const transport = sessionId ? transports.get(sessionId) : undefined

      if (!transport) {
        return res.status(404).json({ error: 'Session not found' })
      }

      await transport.handlePostMessage(req, res, req.body)
    }
    catch {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process MCP message' })
      }
    }
  }

  router.get('/sse', handleSse)
  router.get('/mcp/sse', handleSse)

  router.post('/messages', handlePostMessages)
  router.post('/mcp/messages', handlePostMessages)

  return router
}

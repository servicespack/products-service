import type { NextFunction, Request, Response } from 'express'
import http from 'node:http'
import express from 'express'
import { logger } from '../../config/logger'
import router from './router'

const app = express()

app.use(express.json())
app.use(router)

// Global Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as Error & { status?: number, statusCode?: number, code?: number }
  const status = error.status || error.statusCode || 500

  logger.error({ err: error }, 'Unhandled HTTP server error')

  if (error.name === 'MongoServerError' && error.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key error' })
  }

  if (status === 400) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  return res.status(status).json({
    error: 'Internal Server Error',
  })
})

export const server = http.createServer(app)
export { app }

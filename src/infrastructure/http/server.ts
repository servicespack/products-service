import type { NextFunction, Request, Response } from 'express'
import http from 'node:http'
import express from 'express'
import router from './router'

const app = express()

app.use(express.json())
app.use(router)

// Global Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as Error & { status?: number, statusCode?: number, code?: number }

  if (error.name === 'MongoServerError' && error.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key error' })
  }

  return res.status(error.status || error.statusCode || 500).json({
    error: error.message || 'Internal Server Error',
  })
})

export const server = http.createServer(app)
export { app }

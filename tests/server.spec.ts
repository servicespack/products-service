import type { NextFunction, Request, Response } from 'express'
import request from 'supertest'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { logger } from '../src/config/logger'
import { errorHandler, server } from '../src/infrastructure/http/server'

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

  describe('errorHandler', () => {
    const createMockResponse = () => {
      const res: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      }
      return res as Response
    }

    const mockRequest = {} as Request
    const mockNext = vi.fn() as unknown as NextFunction

    it('should return 409 on MongoServerError code 11000 and log error', () => {
      const loggerErrorSpy = vi.spyOn(logger, 'error')
      const res = createMockResponse()
      const error = new Error('duplicate')
      error.name = 'MongoServerError'
      ;(error as any).code = 11000

      errorHandler(error, mockRequest, res, mockNext)

      expect(loggerErrorSpy).toHaveBeenCalledWith({ err: error }, 'Unhandled HTTP server error')
      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate key error' })
    })

    it('should return 500 when MongoServerError code is not 11000', () => {
      const res = createMockResponse()
      const error = new Error('other mongo error')
      error.name = 'MongoServerError'
      ;(error as any).code = 12000

      errorHandler(error, mockRequest, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
    })

    it('should return 500 when code is 11000 but name is not MongoServerError', () => {
      const res = createMockResponse()
      const error = new Error('other error with code 11000')
      error.name = 'OtherError'
      ;(error as any).code = 11000

      errorHandler(error, mockRequest, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
    })

    it('should return 400 on status 400 error', () => {
      const res = createMockResponse()
      const error = new Error('bad request')
      ;(error as any).status = 400

      errorHandler(error, mockRequest, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request body' })
    })

    it('should return 500 on unexpected errors', () => {
      const res = createMockResponse()
      const error = new Error('critical error')

      errorHandler(error, mockRequest, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
    })

    it('should return custom status code when specified', () => {
      const res = createMockResponse()
      const error = new Error('custom status')
      ;(error as any).statusCode = 503

      errorHandler(error, mockRequest, res, mockNext)

      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
    })
  })
})

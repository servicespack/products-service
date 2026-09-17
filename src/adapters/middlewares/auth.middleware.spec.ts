import type { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configuration } from '../../config'
import { type AuthenticatedRequest, authMiddleware } from './auth.middleware'

describe('authMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {},
      query: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    nextFunction = vi.fn() as unknown as NextFunction
  })

  it('should return 401 if no token is provided in header or query', () => {
    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should authenticate successfully with valid Bearer token in header', () => {
    const userId = '123'
    const token = jwt.sign(
      { sub: userId },
      configuration.auth.jwtSecret,
      { issuer: configuration.auth.jwtIssuer, audience: configuration.auth.jwtAudience },
    )
    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockRequest.userId).toBe(userId)
    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('should authenticate successfully with valid token in query param', () => {
    const userId = '456'
    const token = jwt.sign(
      { id: userId },
      configuration.auth.jwtSecret,
      { issuer: configuration.auth.jwtIssuer, audience: configuration.auth.jwtAudience },
    )
    mockRequest.query!.token = token

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockRequest.userId).toBe(userId)
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should return 401 for an invalid token', () => {
    mockRequest.headers!.authorization = 'Bearer invalid-token'

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 401 if token is valid but has no sub or id', () => {
    const token = jwt.sign(
      { name: 'test' },
      configuration.auth.jwtSecret,
      { issuer: configuration.auth.jwtIssuer, audience: configuration.auth.jwtAudience },
    )
    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
    expect(nextFunction).not.toHaveBeenCalled()
  })
})

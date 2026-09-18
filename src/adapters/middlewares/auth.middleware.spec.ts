import type { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    const verifySpy = vi.spyOn(jwt, 'verify')
    const userId = '123'
    const token = jwt.sign(
      { sub: userId },
      configuration.auth.jwtSecret,
      { issuer: configuration.auth.jwtIssuer, audience: configuration.auth.jwtAudience },
    )
    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(verifySpy).toHaveBeenCalledWith(token, configuration.auth.jwtSecret, {
      algorithms: ['HS256'],
      issuer: configuration.auth.jwtIssuer,
      audience: configuration.auth.jwtAudience,
    })
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

  it('should ignore authorization header if scheme is not Bearer', () => {
    mockRequest.headers!.authorization = 'Basic dXNlcjpwYXNz'

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  describe('production environment', () => {
    const originalEnv = configuration.environment

    afterEach(() => {
      configuration.environment = originalEnv
    })

    it('should reject token without expiration in production', () => {
      configuration.environment = 'production'

      const token = jwt.sign(
        { sub: 'user-prod' },
        configuration.auth.jwtSecret,
        { issuer: configuration.auth.jwtIssuer, audience: configuration.auth.jwtAudience },
      )
      mockRequest.headers!.authorization = `Bearer ${token}`

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token missing expiration' })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should accept token with expiration in production', () => {
      configuration.environment = 'production'
      const verifySpy = vi.spyOn(jwt, 'verify')

      const token = jwt.sign(
        { sub: 'user-prod' },
        configuration.auth.jwtSecret,
        {
          issuer: configuration.auth.jwtIssuer,
          audience: configuration.auth.jwtAudience,
          expiresIn: '1h',
        },
      )
      mockRequest.headers!.authorization = `Bearer ${token}`

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

      expect(verifySpy).toHaveBeenCalledWith(token, configuration.auth.jwtSecret, {
        algorithms: ['HS256'],
        issuer: configuration.auth.jwtIssuer,
        audience: configuration.auth.jwtAudience,
        ignoreExpiration: false,
      })
      expect(mockRequest.userId).toBe('user-prod')
      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should reject expired token in production', () => {
      configuration.environment = 'production'

      const token = jwt.sign(
        { sub: 'user-prod' },
        configuration.auth.jwtSecret,
        {
          issuer: configuration.auth.jwtIssuer,
          audience: configuration.auth.jwtAudience,
          expiresIn: -10,
        },
      )
      mockRequest.headers!.authorization = `Bearer ${token}`

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should reject token with wrong issuer or audience', () => {
      const wrongIssuerToken = jwt.sign(
        { sub: 'user-prod' },
        configuration.auth.jwtSecret,
        { issuer: 'wrong-issuer', audience: configuration.auth.jwtAudience, expiresIn: '1h' },
      )
      mockRequest.headers!.authorization = `Bearer ${wrongIssuerToken}`

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
    })
  })
})

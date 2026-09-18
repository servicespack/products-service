import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { configuration } from '../../config'

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization
  const queryToken = req.query.token as string | undefined

  let token = queryToken

  if (authorization) {
    const [scheme, authHeaderToken] = authorization.split(' ')
    if (scheme === 'Bearer' && authHeaderToken) {
      token = authHeaderToken
    }
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  try {
    const options: jwt.VerifyOptions = {
      algorithms: ['HS256'],
      issuer: configuration.auth.jwtIssuer,
      audience: configuration.auth.jwtAudience,
    }

    if (configuration.environment === 'production') {
      options.ignoreExpiration = false
    }

    const decoded = jwt.verify(token, configuration.auth.jwtSecret, options) as { sub?: string, id?: string, exp?: number }

    if (configuration.environment === 'production' && !decoded.exp) {
      res.status(401).json({ error: 'Token missing expiration' })
      return
    }

    const userId = decoded.sub || decoded.id

    if (!userId) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    req.userId = userId
    next()
  }
  catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

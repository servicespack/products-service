import { faker } from '@faker-js/faker'
import jwt from 'jsonwebtoken'
import { configuration } from '../../src/config'

export function generateTestToken(userId?: string): string {
  const sub = userId || faker.string.uuid()
  return jwt.sign({ sub }, configuration.auth.jwtSecret)
}

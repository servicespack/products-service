import process from 'node:process'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should use default values when environment variables are not set', async () => {
    const originalEnv = process.env
    process.env = {}

    const { configuration } = await import('../src/config')

    expect(configuration.environment).toBe('development')
    expect(configuration.database.uri).toBe('mongodb://localhost:27017/products-service')
    expect(configuration.servers.http.port).toBe('3000')
    expect(configuration.auth.jwtSecret).toBe('secret')

    process.env = originalEnv
  })
})

import process from 'node:process'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should use default values when environment variables are not set', async () => {
    const originalEnv = process.env
    process.env = {
      JWT_SECRET: 'secret',
    }

    const { configuration } = await import('../src/config/configuration')

    expect(configuration.environment).toBe('development')
    expect(configuration.database.uri).toBe('mongodb://localhost:27017/products-service')
    expect(configuration.servers.http.port).toBe('3000')
    expect(configuration.auth.jwtSecret).toBe('secret')
    expect(configuration.auth.jwtIssuer).toBe('servicespack')
    expect(configuration.auth.jwtAudience).toBe('servicespack')

    process.env = originalEnv
  })

  it('should read custom environment variables', async () => {
    const originalEnv = process.env
    process.env = {
      NODE_ENV: 'production',
      DATABASE_URI: 'mongodb://custom-host:27017/custom-db',
      HTTP_SERVER_PORT: '8080',
      JWT_SECRET: 'super-secret',
      JWT_ISSUER: 'custom-issuer',
      JWT_AUDIENCE: 'custom-audience',
    }

    const { configuration } = await import('../src/config/configuration')

    expect(configuration.environment).toBe('production')
    expect(configuration.database.uri).toBe('mongodb://custom-host:27017/custom-db')
    expect(configuration.servers.http.port).toBe('8080')
    expect(configuration.auth.jwtSecret).toBe('super-secret')
    expect(configuration.auth.jwtIssuer).toBe('custom-issuer')
    expect(configuration.auth.jwtAudience).toBe('custom-audience')

    process.env = originalEnv
  })

  it('should fallback to SERVER_PORT when HTTP_SERVER_PORT is not provided', async () => {
    const originalEnv = process.env
    process.env = {
      SERVER_PORT: '4000',
      JWT_SECRET: 'secret',
    }

    const { configuration } = await import('../src/config/configuration')

    expect(configuration.servers.http.port).toBe('4000')

    process.env = originalEnv
  })

  it('should accept test environment', async () => {
    const originalEnv = process.env
    process.env = {
      NODE_ENV: 'test',
      JWT_SECRET: 'secret',
    }

    const { configuration } = await import('../src/config/configuration')

    expect(configuration.environment).toBe('test')

    process.env = originalEnv
  })

  it('should throw error when JWT_SECRET is missing or empty', async () => {
    const originalEnv = process.env
    process.env = {}

    await expect(import('../src/config/configuration')).rejects.toThrow()

    vi.resetModules()
    process.env = {
      JWT_SECRET: '',
    }

    await expect(import('../src/config/configuration')).rejects.toThrowError('JWT_SECRET is required')

    process.env = originalEnv
  })

  it('should throw error when NODE_ENV is invalid', async () => {
    const originalEnv = process.env
    process.env = {
      NODE_ENV: 'invalid-env',
      JWT_SECRET: 'secret',
    }

    await expect(import('../src/config/configuration')).rejects.toThrow()

    process.env = originalEnv
  })
})

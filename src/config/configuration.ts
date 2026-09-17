import process from 'node:process'
import z from 'zod'

const configurationSchema = z.object({
  environment: z.enum(['development', 'production', 'test']).default('development'),
  database: z.object({
    uri: z.string().default('mongodb://localhost:27017/products-service'),
  }),
  servers: z.object({
    http: z.object({
      port: z.string().default('3000'),
    }),
  }),
  auth: z.object({
    jwtSecret: z.string().min(1, 'JWT_SECRET is required'),
    jwtIssuer: z.string().default('servicespack'),
    jwtAudience: z.string().default('servicespack'),
  }),
})

export type Configuration = z.infer<typeof configurationSchema>

export const configuration: Configuration = configurationSchema.parse({
  environment: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/products-service',
  },
  servers: {
    http: {
      port: process.env.HTTP_SERVER_PORT || process.env.SERVER_PORT || '3000',
    },
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtIssuer: process.env.JWT_ISSUER || 'servicespack',
    jwtAudience: process.env.JWT_AUDIENCE || 'servicespack',
  },
})

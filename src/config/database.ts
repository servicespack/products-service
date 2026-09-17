import mongoose from 'mongoose'
import { productValidationRules } from '../infrastructure/database/mongoose/models/product.model'
import { reservationValidationRules } from '../infrastructure/database/mongoose/models/reservation.model'
import { stockMovementValidationRules } from '../infrastructure/database/mongoose/models/stock-movement.model'
import { configuration } from './configuration'
import { logger } from './logger'

const { database } = configuration

export async function connectDatabase(): Promise<typeof mongoose> {
  const connection = await mongoose.connect(database.uri)
  logger.info('Connected to the database')

  const { db } = connection.connection

  if (!db) {
    throw new Error('Database connection not established')
  }

  const productCollections = await db.listCollections({ name: 'products' }).toArray()

  if (productCollections.length > 0) {
    await db.command({ collMod: 'products', validator: productValidationRules })
  }
  else {
    await db.createCollection('products', { validator: productValidationRules })
  }

  logger.info('Schema validation applied to products collection')

  const movementCollections = await db.listCollections({ name: 'stockmovements' }).toArray()

  if (movementCollections.length > 0) {
    await db.command({ collMod: 'stockmovements', validator: stockMovementValidationRules })
  }
  else {
    await db.createCollection('stockmovements', { validator: stockMovementValidationRules })
  }

  logger.info('Schema validation applied to stockmovements collection')

  const reservationCollections = await db.listCollections({ name: 'reservations' }).toArray()

  if (reservationCollections.length > 0) {
    await db.command({ collMod: 'reservations', validator: reservationValidationRules })
  }
  else {
    await db.createCollection('reservations', { validator: reservationValidationRules })
  }

  logger.info('Schema validation applied to reservations collection')

  return connection
}

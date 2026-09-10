import type { Document } from 'mongoose'
import mongoose, { Schema } from 'mongoose'

export interface IStockMovementDoc extends Document {
  productId: string
  type: 'INCREMENT' | 'DECREMENT'
  quantity: number
  previousStock: number
  currentStock: number
  reason?: string
  createdAt: Date
}

export const stockMovementSchema = new Schema<IStockMovementDoc>(
  {
    productId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['INCREMENT', 'DECREMENT'] },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    currentStock: { type: Number, required: true },
    reason: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId).toHexString()
        delete ret._id
        delete ret.__v
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId).toHexString()
        delete ret._id
        delete ret.__v
      },
    },
  },
)

stockMovementSchema.index({ productId: 1, createdAt: -1 })

export const StockMovementModel = mongoose.models.StockMovement || mongoose.model<IStockMovementDoc>('StockMovement', stockMovementSchema)

export const stockMovementValidationRules = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['productId', 'type', 'quantity', 'previousStock', 'currentStock'],
    properties: {
      productId: { bsonType: 'string', description: 'must be a string and is required' },
      type: { enum: ['INCREMENT', 'DECREMENT'], description: 'must be INCREMENT or DECREMENT' },
      quantity: { bsonType: 'number', description: 'must be a number and is required' },
      previousStock: { bsonType: 'number', description: 'must be a number and is required' },
      currentStock: { bsonType: 'number', description: 'must be a number and is required' },
      reason: { bsonType: ['string', 'null'] },
      createdAt: { bsonType: 'date' },
    },
  },
}

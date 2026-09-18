import type { Document } from 'mongoose'
import mongoose, { Schema } from 'mongoose'

export interface IReservationDoc extends Document<string> {
  productId: string
  quantity: number
  status: 'ACTIVE' | 'CANCELLED'
  reason?: string
  createdAt: Date
  updatedAt: Date
}

export const reservationSchema = new Schema<IReservationDoc>(
  {
    _id: { type: String, required: true },
    productId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    reason: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as string | object).toString()
        delete ret._id
        delete ret.__v
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as string | object).toString()
        delete ret._id
        delete ret.__v
      },
    },
  },
)

reservationSchema.index({ productId: 1, status: 1 })

export const ReservationModel = mongoose.models.Reservation || mongoose.model<IReservationDoc>('Reservation', reservationSchema)

export const reservationValidationRules = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['_id', 'productId', 'quantity', 'status'],
    properties: {
      _id: { bsonType: 'string', description: 'must be a string and is required' },
      productId: { bsonType: 'string', description: 'must be a string and is required' },
      quantity: { bsonType: 'number', description: 'must be a number and is required' },
      status: { enum: ['ACTIVE', 'CANCELLED'], description: 'must be ACTIVE or CANCELLED' },
      reason: { bsonType: ['string', 'null'] },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
}

import type { Document } from 'mongoose'
import mongoose, { Schema } from 'mongoose'

export interface IProductDoc extends Document {
  name: string
  price: number
  description?: string
  sku?: string
  categories: string[]
  tags: string[]
  active: boolean
  stock: number
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export const productSchema = new Schema<IProductDoc>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, default: null },
    sku: { type: String, default: null },
    categories: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
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

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ categories: 1 })
productSchema.index({ tags: 1 })
productSchema.index({ deletedAt: 1 })

export const ProductModel = mongoose.models.Product || mongoose.model<IProductDoc>('Product', productSchema)

export const productValidationRules = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'price'],
    properties: {
      name: { bsonType: 'string', description: 'must be a string and is required' },
      price: { bsonType: 'number', description: 'must be a number and is required' },
      description: { bsonType: ['string', 'null'] },
      sku: { bsonType: ['string', 'null'] },
      categories: { bsonType: 'array', items: { bsonType: 'string' } },
      tags: { bsonType: 'array', items: { bsonType: 'string' } },
      active: { bsonType: 'bool' },
      stock: { bsonType: 'number' },
      deletedAt: { bsonType: ['date', 'null'] },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
}

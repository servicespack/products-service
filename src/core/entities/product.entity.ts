import { BaseEntity } from './base.entity'

export class ProductEntity extends BaseEntity {
  name: string
  description?: string
  sku: string
  active: boolean
  stock: number
  price: number
}

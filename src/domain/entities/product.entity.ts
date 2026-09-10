import { InsufficientStockError, InvalidStockQuantityError } from '../errors'

export interface ProductProps {
  id?: string
  name: string
  price: number
  description?: string
  sku?: string
  categories?: string[]
  tags?: string[]
  active?: boolean
  stock?: number
  deletedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class Product {
  private readonly _id?: string
  private _name: string
  private _price: number
  private _description?: string
  private _sku?: string
  private _categories: string[]
  private _tags: string[]
  private _active: boolean
  private _stock: number
  private _deletedAt?: Date | null
  private readonly _createdAt?: Date
  private readonly _updatedAt?: Date

  constructor(props: ProductProps) {
    if (props.stock !== undefined && (props.stock < 0 || !Number.isInteger(props.stock))) {
      throw new InvalidStockQuantityError('Stock must be a non-negative integer')
    }

    this._id = props.id
    this._name = props.name
    this._price = props.price
    this._description = props.description
    this._sku = props.sku
    this._categories = props.categories ? [...props.categories] : []
    this._tags = props.tags ? [...props.tags] : []
    this._active = props.active ?? true
    this._stock = props.stock ?? 0
    this._deletedAt = props.deletedAt ?? null
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  get id(): string | undefined {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get price(): number {
    return this._price
  }

  get description(): string | undefined {
    return this._description
  }

  get sku(): string | undefined {
    return this._sku
  }

  get categories(): readonly string[] {
    return this._categories
  }

  get tags(): readonly string[] {
    return this._tags
  }

  get active(): boolean {
    return this._active
  }

  get stock(): number {
    return this._stock
  }

  get deletedAt(): Date | null | undefined {
    return this._deletedAt
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null && this._deletedAt !== undefined
  }

  get createdAt(): Date | undefined {
    return this._createdAt
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt
  }

  softDelete(deletedAt: Date = new Date()): void {
    this._deletedAt = deletedAt
  }

  restore(): void {
    this._deletedAt = null
  }

  decreaseStock(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidStockQuantityError()
    }
    if (this._stock < quantity) {
      throw new InsufficientStockError()
    }
    this._stock -= quantity
  }

  increaseStock(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidStockQuantityError()
    }
    this._stock += quantity
  }

  update(props: {
    name?: string
    price?: number
    description?: string
    sku?: string
    categories?: string[]
    tags?: string[]
    active?: boolean
    stock?: number
  }): void {
    if (props.stock !== undefined && (props.stock < 0 || !Number.isInteger(props.stock))) {
      throw new InvalidStockQuantityError('Stock must be a non-negative integer')
    }
    if (props.name !== undefined) {
      this._name = props.name
    }
    if (props.price !== undefined) {
      this._price = props.price
    }
    if (props.description !== undefined) {
      this._description = props.description
    }
    if (props.sku !== undefined) {
      this._sku = props.sku
    }
    if (props.categories !== undefined) {
      this._categories = [...props.categories]
    }
    if (props.tags !== undefined) {
      this._tags = [...props.tags]
    }
    if (props.active !== undefined) {
      this._active = props.active
    }
    if (props.stock !== undefined) {
      this._stock = props.stock
    }
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      price: this._price,
      description: this._description,
      sku: this._sku,
      categories: this._categories,
      tags: this._tags,
      active: this._active,
      stock: this._stock,
      deletedAt: this._deletedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}

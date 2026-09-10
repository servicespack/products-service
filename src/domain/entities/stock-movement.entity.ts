import { InvalidStockQuantityError } from '../errors'

export type StockMovementType = 'INCREMENT' | 'DECREMENT'

export interface StockMovementProps {
  id?: string
  productId: string
  type: StockMovementType
  quantity: number
  previousStock: number
  currentStock: number
  reason?: string
  createdAt?: Date
}

export class StockMovement {
  private readonly _id?: string
  private readonly _productId: string
  private readonly _type: StockMovementType
  private readonly _quantity: number
  private readonly _previousStock: number
  private readonly _currentStock: number
  private readonly _reason?: string
  private readonly _createdAt?: Date

  constructor(props: StockMovementProps) {
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new InvalidStockQuantityError('Movement quantity must be a positive integer')
    }

    if (!Number.isInteger(props.previousStock) || props.previousStock < 0) {
      throw new InvalidStockQuantityError('Previous stock must be a non-negative integer')
    }

    if (!Number.isInteger(props.currentStock) || props.currentStock < 0) {
      throw new InvalidStockQuantityError('Current stock must be a non-negative integer')
    }

    this._id = props.id
    this._productId = props.productId
    this._type = props.type
    this._quantity = props.quantity
    this._previousStock = props.previousStock
    this._currentStock = props.currentStock
    this._reason = props.reason
    this._createdAt = props.createdAt
  }

  get id(): string | undefined {
    return this._id
  }

  get productId(): string {
    return this._productId
  }

  get type(): StockMovementType {
    return this._type
  }

  get quantity(): number {
    return this._quantity
  }

  get previousStock(): number {
    return this._previousStock
  }

  get currentStock(): number {
    return this._currentStock
  }

  get reason(): string | undefined {
    return this._reason
  }

  get createdAt(): Date | undefined {
    return this._createdAt
  }

  toJSON() {
    return {
      id: this._id,
      productId: this._productId,
      type: this._type,
      quantity: this._quantity,
      previousStock: this._previousStock,
      currentStock: this._currentStock,
      reason: this._reason,
      createdAt: this._createdAt,
    }
  }
}

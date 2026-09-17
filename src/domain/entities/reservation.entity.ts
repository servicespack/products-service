import { InvalidStockQuantityError } from '../errors/invalid-stock-quantity.error'
import { ReservationAlreadyCancelledError } from '../errors/reservation-already-cancelled.error'

export type ReservationStatus = 'ACTIVE' | 'CANCELLED'

export interface ReservationProps {
  id?: string
  productId: string
  quantity: number
  status?: ReservationStatus
  reason?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Reservation {
  private readonly _id?: string
  private readonly _productId: string
  private readonly _quantity: number
  private _status: ReservationStatus
  private readonly _reason?: string
  private readonly _createdAt: Date
  private _updatedAt: Date

  constructor(props: ReservationProps) {
    if (!props.productId || props.productId.trim() === '') {
      throw new Error('Product ID is required')
    }

    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new InvalidStockQuantityError('Reservation quantity must be a positive integer')
    }

    this._id = props.id
    this._productId = props.productId
    this._quantity = props.quantity
    this._status = props.status ?? 'ACTIVE'
    this._reason = props.reason
    this._createdAt = props.createdAt ?? new Date()
    this._updatedAt = props.updatedAt ?? new Date()
  }

  get id(): string | undefined {
    return this._id
  }

  get productId(): string {
    return this._productId
  }

  get quantity(): number {
    return this._quantity
  }

  get status(): ReservationStatus {
    return this._status
  }

  get reason(): string | undefined {
    return this._reason
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  cancel(): void {
    if (this._status === 'CANCELLED') {
      throw new ReservationAlreadyCancelledError()
    }
    this._status = 'CANCELLED'
    this._updatedAt = new Date()
  }

  toJSON() {
    return {
      id: this._id,
      productId: this._productId,
      quantity: this._quantity,
      status: this._status,
      reason: this._reason,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}

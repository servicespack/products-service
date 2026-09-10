import type { IStockMovementDoc } from '../models/stock-movement.model'
import { StockMovement } from '../../../../domain/entities/stock-movement.entity'

export class StockMovementMapper {
  static toDomain(doc: IStockMovementDoc): StockMovement {
    const id = doc.id ? doc.id : (doc._id as string | object).toString()

    return new StockMovement({
      id,
      productId: doc.productId,
      type: doc.type,
      quantity: doc.quantity,
      previousStock: doc.previousStock,
      currentStock: doc.currentStock,
      reason: doc.reason ?? undefined,
      createdAt: doc.createdAt,
    })
  }

  static toPersistence(movement: StockMovement): Record<string, unknown> {
    const persistence: Record<string, unknown> = {
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      currentStock: movement.currentStock,
    }

    if (movement.reason !== undefined) {
      persistence.reason = movement.reason
    }

    if (movement.createdAt !== undefined) {
      persistence.createdAt = movement.createdAt
    }

    return persistence
  }
}

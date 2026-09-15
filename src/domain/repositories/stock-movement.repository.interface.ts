import type { StockMovement } from '../entities/stock-movement.entity'

export interface ListStockMovementsParams {
  productId: string
  page?: number
  pageSize?: number
}

export interface IStockMovementRepository {
  create: (movement: StockMovement) => Promise<StockMovement>
  listByProductId: (params: ListStockMovementsParams) => Promise<Array<StockMovement>>
}

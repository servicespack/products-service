import type { Model } from 'mongoose'
import type { StockMovement } from '../../../../domain/entities/stock-movement.entity'
import type {
  IStockMovementRepository,
  ListStockMovementsParams,
} from '../../../../domain/repositories/stock-movement.repository.interface'
import type { IStockMovementDoc } from '../models/stock-movement.model'
import { StockMovementMapper } from '../mappers/stock-movement.mapper'

export class MongooseStockMovementRepository implements IStockMovementRepository {
  constructor(private readonly model: Model<IStockMovementDoc>) {}

  async create(movement: StockMovement): Promise<StockMovement> {
    const created = await this.model.create(StockMovementMapper.toPersistence(movement))
    return StockMovementMapper.toDomain(created)
  }

  async listByProductId(params: ListStockMovementsParams): Promise<Array<StockMovement>> {
    let queryFind = this.model.find({ productId: params.productId }).sort({ createdAt: -1 })

    if (params.page && params.pageSize) {
      queryFind = queryFind.skip((params.page - 1) * params.pageSize).limit(params.pageSize)
    }
    else if (params.pageSize) {
      queryFind = queryFind.limit(params.pageSize)
    }

    const docs = await queryFind
    return docs.map(doc => StockMovementMapper.toDomain(doc))
  }
}

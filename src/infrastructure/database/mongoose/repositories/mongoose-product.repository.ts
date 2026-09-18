import type { Model } from 'mongoose'
import type { Product } from '../../../../domain/entities/product.entity'
import type {
  CatalogSummary,
  IProductRepository,
  ListProductsParams,
} from '../../../../domain/repositories/product.repository.interface'
import type { IProductDoc } from '../models/product.model'
import mongoose from 'mongoose'
import { ProductMapper } from '../mappers/product.mapper'
import { transactionStorage } from '../transaction.context'

export class MongooseProductRepository implements IProductRepository {
  constructor(private readonly model: Model<IProductDoc>) {}

  async create(product: Product): Promise<Product> {
    const created = await this.model.create(ProductMapper.toPersistence(product))
    return ProductMapper.toDomain(created)
  }

  async findById(id: string, includeDeleted = false): Promise<Product | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const query: Record<string, unknown> = { _id: id }
    if (!includeDeleted) {
      query.deletedAt = null
    }

    const doc = await this.model.findOne(query)
    return doc ? ProductMapper.toDomain(doc) : null
  }

  async update(product: Product): Promise<Product> {
    if (!product.id || !mongoose.isValidObjectId(product.id)) {
      throw new Error('Invalid product ID')
    }

    const doc = await this.model.findOneAndUpdate(
      { _id: product.id, deletedAt: null },
      ProductMapper.toPersistence(product),
      { new: true },
    )

    if (!doc) {
      throw new Error('Product not found')
    }

    return ProductMapper.toDomain(doc)
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) {
      return false
    }

    const result = await this.model.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
    )
    return result !== null
  }

  async restore(id: string): Promise<Product | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const doc = await this.model.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true },
    )

    return doc ? ProductMapper.toDomain(doc) : null
  }

  async list(params?: ListProductsParams): Promise<Array<Product>> {
    const query: Record<string, unknown> = {}

    if (params?.onlyDeleted) {
      query.deletedAt = { $ne: null }
    }
    else if (!params?.includeDeleted) {
      query.deletedAt = null
    }

    if (params?.search) {
      const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.name = { $regex: escapeRegExp(params.search), $options: 'i' }
    }

    if (params?.sku) {
      query.sku = params.sku
    }

    if (params?.category) {
      query.categories = params.category
    }

    if (params?.tag) {
      query.tags = params.tag
    }

    if (params?.active !== undefined) {
      query.active = params.active
    }

    if (params?.minPrice !== undefined || params?.maxPrice !== undefined) {
      const priceQuery: Record<string, number> = {}
      if (params.minPrice !== undefined) {
        priceQuery.$gte = params.minPrice
      }
      if (params.maxPrice !== undefined) {
        priceQuery.$lte = params.maxPrice
      }
      query.price = priceQuery
    }

    let queryFind = this.model.find(query).sort({ _id: 1 })

    if (params?.page && params?.pageSize) {
      queryFind = queryFind.skip((params.page - 1) * params.pageSize).limit(params.pageSize)
    }
    else if (params?.pageSize) {
      queryFind = queryFind.limit(params.pageSize)
    }

    const docs = await queryFind
    return docs.map(doc => ProductMapper.toDomain(doc))
  }

  async decrementStock(id: string, quantity: number): Promise<Product | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const session = transactionStorage.getStore()
    const doc = await this.model.findOneAndUpdate(
      { _id: id, deletedAt: null, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, session },
    )

    return doc ? ProductMapper.toDomain(doc) : null
  }

  async incrementStock(id: string, quantity: number): Promise<Product | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null
    }

    const session = transactionStorage.getStore()
    const doc = await this.model.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $inc: { stock: quantity } },
      { new: true, session },
    )

    return doc ? ProductMapper.toDomain(doc) : null
  }

  async getCatalogSummary(): Promise<CatalogSummary> {
    const [result] = await this.model.aggregate([
      { $match: { deletedAt: null, active: true } },
      {
        $facet: {
          priceStats: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                avgPrice: { $avg: '$price' },
              },
            },
          ],
          categories: [
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
          ],
        },
      },
    ])

    const stats = result?.priceStats?.[0]
    const categories: Record<string, number> = {}

    if (result?.categories) {
      for (const item of result.categories) {
        if (item._id) {
          categories[item._id] = item.count
        }
      }
    }

    return {
      totalProducts: stats?.totalProducts ?? 0,
      categories,
      priceRange: {
        min: stats?.minPrice ?? 0,
        max: stats?.maxPrice ?? 0,
        average: stats?.avgPrice ?? 0,
      },
    }
  }

  async getLowStock(threshold = 5): Promise<Array<Product>> {
    const docs = await this.model.find({
      deletedAt: null,
      active: true,
      stock: { $lte: threshold },
    })

    return docs.map(doc => ProductMapper.toDomain(doc))
  }
}

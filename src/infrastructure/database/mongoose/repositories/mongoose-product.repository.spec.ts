import type { Model } from 'mongoose'
import type { IProductDoc } from '../models/product.model'
import mongoose from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Product } from '../../../../domain/entities/product.entity'
import { MongooseProductRepository } from './mongoose-product.repository'

describe(MongooseProductRepository.name, () => {
  let repository: MongooseProductRepository
  let mockModel: Partial<Model<IProductDoc>>

  beforeEach(() => {
    mockModel = {
      create: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      findOneAndUpdate: vi.fn(),
      aggregate: vi.fn(),
    }
    repository = new MongooseProductRepository(mockModel as Model<IProductDoc>)
  })

  describe('create', () => {
    it('should create and return domain product', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Keyboard',
        price: 99.99,
        description: 'Mechanical keyboard',
        sku: 'KB-001',
        categories: ['Hardware'],
        tags: ['rgb'],
        active: true,
        stock: 15,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockModel.create as any).mockResolvedValueOnce(mockDoc)

      const productToCreate = new Product({
        name: 'Keyboard',
        price: 99.99,
        description: 'Mechanical keyboard',
        sku: 'KB-001',
        categories: ['Hardware'],
        tags: ['rgb'],
        active: true,
        stock: 15,
      })

      const result = await repository.create(productToCreate)

      expect(mockModel.create).toHaveBeenCalledWith({
        name: 'Keyboard',
        price: 99.99,
        description: 'Mechanical keyboard',
        sku: 'KB-001',
        categories: ['Hardware'],
        tags: ['rgb'],
        active: true,
        stock: 15,
        deletedAt: null,
      })
      expect(result).toBeInstanceOf(Product)
      expect(result.id).toBe(mockId.toHexString())
      expect(result.name).toBe('Keyboard')
      expect(result.price).toBe(99.99)
      expect(result.categories).toEqual(['Hardware'])
      expect(result.tags).toEqual(['rgb'])
    })
  })

  describe('findById', () => {
    it('should return null when id is not a valid ObjectId', async () => {
      const result = await repository.findById('invalid-id')

      expect(result).toBeNull()
      expect(mockModel.findOne).not.toHaveBeenCalled()
    })

    it('should return null when document is not found', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      vi.mocked(mockModel.findOne as any).mockResolvedValueOnce(null)

      const result = await repository.findById(validId)

      expect(result).toBeNull()
      expect(mockModel.findOne).toHaveBeenCalledWith({ _id: validId, deletedAt: null })
    })

    it('should return domain product when document is found', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Monitor',
        price: 299.99,
        description: '4K Display',
        sku: 'MON-001',
        categories: ['Screens'],
        tags: ['4k'],
        active: true,
        stock: 5,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(mockModel.findOne as any).mockResolvedValueOnce(mockDoc)

      const result = await repository.findById(mockId.toHexString())

      expect(result).toBeInstanceOf(Product)
      expect(result?.id).toBe(mockId.toHexString())
      expect(result?.name).toBe('Monitor')
      expect(result?.price).toBe(299.99)
    })

    it('should find soft-deleted product when includeDeleted is true', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Monitor',
        price: 299.99,
        active: true,
        stock: 5,
        deletedAt: new Date(),
      }
      vi.mocked(mockModel.findOne as any).mockResolvedValueOnce(mockDoc)

      const result = await repository.findById(mockId.toHexString(), true)

      expect(mockModel.findOne).toHaveBeenCalledWith({ _id: mockId.toHexString() })
      expect(result?.isDeleted).toBe(true)
    })
  })

  describe('update', () => {
    it('should throw error when id is invalid', async () => {
      const product = new Product({ id: 'invalid-id', name: 'Product', price: 10 })

      await expect(repository.update(product)).rejects.toThrow('Invalid product ID')
      expect(mockModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should throw error when document is not found', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      const product = new Product({ id: validId, name: 'Product', price: 10 })

      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(null)

      await expect(repository.update(product)).rejects.toThrow('Product not found')
      expect(mockModel.findOneAndUpdate).toHaveBeenCalled()
    })

    it('should update and return domain product', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Updated Monitor',
        price: 349.99,
        categories: ['Electronics'],
        tags: ['new'],
        active: true,
        stock: 8,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(mockDoc)

      const product = new Product({
        id: mockId.toHexString(),
        name: 'Updated Monitor',
        price: 349.99,
        categories: ['Electronics'],
        tags: ['new'],
        active: true,
        stock: 8,
      })

      const result = await repository.update(product)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toHexString(), deletedAt: null },
        {
          name: 'Updated Monitor',
          price: 349.99,
          categories: ['Electronics'],
          tags: ['new'],
          active: true,
          stock: 8,
          deletedAt: null,
        },
        { new: true },
      )
      expect(result).toBeInstanceOf(Product)
      expect(result.id).toBe(mockId.toHexString())
      expect(result.name).toBe('Updated Monitor')
    })
  })

  describe('delete', () => {
    it('should return false when id is not a valid ObjectId', async () => {
      const result = await repository.delete('invalid-id')

      expect(result).toBe(false)
      expect(mockModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should return false when document is not found or already deleted', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(null)

      const result = await repository.delete(validId)

      expect(result).toBe(false)
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId, deletedAt: null },
        { deletedAt: expect.any(Date) },
      )
    })

    it('should return true when document is soft deleted', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce({ _id: validId })

      const result = await repository.delete(validId)

      expect(result).toBe(true)
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId, deletedAt: null },
        { deletedAt: expect.any(Date) },
      )
    })
  })

  describe('restore', () => {
    it('should return null when id is invalid ObjectId', async () => {
      const result = await repository.restore('invalid-id')
      expect(result).toBeNull()
      expect(mockModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should return null when document is not deleted or not found', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(null)

      const result = await repository.restore(validId)

      expect(result).toBeNull()
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true },
      )
    })

    it('should restore and return domain product', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Restored Product',
        price: 50,
        active: true,
        stock: 10,
        deletedAt: null,
      }
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(mockDoc)

      const result = await repository.restore(mockId.toHexString())

      expect(result).toBeInstanceOf(Product)
      expect(result?.deletedAt).toBeNull()
      expect(result?.isDeleted).toBe(false)
    })
  })

  describe('list', () => {
    it('should query active non-deleted products when params are empty', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Mouse',
        price: 49.99,
        active: true,
        stock: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([mockDoc])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      const result = await repository.list()

      expect(mockModel.find).toHaveBeenCalledWith({ deletedAt: null })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockId.toHexString())
      expect(result[0].name).toBe('Mouse')
    })

    it('should apply all filters including category and tag and pagination', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      await repository.list({
        search: 'gadget',
        sku: 'SKU-100',
        category: 'Tech',
        tag: 'featured',
        active: true,
        minPrice: 50,
        maxPrice: 200,
        page: 2,
        pageSize: 5,
      })

      expect(mockModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        name: { $regex: 'gadget', $options: 'i' },
        sku: 'SKU-100',
        categories: 'Tech',
        tags: 'featured',
        active: true,
        price: {
          $gte: 50,
          $lte: 200,
        },
      })
      expect(mockQuery.skip).toHaveBeenCalledWith(5)
      expect(mockQuery.limit).toHaveBeenCalledWith(5)
    })

    it('should query only deleted products when onlyDeleted is true', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      await repository.list({ onlyDeleted: true })

      expect(mockModel.find).toHaveBeenCalledWith({
        deletedAt: { $ne: null },
      })
    })

    it('should not filter by deletedAt when includeDeleted is true', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      await repository.list({ includeDeleted: true })

      expect(mockModel.find).toHaveBeenCalledWith({})
    })

    it('should filter by minPrice only', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      await repository.list({ minPrice: 20 })

      expect(mockModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        price: { $gte: 20 },
      })
    })

    it('should filter by maxPrice only', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      await repository.list({ maxPrice: 100 })

      expect(mockModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        price: { $lte: 100 },
      })
    })

    it('should apply limit without skip when only pageSize is provided', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      }
      vi.mocked(mockModel.find as any).mockReturnValueOnce(mockQuery)

      await repository.list({ pageSize: 15 })

      expect(mockQuery.limit).toHaveBeenCalledWith(15)
      expect(mockQuery.skip).not.toHaveBeenCalled()
    })
  })

  describe('decrementStock', () => {
    it('should return null when id is invalid ObjectId', async () => {
      const result = await repository.decrementStock('invalid-id', 2)
      expect(result).toBeNull()
      expect(mockModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should return null when document is not found or has insufficient stock', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(null)

      const result = await repository.decrementStock(validId, 5)

      expect(result).toBeNull()
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId, deletedAt: null, stock: { $gte: 5 } },
        { $inc: { stock: -5 } },
        { new: true },
      )
    })

    it('should atomically decrement stock and return updated product', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Phone',
        price: 999.99,
        stock: 3,
        active: true,
      }
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(mockDoc)

      const result = await repository.decrementStock(mockId.toHexString(), 2)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toHexString(), deletedAt: null, stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        { new: true },
      )
      expect(result).toBeInstanceOf(Product)
      expect(result?.stock).toBe(3)
    })
  })

  describe('incrementStock', () => {
    it('should return null when id is invalid ObjectId', async () => {
      const result = await repository.incrementStock('invalid-id', 5)
      expect(result).toBeNull()
      expect(mockModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should return null when document is not found', async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(null)

      const result = await repository.incrementStock(validId, 5)

      expect(result).toBeNull()
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId, deletedAt: null },
        { $inc: { stock: 5 } },
        { new: true },
      )
    })

    it('should atomically increment stock and return updated product', async () => {
      const mockId = new mongoose.Types.ObjectId()
      const mockDoc = {
        _id: mockId,
        id: mockId.toHexString(),
        name: 'Phone',
        price: 999.99,
        stock: 15,
        active: true,
      }
      vi.mocked(mockModel.findOneAndUpdate as any).mockResolvedValueOnce(mockDoc)

      const result = await repository.incrementStock(mockId.toHexString(), 5)

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toHexString(), deletedAt: null },
        { $inc: { stock: 5 } },
        { new: true },
      )
      expect(result).toBeInstanceOf(Product)
      expect(result?.stock).toBe(15)
    })
  })

  describe('getCatalogSummary', () => {
    it('should aggregate catalog summary', async () => {
      const mockResult = [{
        priceStats: [{
          totalProducts: 5,
          minPrice: 10,
          maxPrice: 100,
          avgPrice: 50,
        }],
        categories: [
          { _id: 'Electronics', count: 3 },
          { _id: 'Books', count: 2 },
          { _id: null, count: 1 },
        ],
      }]
      vi.mocked(mockModel.aggregate as any).mockResolvedValueOnce(mockResult as any)

      const result = await repository.getCatalogSummary()

      expect(mockModel.aggregate).toHaveBeenCalledWith([
        { $match: { deletedAt: null, active: true } },
        expect.objectContaining({ $facet: expect.any(Object) }),
      ])
      expect(result).toEqual({
        totalProducts: 5,
        categories: { Electronics: 3, Books: 2 },
        priceRange: {
          min: 10,
          max: 100,
          average: 50,
        },
      })
    })

    it('should handle empty result gracefully', async () => {
      vi.mocked(mockModel.aggregate as any).mockResolvedValueOnce([] as any)

      const result = await repository.getCatalogSummary()

      expect(result).toEqual({
        totalProducts: 0,
        categories: {},
        priceRange: {
          min: 0,
          max: 0,
          average: 0,
        },
      })
    })
  })

  describe('getLowStock', () => {
    it('should find active products with stock <= threshold', async () => {
      const mockDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Item',
        price: 10,
        stock: 3,
        active: true,
      }
      vi.mocked(mockModel.find as any).mockResolvedValueOnce([mockDoc] as any)

      const result = await repository.getLowStock(5)

      expect(mockModel.find).toHaveBeenCalledWith({
        deletedAt: null,
        active: true,
        stock: { $lte: 5 },
      })
      expect(result).toHaveLength(1)
      expect(result[0].stock).toBe(3)
    })
  })
})

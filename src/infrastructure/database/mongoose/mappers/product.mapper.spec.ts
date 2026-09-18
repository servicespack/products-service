import type { IProductDoc } from '../models/product.model'
import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { Product } from '../../../../domain/entities/product.entity'
import { ProductMapper } from './product.mapper'

describe('productMapper', () => {
  describe('toDomain', () => {
    it('should map from mongoose doc to domain entity using doc.id', () => {
      const createdAt = new Date('2026-01-01')
      const updatedAt = new Date('2026-01-02')

      const doc = {
        id: 'prod-123',
        name: 'Keyboard',
        price: 99.99,
        description: 'Mechanical keyboard',
        sku: 'KB-01',
        categories: ['Hardware'],
        tags: ['rgb'],
        active: true,
        stock: 10,
        deletedAt: null,
        createdAt,
        updatedAt,
      } as unknown as IProductDoc

      const product = ProductMapper.toDomain(doc)

      expect(product.id).toBe('prod-123')
      expect(product.name).toBe('Keyboard')
      expect(product.price).toBe(99.99)
      expect(product.description).toBe('Mechanical keyboard')
      expect(product.sku).toBe('KB-01')
      expect(product.categories).toEqual(['Hardware'])
      expect(product.tags).toEqual(['rgb'])
      expect(product.active).toBe(true)
      expect(product.stock).toBe(10)
      expect(product.deletedAt).toBeNull()
      expect(product.createdAt).toEqual(createdAt)
      expect(product.updatedAt).toEqual(updatedAt)
    })

    it('should map from mongoose doc using _id when id is absent and default null/undefined fields', () => {
      const mockId = new mongoose.Types.ObjectId()
      const doc = {
        _id: mockId,
        name: 'Simple Product',
        price: 19.99,
        description: null,
        sku: null,
        categories: null,
        tags: null,
        active: false,
        stock: 0,
        deletedAt: null,
      } as unknown as IProductDoc

      const product = ProductMapper.toDomain(doc)

      expect(product.id).toBe(mockId.toHexString())
      expect(product.description).toBeUndefined()
      expect(product.sku).toBeUndefined()
      expect(product.categories).toEqual([])
      expect(product.tags).toEqual([])
      expect(product.deletedAt).toBeNull()
    })
  })

  describe('toPersistence', () => {
    it('should map from domain entity to persistence object including description and sku', () => {
      const deletedAt = new Date('2026-02-01')
      const product = new Product({
        id: 'prod-1',
        name: 'Laptop',
        price: 1200,
        description: 'Gaming Laptop',
        sku: 'LAP-01',
        categories: ['Computers'],
        tags: ['gaming'],
        active: true,
        stock: 5,
        deletedAt,
      })

      const persistence = ProductMapper.toPersistence(product)

      expect(persistence).toEqual({
        name: 'Laptop',
        price: 1200,
        categories: ['Computers'],
        tags: ['gaming'],
        active: true,
        stock: 5,
        deletedAt,
        description: 'Gaming Laptop',
        sku: 'LAP-01',
      })
    })

    it('should omit description and sku when undefined in domain entity', () => {
      const product = {
        name: 'Basic Item',
        price: 10,
        categories: [],
        tags: [],
        active: true,
        stock: 0,
        deletedAt: null,
        description: undefined,
        sku: undefined,
      } as unknown as Product

      const persistence = ProductMapper.toPersistence(product)

      expect(persistence).toEqual({
        name: 'Basic Item',
        price: 10,
        categories: [],
        tags: [],
        active: true,
        stock: 0,
        deletedAt: null,
      })
      expect('description' in persistence).toBe(false)
      expect('sku' in persistence).toBe(false)
    })
  })
})

import type { IStockMovementDoc } from '../models/stock-movement.model'
import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { StockMovement } from '../../../../domain/entities/stock-movement.entity'
import { StockMovementMapper } from './stock-movement.mapper'

describe('stockMovementMapper', () => {
  describe('toDomain', () => {
    it('should map from mongoose doc to domain entity using doc.id', () => {
      const createdAt = new Date('2026-01-01')
      const doc = {
        id: 'mov-1',
        productId: 'prod-1',
        type: 'INCREMENT' as const,
        quantity: 5,
        previousStock: 10,
        currentStock: 15,
        reason: 'Restock',
        createdAt,
      } as unknown as IStockMovementDoc

      const movement = StockMovementMapper.toDomain(doc)

      expect(movement.id).toBe('mov-1')
      expect(movement.productId).toBe('prod-1')
      expect(movement.type).toBe('INCREMENT')
      expect(movement.quantity).toBe(5)
      expect(movement.previousStock).toBe(10)
      expect(movement.currentStock).toBe(15)
      expect(movement.reason).toBe('Restock')
      expect(movement.createdAt).toEqual(createdAt)
    })

    it('should map from mongoose doc using _id when id is absent and default reason null', () => {
      const mockId = new mongoose.Types.ObjectId()
      const doc = {
        _id: mockId,
        productId: 'prod-2',
        type: 'DECREMENT' as const,
        quantity: 3,
        previousStock: 5,
        currentStock: 2,
        reason: null,
      } as unknown as IStockMovementDoc

      const movement = StockMovementMapper.toDomain(doc)

      expect(movement.id).toBe(mockId.toHexString())
      expect(movement.reason).toBeUndefined()
    })
  })

  describe('toPersistence', () => {
    it('should map from domain entity to persistence object including reason and createdAt', () => {
      const createdAt = new Date('2026-01-01')
      const movement = new StockMovement({
        id: 'mov-1',
        productId: 'prod-1',
        type: 'INCREMENT',
        quantity: 5,
        previousStock: 0,
        currentStock: 5,
        reason: 'Initial stock',
        createdAt,
      })

      const persistence = StockMovementMapper.toPersistence(movement)

      expect(persistence).toEqual({
        productId: 'prod-1',
        type: 'INCREMENT',
        quantity: 5,
        previousStock: 0,
        currentStock: 5,
        reason: 'Initial stock',
        createdAt,
      })
      expect('reason' in persistence).toBe(true)
      expect('createdAt' in persistence).toBe(true)
    })

    it('should omit reason and createdAt when undefined in domain entity', () => {
      const movement = {
        productId: 'prod-1',
        type: 'INCREMENT' as const,
        quantity: 5,
        previousStock: 0,
        currentStock: 5,
        reason: undefined,
        createdAt: undefined,
      } as unknown as StockMovement

      const persistence = StockMovementMapper.toPersistence(movement)

      expect(persistence).toEqual({
        productId: 'prod-1',
        type: 'INCREMENT',
        quantity: 5,
        previousStock: 0,
        currentStock: 5,
      })
      expect('reason' in persistence).toBe(false)
      expect('createdAt' in persistence).toBe(false)
    })
  })
})

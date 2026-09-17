import { describe, expect, it } from 'vitest'
import { InvalidStockQuantityError } from '../errors'
import { StockMovement } from './stock-movement.entity'

describe('stockMovement Entity', () => {
  it('should instantiate a stock movement with valid properties', () => {
    const createdAt = new Date('2026-01-01')
    const movement = new StockMovement({
      id: 'mov-123',
      productId: 'prod-123',
      type: 'DECREMENT',
      quantity: 5,
      previousStock: 10,
      currentStock: 5,
      reason: 'Order #456',
      createdAt,
    })

    expect(movement.id).toBe('mov-123')
    expect(movement.productId).toBe('prod-123')
    expect(movement.type).toBe('DECREMENT')
    expect(movement.quantity).toBe(5)
    expect(movement.previousStock).toBe(10)
    expect(movement.currentStock).toBe(5)
    expect(movement.reason).toBe('Order #456')
    expect(movement.createdAt).toEqual(createdAt)
  })

  it('should throw error when quantity is non-positive or non-integer', () => {
    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 0,
      previousStock: 5,
      currentStock: 5,
    })).toThrow(InvalidStockQuantityError)

    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: -2,
      previousStock: 5,
      currentStock: 3,
    })).toThrow(InvalidStockQuantityError)

    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 1.5,
      previousStock: 5,
      currentStock: 6,
    })).toThrow(InvalidStockQuantityError)
  })

  it('should throw error when previousStock or currentStock is negative or non-integer', () => {
    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 2,
      previousStock: -1,
      currentStock: 1,
    })).toThrow(InvalidStockQuantityError)

    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 2,
      previousStock: 5,
      currentStock: -1,
    })).toThrow(InvalidStockQuantityError)
  })

  it('should throw error when currentStock does not match calculation', () => {
    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 5,
      previousStock: 10,
      currentStock: 10,
    })).toThrow(InvalidStockQuantityError)

    expect(() => new StockMovement({
      productId: 'prod-1',
      type: 'DECREMENT',
      quantity: 5,
      previousStock: 10,
      currentStock: 10,
    })).toThrow(InvalidStockQuantityError)
  })

  it('should serialize to JSON correctly', () => {
    const createdAt = new Date('2026-01-01')
    const movement = new StockMovement({
      id: 'mov-1',
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 10,
      previousStock: 0,
      currentStock: 10,
      createdAt,
    })

    expect(movement.toJSON()).toEqual({
      id: 'mov-1',
      productId: 'prod-1',
      type: 'INCREMENT',
      quantity: 10,
      previousStock: 0,
      currentStock: 10,
      reason: undefined,
      createdAt,
    })
  })
})

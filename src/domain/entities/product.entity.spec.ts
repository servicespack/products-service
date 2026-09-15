import { describe, expect, it } from 'vitest'
import { InsufficientStockError, InvalidStockQuantityError } from '../errors'
import { Product } from './product.entity'

describe('product Entity', () => {
  it('should instantiate a product with provided properties', () => {
    const createdAt = new Date('2023-01-01')
    const updatedAt = new Date('2023-01-02')

    const product = new Product({
      id: 'prod-123',
      name: 'Notebook',
      price: 2500,
      description: 'Gamer notebook',
      sku: 'NOTE-01',
      categories: ['Computers', 'Electronics'],
      tags: ['gaming', 'laptop'],
      active: true,
      stock: 10,
      createdAt,
      updatedAt,
    })

    expect(product.id).toBe('prod-123')
    expect(product.name).toBe('Notebook')
    expect(product.price).toBe(2500)
    expect(product.description).toBe('Gamer notebook')
    expect(product.sku).toBe('NOTE-01')
    expect(product.categories).toEqual(['Computers', 'Electronics'])
    expect(product.tags).toEqual(['gaming', 'laptop'])
    expect(product.active).toBe(true)
    expect(product.stock).toBe(10)
    expect(product.deletedAt).toBeNull()
    expect(product.isDeleted).toBe(false)
    expect(product.createdAt).toEqual(createdAt)
    expect(product.updatedAt).toEqual(updatedAt)
  })

  it('should throw error when initial stock is negative or non-integer', () => {
    expect(() => new Product({ name: 'Item', price: 10, stock: -1 })).toThrow(InvalidStockQuantityError)
    expect(() => new Product({ name: 'Item', price: 10, stock: 1.5 })).toThrow(InvalidStockQuantityError)
  })

  it('should assign default values for active, stock, categories, and tags', () => {
    const product = new Product({
      name: 'Mouse',
      price: 50,
    })

    expect(product.active).toBe(true)
    expect(product.stock).toBe(0)
    expect(product.categories).toEqual([])
    expect(product.tags).toEqual([])
    expect(product.deletedAt).toBeNull()
    expect(product.isDeleted).toBe(false)
    expect(product.id).toBeUndefined()
  })

  it('should decrease stock when quantity is valid and available', () => {
    const product = new Product({
      name: 'Headphones',
      price: 150,
      stock: 10,
    })

    product.decreaseStock(4)
    expect(product.stock).toBe(6)
  })

  it('should throw InsufficientStockError when decreasing more than available stock', () => {
    const product = new Product({
      name: 'Headphones',
      price: 150,
      stock: 2,
    })

    expect(() => product.decreaseStock(3)).toThrow(InsufficientStockError)
  })

  it('should throw InvalidStockQuantityError on invalid decrease quantities', () => {
    const product = new Product({
      name: 'Headphones',
      price: 150,
      stock: 5,
    })

    expect(() => product.decreaseStock(0)).toThrow(InvalidStockQuantityError)
    expect(() => product.decreaseStock(-2)).toThrow(InvalidStockQuantityError)
    expect(() => product.decreaseStock(1.5)).toThrow(InvalidStockQuantityError)
  })

  it('should increase stock when quantity is valid', () => {
    const product = new Product({
      name: 'Headphones',
      price: 150,
      stock: 5,
    })

    product.increaseStock(10)
    expect(product.stock).toBe(15)
  })

  it('should throw InvalidStockQuantityError on invalid increase quantities', () => {
    const product = new Product({
      name: 'Headphones',
      price: 150,
      stock: 5,
    })

    expect(() => product.increaseStock(0)).toThrow(InvalidStockQuantityError)
    expect(() => product.increaseStock(-3)).toThrow(InvalidStockQuantityError)
    expect(() => product.increaseStock(2.2)).toThrow(InvalidStockQuantityError)
  })

  it('should update product properties', () => {
    const product = new Product({
      name: 'Keyboard',
      price: 100,
    })

    product.update({
      name: 'Mechanical Keyboard',
      price: 150,
      description: 'RGB Keyboard',
      sku: 'KB-02',
      categories: ['Accessories', 'Peripherals'],
      tags: ['rgb', 'mechanical'],
      active: false,
      stock: 5,
    })

    expect(product.name).toBe('Mechanical Keyboard')
    expect(product.price).toBe(150)
    expect(product.description).toBe('RGB Keyboard')
    expect(product.sku).toBe('KB-02')
    expect(product.categories).toEqual(['Accessories', 'Peripherals'])
    expect(product.tags).toEqual(['rgb', 'mechanical'])
    expect(product.active).toBe(false)
    expect(product.stock).toBe(5)
  })

  it('should support soft delete and restore', () => {
    const product = new Product({
      name: 'Keyboard',
      price: 100,
    })

    const deletedDate = new Date('2026-03-01')
    product.softDelete(deletedDate)
    expect(product.deletedAt).toEqual(deletedDate)
    expect(product.isDeleted).toBe(true)

    product.restore()
    expect(product.deletedAt).toBeNull()
    expect(product.isDeleted).toBe(false)
  })

  it('should throw error when updating stock with invalid values', () => {
    const product = new Product({ name: 'Keyboard', price: 100 })
    expect(() => product.update({ stock: -5 })).toThrow(InvalidStockQuantityError)
    expect(() => product.update({ stock: 2.5 })).toThrow(InvalidStockQuantityError)
  })

  it('should serialize to JSON correctly', () => {
    const product = new Product({
      id: 'prod-456',
      name: 'Monitor',
      price: 800,
      description: '27 inch',
      sku: 'MON-27',
      categories: ['Screens'],
      tags: ['4k', 'ips'],
      active: true,
      stock: 7,
    })

    expect(product.toJSON()).toEqual({
      id: 'prod-456',
      name: 'Monitor',
      price: 800,
      description: '27 inch',
      sku: 'MON-27',
      categories: ['Screens'],
      tags: ['4k', 'ips'],
      active: true,
      stock: 7,
      deletedAt: null,
      createdAt: undefined,
      updatedAt: undefined,
    })
  })
})

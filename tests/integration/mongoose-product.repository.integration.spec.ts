import mongoose from 'mongoose'
import { beforeEach, describe, expect, it } from 'vitest'
import { Product } from '../../src/domain/entities/product.entity'
import { ProductModel } from '../../src/infrastructure/database/mongoose/models/product.model'
import { MongooseProductRepository } from '../../src/infrastructure/database/mongoose/repositories/mongoose-product.repository'

describe('mongooseProductRepository (In-Memory MongoDB Integration)', () => {
  let repository: MongooseProductRepository

  beforeEach(async () => {
    await ProductModel.deleteMany({})
    repository = new MongooseProductRepository(ProductModel)
  })

  it('should create and retrieve product by id with all fields in real in-memory MongoDB', async () => {
    const product = new Product({
      name: 'Integration Product',
      price: 199.99,
      description: 'An integrated product test',
      sku: 'INT-001',
      stock: 25,
      active: true,
    })

    const created = await repository.create(product)

    expect(created.id).toBeDefined()
    expect(created.name).toBe('Integration Product')
    expect(created.price).toBe(199.99)
    expect(created.description).toBe('An integrated product test')
    expect(created.sku).toBe('INT-001')
    expect(created.stock).toBe(25)
    expect(created.active).toBe(true)
    expect(created.createdAt).toBeInstanceOf(Date)
    expect(created.updatedAt).toBeInstanceOf(Date)

    const byId = await repository.findById(created.id!)
    expect(byId).not.toBeNull()
    expect(byId?.id).toBe(created.id)
    expect(byId?.name).toBe('Integration Product')
    expect(byId?.price).toBe(199.99)
    expect(byId?.description).toBe('An integrated product test')
    expect(byId?.sku).toBe('INT-001')
    expect(byId?.stock).toBe(25)
    expect(byId?.active).toBe(true)
  })

  it('should create and retrieve product with default fields in real in-memory MongoDB', async () => {
    const product = new Product({
      name: 'Minimal Product',
      price: 49.99,
    })

    const created = await repository.create(product)

    expect(created.id).toBeDefined()
    expect(created.name).toBe('Minimal Product')
    expect(created.price).toBe(49.99)
    expect(created.active).toBe(true)
    expect(created.stock).toBe(0)

    const byId = await repository.findById(created.id!)
    expect(byId).not.toBeNull()
    expect(byId?.active).toBe(true)
    expect(byId?.stock).toBe(0)
  })

  it('should return null when searching for non-existent valid ObjectId', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toHexString()
    const result = await repository.findById(nonExistentId)
    expect(result).toBeNull()
  })

  it('should return null when searching for invalid ObjectId string', async () => {
    const result = await repository.findById('invalid-non-hex-id')
    expect(result).toBeNull()
  })

  it('should update an existing product in real MongoDB', async () => {
    const product = await repository.create(new Product({
      name: 'Old Name',
      price: 100,
      description: 'Old Description',
      sku: 'OLD-SKU',
      stock: 5,
      active: true,
    }))

    product.update({
      name: 'New Name',
      price: 120,
      description: 'New Description',
      sku: 'NEW-SKU',
      active: false,
    })

    const updated = await repository.update(product)

    expect(updated.id).toBe(product.id)
    expect(updated.name).toBe('New Name')
    expect(updated.price).toBe(120)
    expect(updated.description).toBe('New Description')
    expect(updated.sku).toBe('NEW-SKU')
    expect(updated.stock).toBe(5)
    expect(updated.active).toBe(false)

    const found = await repository.findById(product.id!)
    expect(found?.name).toBe('New Name')
    expect(found?.price).toBe(120)
    expect(found?.active).toBe(false)
  })

  it('should soft delete and restore an existing product in real MongoDB', async () => {
    const product = await repository.create(new Product({
      name: 'To Soft Delete',
      price: 50,
    }))

    const deleted = await repository.delete(product.id!)
    expect(deleted).toBe(true)

    // findById by default does not return soft deleted product
    const notFound = await repository.findById(product.id!)
    expect(notFound).toBeNull()

    // findById with includeDeleted returns the product
    const foundDeleted = await repository.findById(product.id!, true)
    expect(foundDeleted).not.toBeNull()
    expect(foundDeleted?.isDeleted).toBe(true)

    // Restore product
    const restored = await repository.restore(product.id!)
    expect(restored).not.toBeNull()
    expect(restored?.isDeleted).toBe(false)
    expect(restored?.deletedAt).toBeNull()

    const foundAfterRestore = await repository.findById(product.id!)
    expect(foundAfterRestore).not.toBeNull()
  })

  it('should filter products by category and tag in real MongoDB', async () => {
    await repository.create(new Product({
      name: 'Phone',
      price: 800,
      categories: ['Electronics', 'Mobile'],
      tags: ['5g', 'oled'],
    }))
    await repository.create(new Product({
      name: 'Laptop',
      price: 1500,
      categories: ['Electronics', 'Computers'],
      tags: ['gaming', 'oled'],
    }))

    const byCategory = await repository.list({ category: 'Computers' })
    expect(byCategory).toHaveLength(1)
    expect(byCategory[0].name).toBe('Laptop')

    const byTag = await repository.list({ tag: 'oled' })
    expect(byTag).toHaveLength(2)

    const bySpecificTag = await repository.list({ tag: '5g' })
    expect(bySpecificTag).toHaveLength(1)
    expect(bySpecificTag[0].name).toBe('Phone')
  })

  it('should return false when deleting non-existent product', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toHexString()
    const deleted = await repository.delete(nonExistentId)
    expect(deleted).toBe(false)
  })

  it('should list all products when no filter is provided', async () => {
    await repository.create(new Product({ name: 'Product 1', price: 10 }))
    await repository.create(new Product({ name: 'Product 2', price: 20 }))

    const result = await repository.list()
    expect(result).toHaveLength(2)
  })

  it('should list products with pagination in real MongoDB', async () => {
    await repository.create(new Product({ name: 'Product A', price: 10 }))
    await repository.create(new Product({ name: 'Product B', price: 20 }))
    await repository.create(new Product({ name: 'Product C', price: 30 }))

    const page1 = await repository.list({ page: 1, pageSize: 2 })
    expect(page1).toHaveLength(2)
    expect(page1[0].name).toBe('Product A')
    expect(page1[1].name).toBe('Product B')

    const page2 = await repository.list({ page: 2, pageSize: 2 })
    expect(page2).toHaveLength(1)
    expect(page2[0].name).toBe('Product C')
  })

  it('should list products matching search query case-insensitively', async () => {
    await repository.create(new Product({ name: 'Mechanical Keyboard', price: 120 }))
    await repository.create(new Product({ name: 'Wireless Mouse', price: 60 }))
    await repository.create(new Product({ name: 'Gaming Headset', price: 80 }))

    const result = await repository.list({ search: 'keyboard' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Mechanical Keyboard')
  })

  it('should filter products by sku, price range, and active status in real MongoDB', async () => {
    await repository.create(new Product({ name: 'Item 1', sku: 'SKU-001', price: 50, active: true }))
    await repository.create(new Product({ name: 'Item 2', sku: 'SKU-002', price: 150, active: true }))
    await repository.create(new Product({ name: 'Item 3', sku: 'SKU-003', price: 250, active: false }))

    const bySku = await repository.list({ sku: 'SKU-002' })
    expect(bySku).toHaveLength(1)
    expect(bySku[0].sku).toBe('SKU-002')

    const byPrice = await repository.list({ minPrice: 100, maxPrice: 300 })
    expect(byPrice).toHaveLength(2)

    const byActive = await repository.list({ active: false })
    expect(byActive).toHaveLength(1)
    expect(byActive[0].name).toBe('Item 3')
  })

  it('should return empty array when search does not match any product', async () => {
    await repository.create(new Product({ name: 'Mechanical Keyboard', price: 120 }))

    const result = await repository.list({ search: 'NonExistent' })
    expect(result).toHaveLength(0)
  })

  it('should atomically decrement stock and prevent negative stock in real MongoDB', async () => {
    const product = await repository.create(new Product({
      name: 'Limited Edition Watch',
      price: 500,
      stock: 5,
    }))

    const decremented = await repository.decrementStock(product.id!, 3)
    expect(decremented).not.toBeNull()
    expect(decremented?.stock).toBe(2)

    // Attempting to decrement 3 when only 2 are available should return null and not modify stock
    const insufficient = await repository.decrementStock(product.id!, 3)
    expect(insufficient).toBeNull()

    const current = await repository.findById(product.id!)
    expect(current?.stock).toBe(2)
  })

  it('should prevent race conditions when multiple concurrent requests decrement stock', async () => {
    // Product with only 1 unit in stock
    const product = await repository.create(new Product({
      name: 'Sole Ticket',
      price: 100,
      stock: 1,
    }))

    // Two simultaneous requests trying to acquire the 1 unit
    const [res1, res2] = await Promise.all([
      repository.decrementStock(product.id!, 1),
      repository.decrementStock(product.id!, 1),
    ])

    // Exactly one should succeed, the other must receive null
    const successes = [res1, res2].filter(r => r !== null)
    const failures = [res1, res2].filter(r => r === null)

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(successes[0]?.stock).toBe(0)

    // Final DB state must be 0
    const finalProduct = await repository.findById(product.id!)
    expect(finalProduct?.stock).toBe(0)
  })

  it('should atomically increment stock in real MongoDB', async () => {
    const product = await repository.create(new Product({
      name: 'Restocked Item',
      price: 20,
      stock: 3,
    }))

    const incremented = await repository.incrementStock(product.id!, 7)
    expect(incremented).not.toBeNull()
    expect(incremented?.stock).toBe(10)

    const found = await repository.findById(product.id!)
    expect(found?.stock).toBe(10)
  })

  it('should aggregate catalog summary correctly in real MongoDB', async () => {
    await repository.create(new Product({
      name: 'Product A',
      price: 10,
      categories: ['Electronics', 'Gadgets'],
      stock: 10,
      active: true,
    }))
    await repository.create(new Product({
      name: 'Product B',
      price: 30,
      categories: ['Electronics'],
      stock: 5,
      active: true,
    }))
    // Inactive product should be excluded
    await repository.create(new Product({
      name: 'Inactive',
      price: 100,
      categories: ['Other'],
      stock: 5,
      active: false,
    }))

    const summary = await repository.getCatalogSummary()

    expect(summary.totalProducts).toBe(2)
    expect(summary.categories.Electronics).toBe(2)
    expect(summary.categories.Gadgets).toBe(1)
    expect(summary.categories.Other).toBeUndefined()
    expect(summary.priceRange.min).toBe(10)
    expect(summary.priceRange.max).toBe(30)
    expect(summary.priceRange.average).toBe(20)
  })

  it('should get low stock products correctly in real MongoDB', async () => {
    await repository.create(new Product({
      name: 'High Stock',
      price: 10,
      stock: 15,
      active: true,
    }))
    const lowStockProd = await repository.create(new Product({
      name: 'Low Stock',
      price: 20,
      stock: 3,
      active: true,
    }))

    const lowStockList = await repository.getLowStock(5)

    expect(lowStockList).toHaveLength(1)
    expect(lowStockList[0].id).toBe(lowStockProd.id)
    expect(lowStockList[0].stock).toBe(3)
  })
})

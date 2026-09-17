import { describe, expect, it } from 'vitest'
import { ListProductsQueryDto } from './list-products-query.dto'

describe('listProductsQueryDto', () => {
  it('should parse valid query parameters and transform strings to expected types', () => {
    const input = {
      search: 'laptop',
      sku: 'LAP-123',
      category: 'tech',
      tag: 'sale',
      minPrice: '10.5',
      maxPrice: '99.9',
      active: 'true',
      includeDeleted: 'false',
      onlyDeleted: 'true',
      page: '2',
      pageSize: '25',
      size: '20',
    }

    const result = ListProductsQueryDto.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        search: 'laptop',
        sku: 'LAP-123',
        category: 'tech',
        tag: 'sale',
        minPrice: 10.5,
        maxPrice: 99.9,
        active: true,
        includeDeleted: false,
        onlyDeleted: true,
        page: 2,
        pageSize: 25,
        size: 20,
      })
    }
  })

  it('should parse empty object without errors', () => {
    const result = ListProductsQueryDto.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject invalid numeric fields', () => {
    expect(ListProductsQueryDto.safeParse({ minPrice: 'abc' }).success).toBe(false)
    expect(ListProductsQueryDto.safeParse({ maxPrice: 'invalid' }).success).toBe(false)
    expect(ListProductsQueryDto.safeParse({ page: 'not-a-number' }).success).toBe(false)
    expect(ListProductsQueryDto.safeParse({ pageSize: 'not-a-number' }).success).toBe(false)
    expect(ListProductsQueryDto.safeParse({ size: 'xyz' }).success).toBe(false)
  })

  it('should reject invalid boolean string fields', () => {
    expect(ListProductsQueryDto.safeParse({ active: 'yes' }).success).toBe(false)
    expect(ListProductsQueryDto.safeParse({ includeDeleted: 'no' }).success).toBe(false)
    expect(ListProductsQueryDto.safeParse({ onlyDeleted: '1' }).success).toBe(false)
  })
})

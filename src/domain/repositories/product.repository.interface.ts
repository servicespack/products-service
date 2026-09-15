import type { Product } from '../entities/product.entity'

export interface ListProductsParams {
  search?: string
  sku?: string
  category?: string
  tag?: string
  minPrice?: number
  maxPrice?: number
  active?: boolean
  includeDeleted?: boolean
  onlyDeleted?: boolean
  page?: number
  pageSize?: number
}

export interface IProductRepository {
  list: (params?: ListProductsParams) => Promise<Array<Product>>
  findById: (id: string, includeDeleted?: boolean) => Promise<Product | null>
  create: (product: Product) => Promise<Product>
  update: (product: Product) => Promise<Product>
  delete: (id: string) => Promise<boolean>
  restore: (id: string) => Promise<Product | null>
  decrementStock: (id: string, quantity: number) => Promise<Product | null>
  incrementStock: (id: string, quantity: number) => Promise<Product | null>
}

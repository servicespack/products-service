export interface ListProductsRequest {
  readonly search?: string
  readonly sku?: string
  readonly category?: string
  readonly tag?: string
  readonly minPrice?: number
  readonly maxPrice?: number
  readonly active?: boolean
  readonly includeDeleted?: boolean
  readonly onlyDeleted?: boolean
  readonly page?: number
  readonly pageSize?: number
}

export interface UpdateProductRequest {
  readonly name?: string
  readonly price?: number
  readonly description?: string
  readonly sku?: string
  readonly categories?: string[]
  readonly tags?: string[]
  readonly active?: boolean
}

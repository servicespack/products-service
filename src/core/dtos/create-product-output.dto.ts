import type { CreateProductInputDto } from './create-product-input.dto'

export type CreateProductOutputDto = CreateProductInputDto & {
  id: string
}

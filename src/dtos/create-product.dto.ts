import z from 'zod'

export const CreateProductDto = z.object({
  name: z.string(),
  price: z.number().nonnegative().finite().safe(),
})

export type CreateProductDto = z.infer<typeof CreateProductDto>

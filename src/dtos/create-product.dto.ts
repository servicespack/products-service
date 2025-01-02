import z from 'zod'

export const CreateProductDto = z.object({
  name: z.string(),
  price: z.number().nonnegative().finite().safe(),
})

// eslint-disable-next-line ts/no-redeclare
export type CreateProductDto = z.infer<typeof CreateProductDto>

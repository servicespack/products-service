import z from 'zod'

export const CreateProductDto = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative().finite().safe(),
  description: z.string().optional(),
  sku: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
})

// eslint-disable-next-line ts/no-redeclare
export type CreateProductDto = z.infer<typeof CreateProductDto>

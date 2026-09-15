import z from 'zod'

export const UpdateProductDto = z.object({
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().finite().safe().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
})

// eslint-disable-next-line ts/no-redeclare
export type UpdateProductDto = z.infer<typeof UpdateProductDto>

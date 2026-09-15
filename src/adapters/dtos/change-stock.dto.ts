import z from 'zod'

export const ChangeStockDto = z.object({
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
})

// eslint-disable-next-line ts/no-redeclare
export type ChangeStockDto = z.infer<typeof ChangeStockDto>

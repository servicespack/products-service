import { z } from 'zod'

export const ListProductsQueryDto = z.object({
  search: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  minPrice: z
    .string()
    .refine(val => Number.isFinite(Number(val)), { message: 'minPrice must be a valid number' })
    .transform(Number)
    .optional(),
  maxPrice: z
    .string()
    .refine(val => Number.isFinite(Number(val)), { message: 'maxPrice must be a valid number' })
    .transform(Number)
    .optional(),
  active: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional(),
  includeDeleted: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional(),
  onlyDeleted: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional(),
  page: z
    .string()
    .refine(val => Number.isFinite(Number(val)), { message: 'page must be a valid number' })
    .transform(Number)
    .optional(),
  pageSize: z
    .string()
    .refine(val => Number.isFinite(Number(val)), { message: 'pageSize must be a valid number' })
    .transform(Number)
    .optional(),
  size: z
    .string()
    .refine(val => Number.isFinite(Number(val)), { message: 'size must be a valid number' })
    .transform(Number)
    .optional(),
})

export type ListProductsQuery = z.infer<typeof ListProductsQueryDto>

import * as z from 'zod';

export const photoSearchSchema = z.object({
  query: z.string().trim().transform((val) => val.slice(0, 100)),
  orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
  size: z.enum(['large', 'medium', 'small']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  locale: z.string().optional(),
  per_page: z.number().min(1).max(10).optional(),
  force_refresh: z.boolean().optional(),
});

export const videoSearchSchema = z.object({
  query: z.string().trim().transform((val) => val.slice(0, 100)),
  orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
  size: z.enum(['large', 'medium', 'small']).optional(),
  locale: z.string().optional(),
  per_page: z.number().min(1).max(10).optional(),
  force_refresh: z.boolean().optional(),
});

export const getDetailsSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['photo', 'video']),
  force_refresh: z.boolean().optional(),
});

import {z} from 'zod';

const template = z.enum(['home', 'collection', 'product']);
const sectionType = z.enum([
  'hero', 'categories', 'featured-products', 'best-selling', 'promotion-banner',
  'image-text', 'product-collection', 'new-arrivals', 'sale-products', 'announcement',
  'rich-text', 'spacer', 'product-gallery', 'product-info', 'product-description',
  'related-products',
]);

export const aiCommandSchema = z.discriminatedUnion('type', [
  z.object({type: z.literal('update_section'), template, sectionId: z.string().min(1).max(120), patch: z.record(z.string(), z.unknown())}).strict(),
  z.object({type: z.literal('add_section'), template, sectionType, afterSectionId: z.string().min(1).max(120).optional()}).strict(),
  z.object({type: z.literal('remove_section'), template, sectionId: z.string().min(1).max(120)}).strict(),
  z.object({type: z.literal('move_section'), template, sectionId: z.string().min(1).max(120), afterSectionId: z.string().min(1).max(120).optional()}).strict(),
  z.object({type: z.literal('set_section_enabled'), template, sectionId: z.string().min(1).max(120), enabled: z.boolean()}).strict(),
  z.object({type: z.literal('set_theme'), themeId: z.enum(['clean-minimal', 'street-bold', 'soft-elegant', 'grid-catalog', 'dark-modern'])}).strict(),
  z.object({type: z.literal('set_global_settings'), patch: z.record(z.string(), z.unknown())}).strict(),
  z.object({type: z.literal('attach_media'), template, sectionId: z.string().min(1).max(120), field: z.literal('imageUrl'), mediaId: z.string().uuid()}).strict(),
]);

export const aiProposalSchema = z.object({
  summary: z.string().min(1).max(600),
  commands: z.array(aiCommandSchema).min(1).max(20),
}).strict();

export function parseProviderProposal(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The AI provider did not return valid JSON.');
  }
  const result = aiProposalSchema.safeParse(parsed);
  if (!result.success) throw new Error('The AI provider returned commands outside the approved schema.');
  return result.data;
}


export * from './types.js';
export {
  SECTION_REGISTRY,
  defaultSectionSettings,
  getSectionDefinition,
  isStoreSectionType,
  supportsTemplate,
} from './registry.js';
export {
  createDefaultStoreDesign,
  normalizeStoreDesign,
  validatePublishableStoreDesign,
} from './normalize.js';
export {createThemeDraft} from './migrateTheme.js';
export {MAX_PRODUCT_SOURCE_PRODUCTS, getSectionProductSource, resolveProductSource, type ProductSourceResolutionContext} from './productSource.js';

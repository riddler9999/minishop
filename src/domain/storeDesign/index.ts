export * from './types.ts';
export {
  SECTION_REGISTRY,
  defaultSectionSettings,
  getSectionDefinition,
  isStoreSectionType,
  supportsTemplate,
} from './registry.ts';
export {
  createDefaultStoreDesign,
  normalizeStoreDesign,
  validatePublishableStoreDesign,
} from './normalize.ts';
export {createThemeDraft} from './migrateTheme.ts';

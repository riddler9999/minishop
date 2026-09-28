import {
  SECTION_REGISTRY,
  createThemeDraft,
  defaultSectionSettings,
  isStoreSectionType,
  normalizeStoreDesign,
  supportsTemplate,
  validatePublishableStoreDesign,
  type SectionSettingsByType,
  type StoreDesignDocument,
  type StoreSection,
  type StoreSectionType,
  type StoreTemplateName,
} from '../../src/domain/storeDesign/index.ts';
import type {ThemePresetId} from '../../src/domain/theme.ts';
import {McpError} from './errors.ts';

export interface StoreDesignLifecyclePort {
  loadOwnStoreDesign(): Promise<{
    draft: StoreDesignDocument;
    published: StoreDesignDocument;
    previousPublished: StoreDesignDocument | null;
    draftRevision: number;
    publishedRevision: number;
    updatedAt: string | null;
    publishedAt: string | null;
  }>;
  saveDraft(input: {expectedRevision: number; document: StoreDesignDocument}): Promise<{revision: number; document: StoreDesignDocument}>;
  publishDraft(input: {expectedDraftRevision: number}): Promise<any>;
  rollbackPublished(): Promise<any>;
}

function copyDocument(document: StoreDesignDocument): StoreDesignDocument {
  return structuredClone(document);
}

function mapError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'STORE_DESIGN_CONFLICT') {
    throw new McpError('STORE_DESIGN_CONFLICT', 409, 'Store Design changed elsewhere. Reload before retrying.');
  }
  throw error;
}

function assertTemplate(document: StoreDesignDocument, template: StoreTemplateName): void {
  if (!Object.prototype.hasOwnProperty.call(document.templates, template)) {
    throw new McpError('UNSUPPORTED_TEMPLATE', 422, 'Unsupported Store Design template.');
  }
}

function findSection(document: StoreDesignDocument, template: StoreTemplateName, sectionId: string): StoreSection {
  assertTemplate(document, template);
  const section = document.templates[template].sections.find((item) => item.id === sectionId);
  if (!section) throw new McpError('INVALID_SECTION', 422, 'Store section was not found.');
  return section;
}

function nextSectionId(document: StoreDesignDocument, template: StoreTemplateName, type: StoreSectionType): string {
  const used = new Set(document.templates[template].sections.map((section) => section.id));
  let index = document.templates[template].sections.length + 1;
  let candidate = `${template}-${type}-${index}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${template}-${type}-${index}`;
  }
  return candidate;
}

function validatePrimitiveTypes(current: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in current)) throw new McpError('INVALID_SECTION', 422, 'Unsupported section setting.');
    const expected = current[key];
    if (expected !== null && typeof expected !== 'object' && typeof value !== typeof expected) {
      throw new McpError('INVALID_SECTION', 422, 'Invalid section setting type.');
    }
  }
}

function mergedSettings<T extends StoreSectionType>(
  type: T,
  current: SectionSettingsByType[T],
  patch: Partial<SectionSettingsByType[T]>,
): SectionSettingsByType[T] {
  validatePrimitiveTypes(current as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  const next = {...current, ...patch} as SectionSettingsByType[T];
  if ('productSource' in next) {
    const source = (next as any).productSource;
    if (!source || (source.mode !== 'manual' && source.mode !== 'dynamic')) {
      throw new McpError('INVALID_PRODUCT_SOURCE', 422, 'Invalid product source.');
    }
  }
  return next;
}

export function createStoreDesignMcpService(adapter: StoreDesignLifecyclePort) {
  async function saveMutation(mutator: (document: StoreDesignDocument) => StoreDesignDocument) {
    const lifecycle = await adapter.loadOwnStoreDesign();
    const document = normalizeStoreDesign(mutator(copyDocument(lifecycle.draft)));
    try {
      const saved = await adapter.saveDraft({expectedRevision: lifecycle.draftRevision, document});
      return {
        changed: true as const,
        draftRevision: saved.revision,
        publishedRevision: lifecycle.publishedRevision,
        document: saved.document,
      };
    } catch (error) {
      mapError(error);
    }
  }

  return {
    async getStoreDesign() {
      return adapter.loadOwnStoreDesign();
    },

    async updateStoreTheme(input: {themeId: ThemePresetId}) {
      return saveMutation((document) => createThemeDraft(document, input.themeId));
    },

    async addStoreSection(input: {template: StoreTemplateName; type: StoreSectionType}) {
      if (!isStoreSectionType(input.type)) {
        throw new McpError('INVALID_SECTION', 422, 'Invalid store section.');
      }
      if (!supportsTemplate(input.type, input.template)) {
        throw new McpError('UNSUPPORTED_TEMPLATE', 422, 'This section is not supported by the selected template.');
      }
      return saveMutation((document) => {
        assertTemplate(document, input.template);
        const section = {
          id: nextSectionId(document, input.template, input.type),
          type: input.type,
          enabled: true,
          settings: defaultSectionSettings(input.type),
        } as StoreSection;
        document.templates[input.template].sections.push(section);
        return document;
      });
    },

    async updateStoreSection(input: {
      template: StoreTemplateName;
      sectionId: string;
      settings: Record<string, unknown>;
      enabled?: boolean;
    }) {
      return saveMutation((document) => {
        const section = findSection(document, input.template, input.sectionId);
        const definition = SECTION_REGISTRY[section.type];
        if (input.enabled === false && !definition.hideable) {
          throw new McpError('INVALID_SECTION', 422, 'This section cannot be hidden.');
        }
        if (input.enabled !== undefined) section.enabled = input.enabled;
        (section as any).settings = mergedSettings(section.type, section.settings as any, input.settings as any);
        return document;
      });
    },

    async moveStoreSection(input: {template: StoreTemplateName; sectionId: string; toIndex: number}) {
      return saveMutation((document) => {
        assertTemplate(document, input.template);
        const sections = document.templates[input.template].sections;
        const index = sections.findIndex((section) => section.id === input.sectionId);
        if (index < 0) throw new McpError('INVALID_SECTION', 422, 'Store section was not found.');
        const [section] = sections.splice(index, 1);
        const target = Math.max(0, Math.min(input.toIndex, sections.length));
        sections.splice(target, 0, section!);
        return document;
      });
    },

    async removeStoreSection(input: {template: StoreTemplateName; sectionId: string}) {
      return saveMutation((document) => {
        assertTemplate(document, input.template);
        const sections = document.templates[input.template].sections;
        const index = sections.findIndex((section) => section.id === input.sectionId);
        if (index < 0) throw new McpError('INVALID_SECTION', 422, 'Store section was not found.');
        const section = sections[index]!;
        if (!SECTION_REGISTRY[section.type].removable) {
          throw new McpError('INVALID_SECTION', 422, 'This section cannot be removed.');
        }
        sections.splice(index, 1);
        return document;
      });
    },

    async publishStore() {
      const lifecycle = await adapter.loadOwnStoreDesign();
      const validation = validatePublishableStoreDesign(lifecycle.draft);
      if (!validation.ok) {
        throw new McpError('PUBLISH_VALIDATION_FAILED', 422, 'Store Design is not publishable.');
      }
      try {
        const result = await adapter.publishDraft({expectedDraftRevision: lifecycle.draftRevision});
        return {
          changed: true as const,
          draftRevision: result.draftRevision,
          publishedRevision: result.publishedRevision,
          document: result.published,
        };
      } catch (error) {
        mapError(error);
      }
    },

    async rollbackStoreDesign() {
      try {
        const result = await adapter.rollbackPublished();
        return {
          changed: true as const,
          draftRevision: result.draftRevision,
          publishedRevision: result.publishedRevision,
          document: result.published,
        };
      } catch (error) {
        mapError(error);
      }
    },
  };
}

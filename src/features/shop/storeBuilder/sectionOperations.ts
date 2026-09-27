import {
  defaultSectionSettings,
  getSectionDefinition,
  supportsTemplate,
  type SectionSettingsByType,
  type StoreDesignDocument,
  type StoreSection,
  type StoreSectionType,
  type StoreTemplateName,
} from '@/domain/storeDesign';

type IdFactory = () => string;

const defaultIdFactory: IdFactory = () => globalThis.crypto.randomUUID();

function updateTemplate(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  sections: StoreSection[],
): StoreDesignDocument {
  return {
    ...document,
    templates: {...document.templates, [template]: {sections}},
  };
}

export function createSection<T extends StoreSectionType>(
  template: StoreTemplateName,
  type: T,
  createId: IdFactory = defaultIdFactory,
): StoreSection {
  if (!supportsTemplate(type, template) || !getSectionDefinition(type).removable) {
    throw new Error(`${type} is not eligible to be added to ${template}.`);
  }
  return {
    id: `${template}-${type}-${createId()}`,
    type,
    enabled: true,
    settings: structuredClone(defaultSectionSettings(type)),
  } as StoreSection;
}

export function addSection<T extends StoreSectionType>(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  type: T,
  createId?: IdFactory,
): {document: StoreDesignDocument; section: StoreSection} {
  const section = createSection(template, type, createId);
  return {
    document: updateTemplate(document, template, [...document.templates[template].sections, section]),
    section,
  };
}

export function reorderSection(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  sectionId: string,
  direction: -1 | 1,
): StoreDesignDocument {
  const sections = document.templates[template].sections;
  const from = sections.findIndex((section) => section.id === sectionId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= sections.length) return document;
  const next = [...sections];
  [next[from], next[to]] = [next[to], next[from]];
  return updateTemplate(document, template, next);
}

export function setSectionEnabled(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  sectionId: string,
  enabled: boolean,
): StoreDesignDocument {
  const sections = document.templates[template].sections;
  const target = sections.find((section) => section.id === sectionId);
  if (!target || !getSectionDefinition(target.type).hideable) return document;
  return updateTemplate(document, template, sections.map((section) => section.id === sectionId ? {...section, enabled} : section));
}

export function removeSection(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  sectionId: string,
): StoreDesignDocument {
  const sections = document.templates[template].sections;
  const target = sections.find((section) => section.id === sectionId);
  if (!target || !getSectionDefinition(target.type).removable) return document;
  return updateTemplate(document, template, sections.filter((section) => section.id !== sectionId));
}

export function updateSectionSettings<T extends StoreSectionType>(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  sectionId: string,
  type: T,
  settings: SectionSettingsByType[T],
): StoreDesignDocument {
  const sections = document.templates[template].sections;
  const target = sections.find((section) => section.id === sectionId);
  if (!target || target.type !== type) return document;
  return updateTemplate(document, template, sections.map((section) => (
    section.id === sectionId ? {...section, settings} as StoreSection : section
  )));
}

export function replaceSection(
  document: StoreDesignDocument,
  template: StoreTemplateName,
  nextSection: StoreSection,
): StoreDesignDocument {
  const sections = document.templates[template].sections;
  if (!sections.some((section) => section.id === nextSection.id && section.type === nextSection.type)) return document;
  return updateTemplate(document, template, sections.map((section) => section.id === nextSection.id ? nextSection : section));
}

export function eligibleSectionTypes(template: StoreTemplateName): StoreSectionType[] {
  return (Object.keys(SECTION_TYPES) as StoreSectionType[]).filter((type) => (
    supportsTemplate(type, template) && getSectionDefinition(type).removable
  ));
}

const SECTION_TYPES = {
  hero: true,
  categories: true,
  'featured-products': true,
  'best-selling': true,
  'promotion-banner': true,
  'image-text': true,
  'product-collection': true,
  'new-arrivals': true,
  'sale-products': true,
  announcement: true,
  'rich-text': true,
  spacer: true,
  'product-gallery': true,
  'product-info': true,
  'product-description': true,
  'related-products': true,
} satisfies Record<StoreSectionType, true>;

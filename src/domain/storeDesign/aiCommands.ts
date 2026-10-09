import type {
  GlobalThemeSettings,
  StoreDesignDocument,
  StoreSection,
  StoreSectionType,
  StoreTemplateName,
} from './types';
import type {ThemePresetId} from '../theme.js';
import {isThemePresetId} from '../theme.js';
import {
  defaultSectionSettings,
  getSectionDefinition,
  isStoreSectionType,
  supportsTemplate,
} from './registry.js';
import {validatePublishableStoreDesign} from './normalize.js';

export const AI_COMMAND_SCHEMA_VERSION = 1 as const;

export type AiStoreCommand =
  | {
      type: 'update_section';
      template: StoreTemplateName;
      sectionId: string;
      patch: Record<string, unknown>;
    }
  | {
      type: 'add_section';
      template: StoreTemplateName;
      sectionType: StoreSectionType;
      afterSectionId?: string;
    }
  | {
      type: 'remove_section';
      template: StoreTemplateName;
      sectionId: string;
    }
  | {
      type: 'move_section';
      template: StoreTemplateName;
      sectionId: string;
      afterSectionId?: string;
    }
  | {
      type: 'set_section_enabled';
      template: StoreTemplateName;
      sectionId: string;
      enabled: boolean;
    }
  | {
      type: 'set_theme';
      themeId: ThemePresetId;
    }
  | {
      type: 'set_global_settings';
      patch: Partial<GlobalThemeSettings>;
    }
  | {
      type: 'attach_media';
      template: StoreTemplateName;
      sectionId: string;
      field: 'imageUrl';
      mediaId: string;
    };

export interface CommandValidationError {
  commandIndex: number;
  code:
    | 'PROTECTED_COMMERCE_INVARIANT'
    | 'SECTION_NOT_FOUND'
    | 'INVALID_TEMPLATE'
    | 'INVALID_THEME'
    | 'UNSUPPORTED_COMMAND'
    | 'INVALID_COMMAND_PAYLOAD';
  message: string;
}

export interface CommandExecutionResult {
  ok: boolean;
  doc: StoreDesignDocument;
  appliedCommandsCount: number;
  errors: CommandValidationError[];
}

export interface CommandExecutionOptions {
  mediaById?: Readonly<Record<string, string>>;
}

const TEMPLATE_NAMES = new Set<StoreTemplateName>(['home', 'collection', 'product']);
const SECTION_PATCH_FIELDS: Record<StoreSectionType, ReadonlySet<string>> = {
  hero: new Set(['headline', 'subtext', 'ctaLabel']),
  categories: new Set(['title']),
  'featured-products': new Set(['title', 'productSource']),
  'best-selling': new Set(['title', 'productSource']),
  'promotion-banner': new Set(['headline', 'body', 'ctaLabel']),
  'image-text': new Set(['headline', 'body']),
  'product-collection': new Set(['title', 'productSource']),
  'new-arrivals': new Set(['title', 'productSource']),
  'sale-products': new Set(['title', 'productSource']),
  announcement: new Set(['text']),
  'rich-text': new Set(['text']),
  spacer: new Set(['size']),
  'product-gallery': new Set(['layout']),
  'product-info': new Set(['showPrice']),
  'product-description': new Set(['heading']),
  'related-products': new Set(['title', 'productSource']),
};

function cloneDocument(document: StoreDesignDocument): StoreDesignDocument {
  return structuredClone(document);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTemplate(value: unknown): value is StoreTemplateName {
  return typeof value === 'string' && TEMPLATE_NAMES.has(value as StoreTemplateName);
}

function pushError(
  errors: CommandValidationError[],
  commandIndex: number,
  code: CommandValidationError['code'],
  message: string,
) {
  errors.push({commandIndex, code, message});
}

export function validateAndExecuteAiCommands(
  initialDoc: StoreDesignDocument,
  commands: AiStoreCommand[],
  options: CommandExecutionOptions = {},
): CommandExecutionResult {
  const doc = cloneDocument(initialDoc);
  const errors: CommandValidationError[] = [];
  let appliedCount = 0;

  for (let idx = 0; idx < commands.length; idx++) {
    const cmd = commands[idx];
    if (!isRecord(cmd) || typeof cmd.type !== 'string') {
      pushError(errors, idx, 'UNSUPPORTED_COMMAND', 'Invalid command structure');
      continue;
    }

    try {
      switch (cmd.type) {
        case 'set_theme': {
          if (!isThemePresetId(cmd.themeId)) {
            pushError(errors, idx, 'INVALID_THEME', 'Unknown themeId');
            break;
          }
          doc.themeId = cmd.themeId;
          appliedCount++;
          break;
        }

        case 'set_global_settings': {
          if (!isRecord(cmd.patch)) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', 'Invalid global settings patch');
            break;
          }
          const keys = Object.keys(cmd.patch);
          if (keys.some((key) => !['accentColor', 'fontPairing', 'buyNow'].includes(key))) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', 'Unsupported global settings field');
            break;
          }
          if (cmd.patch.accentColor !== undefined &&
              (typeof cmd.patch.accentColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(cmd.patch.accentColor))) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', 'Invalid accent color');
            break;
          }
          if (cmd.patch.fontPairing !== undefined &&
              !['classic', 'minimal', 'boutique'].includes(String(cmd.patch.fontPairing))) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', 'Invalid font pairing');
            break;
          }
          if (cmd.patch.buyNow !== undefined) {
            if (!isRecord(cmd.patch.buyNow) ||
                Object.keys(cmd.patch.buyNow).some((key) => !['label', 'style', 'width', 'disabled'].includes(key)) ||
                (cmd.patch.buyNow as Record<string, unknown>).disabled === true ||
                (cmd.patch.buyNow.label !== undefined &&
                  (typeof cmd.patch.buyNow.label !== 'string' || !cmd.patch.buyNow.label.trim()))) {
              pushError(errors, idx, 'PROTECTED_COMMERCE_INVARIANT', 'Buy Now must remain enabled and labelled');
              break;
            }
          }
          doc.globalSettings = {
            ...doc.globalSettings,
            ...cmd.patch,
            buyNow: {
              ...doc.globalSettings.buyNow,
              ...(cmd.patch.buyNow || {}),
              disabled: false, // Invariant enforcement
            },
          };
          appliedCount++;
          break;
        }

        case 'set_section_enabled': {
          if (!validTemplate(cmd.template)) {
            pushError(errors, idx, 'INVALID_TEMPLATE', 'Invalid template');
            break;
          }
          const template = doc.templates[cmd.template];
          const section = template.sections.find((s) => s.id === cmd.sectionId);
          if (!section) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.sectionId} not found`);
            break;
          }
          if (!cmd.enabled && !getSectionDefinition(section.type).hideable) {
            pushError(errors, idx, 'PROTECTED_COMMERCE_INVARIANT', `${section.type} cannot be disabled`);
            break;
          }
          section.enabled = cmd.enabled;
          appliedCount++;
          break;
        }

        case 'remove_section': {
          if (!validTemplate(cmd.template)) {
            pushError(errors, idx, 'INVALID_TEMPLATE', 'Invalid template');
            break;
          }
          const template = doc.templates[cmd.template];
          const sectionIndex = template.sections.findIndex((s) => s.id === cmd.sectionId);
          if (sectionIndex === -1) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.sectionId} not found`);
            break;
          }
          const section = template.sections[sectionIndex];
          if (!getSectionDefinition(section.type).removable) {
            pushError(errors, idx, 'PROTECTED_COMMERCE_INVARIANT', `${section.type} cannot be removed`);
            break;
          }
          template.sections.splice(sectionIndex, 1);
          appliedCount++;
          break;
        }

        case 'add_section': {
          if (!validTemplate(cmd.template)) {
            pushError(errors, idx, 'INVALID_TEMPLATE', 'Invalid template');
            break;
          }
          if (!isStoreSectionType(cmd.sectionType) || !supportsTemplate(cmd.sectionType, cmd.template)) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', 'Section type is not supported by this template');
            break;
          }
          const template = doc.templates[cmd.template];
          if (cmd.afterSectionId && !template.sections.some((section) => section.id === cmd.afterSectionId)) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.afterSectionId} not found`);
            break;
          }

          const newSectionId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newSection: StoreSection = {
            id: newSectionId,
            type: cmd.sectionType,
            enabled: true,
            settings: defaultSectionSettings(cmd.sectionType),
          } as StoreSection;

          if (cmd.afterSectionId) {
            const afterIdx = template.sections.findIndex((s) => s.id === cmd.afterSectionId);
            if (afterIdx !== -1) {
              template.sections.splice(afterIdx + 1, 0, newSection);
            } else {
              template.sections.push(newSection);
            }
          } else {
            template.sections.push(newSection);
          }
          appliedCount++;
          break;
        }

        case 'move_section': {
          if (!validTemplate(cmd.template)) {
            pushError(errors, idx, 'INVALID_TEMPLATE', 'Invalid template');
            break;
          }
          const template = doc.templates[cmd.template];
          const currentIdx = template.sections.findIndex((s) => s.id === cmd.sectionId);
          if (currentIdx === -1) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.sectionId} not found`);
            break;
          }
          if (cmd.afterSectionId && !template.sections.some((section) => section.id === cmd.afterSectionId)) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.afterSectionId} not found`);
            break;
          }

          const [movedSection] = template.sections.splice(currentIdx, 1);
          if (cmd.afterSectionId) {
            const afterIdx = template.sections.findIndex((s) => s.id === cmd.afterSectionId);
            if (afterIdx !== -1) {
              template.sections.splice(afterIdx + 1, 0, movedSection);
            } else {
              template.sections.push(movedSection);
            }
          } else {
            template.sections.unshift(movedSection);
          }
          appliedCount++;
          break;
        }

        case 'update_section': {
          if (!validTemplate(cmd.template)) {
            pushError(errors, idx, 'INVALID_TEMPLATE', 'Invalid template');
            break;
          }
          const template = doc.templates[cmd.template];
          const section = template.sections.find((s) => s.id === cmd.sectionId);
          if (!section) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.sectionId} not found`);
            break;
          }
          if (!isRecord(cmd.patch) ||
              Object.keys(cmd.patch).some((key) => !SECTION_PATCH_FIELDS[section.type].has(key))) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', `Unsupported settings for ${section.type}`);
            break;
          }
          if (section.type === 'product-info' && cmd.patch.showPrice !== true) {
            pushError(errors, idx, 'PROTECTED_COMMERCE_INVARIANT', 'Product price display is mandatory');
            break;
          }
          section.settings = {
            ...section.settings,
            ...cmd.patch,
          };
          appliedCount++;
          break;
        }

        case 'attach_media': {
          if (!validTemplate(cmd.template)) {
            pushError(errors, idx, 'INVALID_TEMPLATE', 'Invalid template');
            break;
          }
          const template = doc.templates[cmd.template];
          const section = template.sections.find((s) => s.id === cmd.sectionId);
          if (!section) {
            pushError(errors, idx, 'SECTION_NOT_FOUND', `Section ${cmd.sectionId} not found`);
            break;
          }
          const deliveryUrl = options.mediaById?.[cmd.mediaId];
          if (!deliveryUrl || (!deliveryUrl.startsWith('/') && !deliveryUrl.startsWith('https://'))) {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', 'Media is not trusted for this shop');
            break;
          }
          if (section.type === 'hero' || section.type === 'image-text') {
            section.settings.imageUrl = deliveryUrl;
            appliedCount++;
          } else {
            pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', `Section ${section.type} does not support media`);
          }
          break;
        }

        default:
          pushError(errors, idx, 'UNSUPPORTED_COMMAND', `Unknown command type ${String((cmd as {type?: unknown}).type)}`);
      }
    } catch (error: unknown) {
      pushError(errors, idx, 'INVALID_COMMAND_PAYLOAD', error instanceof Error ? error.message : 'Execution error');
    }
  }

  const publishValidation = errors.length === 0 ? validatePublishableStoreDesign(doc) : null;
  if (publishValidation && !publishValidation.ok) {
    for (const error of publishValidation.errors) {
      pushError(errors, commands.length - 1, 'PROTECTED_COMMERCE_INVARIANT', error.message);
    }
  }

  if (errors.length > 0) {
    return {ok: false, doc: cloneDocument(initialDoc), appliedCommandsCount: 0, errors};
  }

  return {
    ok: true,
    doc,
    appliedCommandsCount: appliedCount,
    errors,
  };
}

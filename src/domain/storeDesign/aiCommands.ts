import type {
  GlobalThemeSettings,
  StoreDesignDocument,
  StoreSection,
  StoreSectionType,
  StoreTemplateName,
} from './types';
import type {ThemePresetId} from '../theme';

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
      mediaUrl: string;
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

export function validateAndExecuteAiCommands(
  initialDoc: StoreDesignDocument,
  commands: AiStoreCommand[]
): CommandExecutionResult {
  // Deep clone draft doc so mutations are pure
  const doc: StoreDesignDocument = JSON.parse(JSON.stringify(initialDoc));
  const errors: CommandValidationError[] = [];
  let appliedCount = 0;

  for (let idx = 0; idx < commands.length; idx++) {
    const cmd = commands[idx];
    if (!cmd || typeof cmd !== 'object' || !cmd.type) {
      errors.push({
        commandIndex: idx,
        code: 'UNSUPPORTED_COMMAND',
        message: 'Invalid command structure',
      });
      continue;
    }

    try {
      switch (cmd.type) {
        case 'set_theme': {
          if (!cmd.themeId || typeof cmd.themeId !== 'string') {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_THEME',
              message: 'Invalid themeId provided',
            });
            break;
          }
          doc.themeId = cmd.themeId as ThemePresetId;
          appliedCount++;
          break;
        }

        case 'set_global_settings': {
          if (!cmd.patch || typeof cmd.patch !== 'object') {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_COMMAND_PAYLOAD',
              message: 'Invalid patch payload',
            });
            break;
          }
          // Protected commerce check: buyNow must remain disabled: false
          if (cmd.patch.buyNow && (cmd.patch.buyNow as any).disabled !== false) {
            errors.push({
              commandIndex: idx,
              code: 'PROTECTED_COMMERCE_INVARIANT',
              message: 'Product Detail Buy Now button is mandatory and cannot be disabled.',
            });
            break;
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
          const template = doc.templates[cmd.template];
          if (!template) {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_TEMPLATE',
              message: `Template ${cmd.template} does not exist`,
            });
            break;
          }
          const section = template.sections.find((s) => s.id === cmd.sectionId);
          if (!section) {
            errors.push({
              commandIndex: idx,
              code: 'SECTION_NOT_FOUND',
              message: `Section ${cmd.sectionId} not found in template ${cmd.template}`,
            });
            break;
          }
          // Protected commerce invariant: product-info section cannot be disabled
          if (section.type === 'product-info' && !cmd.enabled) {
            errors.push({
              commandIndex: idx,
              code: 'PROTECTED_COMMERCE_INVARIANT',
              message: 'The product-info section cannot be disabled.',
            });
            break;
          }
          section.enabled = cmd.enabled;
          appliedCount++;
          break;
        }

        case 'remove_section': {
          const template = doc.templates[cmd.template];
          if (!template) {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_TEMPLATE',
              message: `Template ${cmd.template} does not exist`,
            });
            break;
          }
          const sectionIndex = template.sections.findIndex((s) => s.id === cmd.sectionId);
          if (sectionIndex === -1) {
            errors.push({
              commandIndex: idx,
              code: 'SECTION_NOT_FOUND',
              message: `Section ${cmd.sectionId} not found in template ${cmd.template}`,
            });
            break;
          }
          const section = template.sections[sectionIndex];
          // Protected commerce invariant: product-info section cannot be removed
          if (section.type === 'product-info') {
            errors.push({
              commandIndex: idx,
              code: 'PROTECTED_COMMERCE_INVARIANT',
              message: 'The product-info section cannot be removed from product template.',
            });
            break;
          }
          template.sections.splice(sectionIndex, 1);
          appliedCount++;
          break;
        }

        case 'add_section': {
          const template = doc.templates[cmd.template];
          if (!template) {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_TEMPLATE',
              message: `Template ${cmd.template} does not exist`,
            });
            break;
          }

          const newSectionId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          let defaultSettings: any = {};
          switch (cmd.sectionType) {
            case 'hero':
              defaultSettings = {headline: 'Welcome to our shop', subtext: 'Browse our latest arrivals', ctaLabel: 'Shop Now', imageUrl: null};
              break;
            case 'image-text':
              defaultSettings = {headline: 'Our Quality Story', body: 'Handcrafted items crafted with care.', imageUrl: null};
              break;
            case 'announcement':
              defaultSettings = {text: 'Free shipping on orders over 50,000 Ks'};
              break;
            case 'promotion-banner':
              defaultSettings = {headline: 'Special Sale', body: 'Limited time offer on featured products.', ctaLabel: 'Claim Discount'};
              break;
            case 'categories':
              defaultSettings = {title: 'Shop Categories'};
              break;
            case 'featured-products':
            case 'best-selling':
            case 'new-arrivals':
            case 'sale-products':
            case 'product-collection':
            case 'related-products':
              defaultSettings = {
                title: cmd.sectionType.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                productSource: {mode: 'dynamic', rule: 'best_selling', limit: 8},
              };
              break;
            case 'rich-text':
              defaultSettings = {text: 'Add your story or custom store announcement here.'};
              break;
            case 'spacer':
              defaultSettings = {size: 'md'};
              break;
            default:
              defaultSettings = {};
          }

          const newSection: StoreSection = {
            id: newSectionId,
            type: cmd.sectionType,
            enabled: true,
            settings: defaultSettings,
          } as any;

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
          const template = doc.templates[cmd.template];
          if (!template) {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_TEMPLATE',
              message: `Template ${cmd.template} does not exist`,
            });
            break;
          }
          const currentIdx = template.sections.findIndex((s) => s.id === cmd.sectionId);
          if (currentIdx === -1) {
            errors.push({
              commandIndex: idx,
              code: 'SECTION_NOT_FOUND',
              message: `Section ${cmd.sectionId} not found`,
            });
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
          const template = doc.templates[cmd.template];
          if (!template) {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_TEMPLATE',
              message: `Template ${cmd.template} does not exist`,
            });
            break;
          }
          const section = template.sections.find((s) => s.id === cmd.sectionId);
          if (!section) {
            errors.push({
              commandIndex: idx,
              code: 'SECTION_NOT_FOUND',
              message: `Section ${cmd.sectionId} not found`,
            });
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
          const template = doc.templates[cmd.template];
          if (!template) {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_TEMPLATE',
              message: `Template ${cmd.template} does not exist`,
            });
            break;
          }
          const section = template.sections.find((s) => s.id === cmd.sectionId);
          if (!section) {
            errors.push({
              commandIndex: idx,
              code: 'SECTION_NOT_FOUND',
              message: `Section ${cmd.sectionId} not found`,
            });
            break;
          }
          if ('imageUrl' in section.settings) {
            (section.settings as any).imageUrl = cmd.mediaUrl;
            appliedCount++;
          } else {
            errors.push({
              commandIndex: idx,
              code: 'INVALID_COMMAND_PAYLOAD',
              message: `Section ${section.type} does not support imageUrl field`,
            });
          }
          break;
        }

        default:
          errors.push({
            commandIndex: idx,
            code: 'UNSUPPORTED_COMMAND',
            message: `Unknown command type ${(cmd as any).type}`,
          });
      }
    } catch (err: any) {
      errors.push({
        commandIndex: idx,
        code: 'INVALID_COMMAND_PAYLOAD',
        message: err?.message || 'Execution error',
      });
    }
  }

  return {
    ok: errors.length === 0,
    doc,
    appliedCommandsCount: appliedCount,
    errors,
  };
}

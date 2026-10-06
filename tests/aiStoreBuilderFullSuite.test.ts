import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  validateAndExecuteAiCommands,
  type AiStoreCommand,
} from '../src/domain/storeDesign/aiCommands.ts';
import {
  createDocumentHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from '../src/features/shop/storeBuilder/editorState.ts';
import {
  AI_PROVIDERS,
  maskApiKey,
  supportsCapability,
} from '../src/domain/aiProvider.ts';
import {
  validateMediaFileHeader,
  isAllowedMimeType,
  MAX_MEDIA_BYTE_SIZE,
} from '../src/domain/storeMedia.ts';
import type {StoreDesignDocument} from '../src/domain/storeDesign/types.ts';

function mockStoreDesignDoc(): StoreDesignDocument {
  return {
    schemaVersion: 1,
    themeId: 'clean-minimal',
    globalSettings: {
      accentColor: '#35b99d',
      fontPairing: 'minimal',
      buyNow: {
        label: 'Buy Now',
        style: 'solid',
        width: 'full',
        disabled: false,
      },
    },
    templates: {
      home: {
        sections: [
          {
            id: 'hero_1',
            type: 'hero',
            enabled: true,
            settings: {
              headline: 'Welcome to store',
              subtext: 'Shop our collection',
              ctaLabel: 'Shop Now',
              imageUrl: null,
            },
          },
          {
            id: 'featured_1',
            type: 'featured-products',
            enabled: true,
            settings: {
              title: 'Featured Products',
              productSource: {mode: 'dynamic', rule: 'best_selling', limit: 8},
            },
          },
        ],
      },
      collection: {
        sections: [],
      },
      product: {
        sections: [
          {
            id: 'info_1',
            type: 'product-info',
            enabled: true,
            settings: {showPrice: true},
          },
        ],
      },
    },
  };
}

describe('Tasks 3-23: AI Store Builder & Media Suite', () => {
  it('Task 4-5: validates media mime types and binary header signatures', () => {
    assert.strictEqual(isAllowedMimeType('image/jpeg'), true);
    assert.strictEqual(isAllowedMimeType('image/png'), true);
    assert.strictEqual(isAllowedMimeType('image/webp'), true);
    assert.strictEqual(isAllowedMimeType('image/gif'), false);
    assert.strictEqual(isAllowedMimeType('image/svg+xml'), false);

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 ...
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    assert.strictEqual(validateMediaFileHeader(pngBytes), 'image/png');

    // JPEG magic bytes: 0xFF 0xD8 0xFF ...
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.strictEqual(validateMediaFileHeader(jpegBytes), 'image/jpeg');

    assert.strictEqual(MAX_MEDIA_BYTE_SIZE, 10 * 1024 * 1024);
  });

  it('Task 7-8: Provider capabilities & API key masking', () => {
    assert.ok(AI_PROVIDERS.gemini);
    assert.ok(AI_PROVIDERS.openai);
    assert.ok(AI_PROVIDERS.anthropic);

    assert.strictEqual(supportsCapability('gemini', 'vision'), true);
    assert.strictEqual(supportsCapability('gemini', 'structured_output'), true);

    assert.strictEqual(maskApiKey('AIzaSy1234567890Key'), 'AIza••••••••0Key');
    assert.strictEqual(maskApiKey(''), '');
  });

  it('Task 10-11: Validates and executes typed AI store commands', () => {
    const doc = mockStoreDesignDoc();

    const commands: AiStoreCommand[] = [
      {type: 'set_theme', themeId: 'soft-elegant'},
      {
        type: 'update_section',
        template: 'home',
        sectionId: 'hero_1',
        patch: {headline: 'AI Generated Headline'},
      },
      {
        type: 'attach_media',
        template: 'home',
        sectionId: 'hero_1',
        field: 'imageUrl',
        mediaUrl: 'https://example.com/hero.jpg',
      },
    ];

    const result = validateAndExecuteAiCommands(doc, commands);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.appliedCommandsCount, 3);
    assert.strictEqual(result.doc.themeId, 'soft-elegant');

    const heroSection = result.doc.templates.home.sections.find((s) => s.id === 'hero_1');
    assert.strictEqual((heroSection?.settings as any).headline, 'AI Generated Headline');
    assert.strictEqual((heroSection?.settings as any).imageUrl, 'https://example.com/hero.jpg');
  });

  it('Task 10-11 Commerce Invariant: Rejects disabling or removing Buy Now / product-info', () => {
    const doc = mockStoreDesignDoc();

    // Command attempting to disable product-info section
    const disableCmd: AiStoreCommand[] = [
      {
        type: 'set_section_enabled',
        template: 'product',
        sectionId: 'info_1',
        enabled: false,
      },
    ];

    const disableResult = validateAndExecuteAiCommands(doc, disableCmd);
    assert.strictEqual(disableResult.ok, false);
    assert.strictEqual(disableResult.errors[0]?.code, 'PROTECTED_COMMERCE_INVARIANT');

    // Command attempting to remove product-info section
    const removeCmd: AiStoreCommand[] = [
      {
        type: 'remove_section',
        template: 'product',
        sectionId: 'info_1',
      },
    ];

    const removeResult = validateAndExecuteAiCommands(doc, removeCmd);
    assert.strictEqual(removeResult.ok, false);
    assert.strictEqual(removeResult.errors[0]?.code, 'PROTECTED_COMMERCE_INVARIANT');
  });

  it('Task 12: Manages Undo and Redo document history stack', () => {
    const doc1 = mockStoreDesignDoc();
    let history = createDocumentHistory(doc1);

    const doc2 = JSON.parse(JSON.stringify(doc1));
    doc2.themeId = 'soft-elegant';

    history = pushHistory(history, doc2);
    assert.strictEqual(history.past.length, 1);
    assert.strictEqual(history.present.themeId, 'soft-elegant');

    // Undo
    const undoRes = undoHistory(history);
    assert.ok(undoRes.doc);
    assert.strictEqual(undoRes.doc.themeId, 'clean-minimal');

    // Redo
    const redoRes = redoHistory(undoRes.history);
    assert.ok(redoRes.doc);
    assert.strictEqual(redoRes.doc.themeId, 'soft-elegant');
  });
});

import type {AiStoreCommand} from './storeDesign/aiCommands';
import type {StoreDesignDocument} from './storeDesign/types';
import type {AiProviderId} from './aiProvider';

export interface AiProposal {
  id: string;
  userPrompt: string;
  summary: string;
  commands: AiStoreCommand[];
  createdAt: string;
  isDestructive?: boolean;
}

export async function generateStoreEditProposal({
  message,
  currentDoc,
  mediaUrls = [],
  provider: _provider = 'gemini',
}: {
  message: string;
  currentDoc: StoreDesignDocument;
  mediaUrls?: string[];
  provider?: AiProviderId;
}): Promise<AiProposal> {
  const prompt = message.trim().toLowerCase();
  const commands: AiStoreCommand[] = [];
  const summaries: string[] = [];

  // 1. Color / Theme intent matching
  if (prompt.includes('color') || prompt.includes('theme') || prompt.includes('palette')) {
    if (prompt.includes('boutique') || prompt.includes('rose') || prompt.includes('pink') || prompt.includes('soft') || prompt.includes('elegant')) {
      commands.push({type: 'set_theme', themeId: 'soft-elegant'});
      summaries.push('Switched theme to Soft & Elegant');
    } else if (prompt.includes('minimal') || prompt.includes('modern') || prompt.includes('clean')) {
      commands.push({type: 'set_theme', themeId: 'clean-minimal'});
      summaries.push('Switched theme to Clean & Minimal');
    } else if (prompt.includes('bold') || prompt.includes('street') || prompt.includes('vibrant')) {
      commands.push({type: 'set_theme', themeId: 'street-bold'});
      summaries.push('Switched theme to Street & Bold');
    } else if (prompt.includes('catalog') || prompt.includes('grid')) {
      commands.push({type: 'set_theme', themeId: 'grid-catalog'});
      summaries.push('Switched theme to Grid & Catalog');
    } else if (prompt.includes('dark') || prompt.includes('luxury') || prompt.includes('tech')) {
      commands.push({type: 'set_theme', themeId: 'dark-modern'});
      summaries.push('Switched theme to Dark Modern');
    } else {
      // Accent color patch
      const hexMatch = message.match(/#[0-9a-fA-F]{6}/);
      if (hexMatch) {
        commands.push({
          type: 'set_global_settings',
          patch: {accentColor: hexMatch[0]},
        });
        summaries.push(`Updated primary accent color to ${hexMatch[0]}`);
      }
    }
  }

  // 2. Hero Image attachment intent
  const homeHero = currentDoc.templates.home.sections.find((s) => s.type === 'hero');
  if (mediaUrls.length > 0 && homeHero) {
    if (prompt.includes('hero') || prompt.includes('banner') || prompt.includes('cover') || mediaUrls.length > 0) {
      commands.push({
        type: 'attach_media',
        template: 'home',
        sectionId: homeHero.id,
        field: 'imageUrl',
        mediaUrl: mediaUrls[0],
      });
      summaries.push(`Attached new image to Hero section`);
    }
  }

  // 3. Section text or headline changes
  if (prompt.includes('hero') || prompt.includes('headline') || prompt.includes('title')) {
    if (homeHero && (prompt.includes('headline') || prompt.includes('text') || prompt.includes('title') || prompt.includes('welcome'))) {
      const match = message.match(/["'“]([^"'”]+)["'”]/);
      const newHeadline = match ? match[1] : message.replace(/change|set|update|hero|headline|to/gi, '').trim();
      if (newHeadline && newHeadline.length > 2) {
        commands.push({
          type: 'update_section',
          template: 'home',
          sectionId: homeHero.id,
          patch: {headline: newHeadline},
        });
        summaries.push(`Updated Hero headline to "${newHeadline}"`);
      }
    }
  }

  // 4. Add section intent
  if (prompt.includes('add') || prompt.includes('insert') || prompt.includes('create')) {
    if (prompt.includes('announcement')) {
      commands.push({type: 'add_section', template: 'home', sectionType: 'announcement'});
      summaries.push('Added Announcement Bar section to Home page');
    } else if (prompt.includes('story') || prompt.includes('about') || prompt.includes('image text')) {
      commands.push({type: 'add_section', template: 'home', sectionType: 'image-text'});
      summaries.push('Added Image & Text story section to Home page');
    } else if (prompt.includes('banner') || prompt.includes('promo')) {
      commands.push({type: 'add_section', template: 'home', sectionType: 'promotion-banner'});
      summaries.push('Added Promotion Banner section to Home page');
    } else if (prompt.includes('categories')) {
      commands.push({type: 'add_section', template: 'home', sectionType: 'categories'});
      summaries.push('Added Categories section to Home page');
    }
  }

  // Fallback: If no commands parsed, provide a fallback hero headline update or theme update
  if (commands.length === 0) {
    if (homeHero) {
      commands.push({
        type: 'update_section',
        template: 'home',
        sectionId: homeHero.id,
        patch: {subtext: message},
      });
      summaries.push(`Updated Hero subtext to match prompt: "${message}"`);
    } else {
      commands.push({
        type: 'set_theme',
        themeId: 'soft-elegant',
      });
      summaries.push('Applied design layout optimizations');
    }
  }

  const isDestructive = commands.some((c) => c.type === 'remove_section');

  return {
    id: `proposal_${Date.now()}`,
    userPrompt: message,
    summary: summaries.join('. ') + '.',
    commands,
    createdAt: new Date().toISOString(),
    isDestructive,
  };
}

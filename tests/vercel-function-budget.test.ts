import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, {withFileTypes: true});
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full.split(path.sep).join('/'));
  }
  return files;
}

test('Vercel Hobby function discovery stays within the 12-function deployment budget', async () => {
  const files = await walk('api');
  const discovered = files.filter((file) => {
    if (!/\.(?:ts|js)$/.test(file)) return false;
    const relative = file.slice('api/'.length);
    return relative.split('/').every((segment) => !segment.startsWith('_'));
  });

  assert.ok(
    discovered.length <= 12,
    `Vercel function budget exceeded: ${discovered.length} discovered entries: ${discovered.join(', ')}`,
  );
  assert.deepEqual(discovered.sort(), [
    'api/checkout.ts',
    'api/ai.ts',
    'api/health.ts',
    'api/mcp.ts',
    'api/notifications.ts',
    'api/storefront-config.ts',
    'api/storefront-orders.ts',
    'api/storefront.ts',
    'api/storefront/[...path].ts',
    'api/superadmin.ts',
    'api/version.ts',
  ].sort());
});

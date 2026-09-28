// Native Node TypeScript tests execute source files directly, while Vercel
// compiles API entrypoints to JavaScript. Production source therefore uses
// explicit .js ESM specifiers. In tests only, if such a local .js target does
// not exist, resolve the corresponding .ts source file.
import {registerHooks} from 'node:module';
import {existsSync, statSync} from 'node:fs';
import {URL, fileURLToPath} from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      let target = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
      const path = fileURLToPath(target);
      if (existsSync(path) && statSync(path).isDirectory()) target = new URL(`${target.href.replace(/\/$/, '')}/index.ts`);
      else if (!existsSync(path) && existsSync(`${path}.ts`)) target = new URL(`${target.href}.ts`);
      return nextResolve(target.href, context);
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const localJs =
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        specifier.endsWith('.js');

      if (!localJs) throw error;

      const tsSpecifier = specifier.slice(0, -3) + '.ts';
      return nextResolve(tsSpecifier, context);
    }
  },
});

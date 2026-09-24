// Native Node TypeScript tests execute source files directly, while Vercel
// compiles API entrypoints to JavaScript. Production source therefore uses
// explicit .js ESM specifiers. In tests only, if such a local .js target does
// not exist, resolve the corresponding .ts source file.
import {registerHooks} from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
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

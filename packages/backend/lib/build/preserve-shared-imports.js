/**
 * tsc-alias replacer that preserves #shared/* imports.
 *
 * tsc-alias resolves ALL tsconfig path aliases to relative paths.
 * However, #shared/* must remain as subpath imports so that Node.js
 * resolves them via the package.json "imports" field at runtime.
 *
 * This replacer runs AFTER tsc-alias and reverts any #shared/* → relative
 * path transformations back to their original #shared/* form, keeping
 * the .js extension that tsc-alias added via --resolve-full-paths.
 *
 * @see https://github.com/justkey007/tsc-alias#custom-replacers
 */

/** @param {import('tsc-alias').ReplacerOptions} options */
export default function preserveSharedImports({ orig }) {
  // tsc-alias resolves #shared/* to relative paths like ../../../shared/foo.js
  // Revert to #shared/* for Node.js ESM subpath import resolution
  return orig.replace(
    /from\s+["'](\.\.\/)+shared\/(.+?)["']/g,
    (match, _dots, modulePath) => {
      const withExt = modulePath.endsWith(".js") ? modulePath : `${modulePath}.js`;
      return `from "#shared/${withExt}"`;
    },
  );
}

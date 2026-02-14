import fs from 'node:fs'
import path from 'node:path'
import { build, type Plugin, type UserConfig } from 'vite'

type Options = {
  i18nDir?: string
  defaultLocale?: string
  outDirBase?: string
  i18nAlias?: string
}

const CHILD_BUILD_FLAG = '__VITE_MULTI_I18N_CHILD__'

function isDir(filePath: string) {
  try {
    return fs.statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function listLocales(i18nAbsDir: string): string[] {
  if (!isDir(i18nAbsDir)) return []

  return fs
    .readdirSync(i18nAbsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^[a-z]{2}(-[A-Z]{2})?$/.test(name) || /^[a-z]{2,3}$/.test(name))
}

export function multiI18nBuildPlugin(opts: Options = {}): Plugin {
  const i18nDir = opts.i18nDir ?? 'i18n'
  const defaultLocale = opts.defaultLocale ?? 'en'
  const outDirBase = opts.outDirBase ?? 'dist'
  const i18nAlias = opts.i18nAlias ?? 'i18n'

  let rootAbs = process.cwd()

  return {
    name: 'vite:multi-i18n-build',
    apply: 'build',

    config(config, env) {
      if (env.command !== 'build') return
      if (process.env[CHILD_BUILD_FLAG] === '1') return

      if (config.root) rootAbs = path.resolve(process.cwd(), config.root)

      const defaultLocalePath = path.resolve(rootAbs, i18nDir, defaultLocale)

      const merged: UserConfig = {
        build: {
          outDir: path.posix.join(outDirBase, defaultLocale),
          emptyOutDir: true,
        },
        resolve: {
          alias: {
            [i18nAlias]: defaultLocalePath,
          },
        },
        define: {
          __LOCALE__: JSON.stringify(defaultLocale),
        },
      }

      return merged
    },

    async closeBundle() {
      if (process.env[CHILD_BUILD_FLAG] === '1') return

      const i18nAbsDir = path.resolve(rootAbs, i18nDir)
      const locales = listLocales(i18nAbsDir)

      if (locales.length === 0) {
        this.warn(`[multi-i18n] No languages found in ${i18nAbsDir}`)
        return
      }

      const localesToBuild = locales.filter((locale) => locale !== defaultLocale)
      if (localesToBuild.length === 0) return

      for (const locale of localesToBuild) {
        const localePath = path.resolve(i18nAbsDir, locale)

        process.env[CHILD_BUILD_FLAG] = '1'
        process.env.__LOCALE__ = locale

        await build({
          root: rootAbs,
          logLevel: 'info',
          define: {
            __LOCALE__: JSON.stringify(locale),
          },
          resolve: {
            alias: {
              [i18nAlias]: localePath,
            },
          },
          build: {
            outDir: path.posix.join(outDirBase, locale),
            emptyOutDir: true,
          },
        })

        delete process.env[CHILD_BUILD_FLAG]
      }
    },
  }
}

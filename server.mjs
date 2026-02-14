import fs from 'node:fs'
import path from 'node:path'
import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 3000)
const distRoot = path.resolve(process.cwd(), 'dist')
const fallbackLocale = 'en'

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function sendLocalizedHtml(res, filePath, locale) {
  try {
    const html = fs.readFileSync(filePath, 'utf-8')
    const updatedHtml = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${locale}"`)
    res.setHeader('Content-Language', locale)
    res.type('html').send(updatedHtml)
    return true
  } catch {
    return false
  }
}

function getSupportedLocales() {
  if (!isDirectory(distRoot)) return [fallbackLocale]

  const locales = fs
    .readdirSync(distRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((locale) => fileExists(path.join(distRoot, locale, 'index.html')))

  if (locales.length === 0) return [fallbackLocale]
  if (!locales.includes(fallbackLocale)) locales.push(fallbackLocale)

  return Array.from(new Set(locales))
}

function parseAcceptLanguage(value) {
  if (!value) return []

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [rawCode, ...params] = part.split(';').map((token) => token.trim())
      const qParam = params.find((token) => token.startsWith('q='))
      const qValue = qParam ? Number(qParam.slice(2)) : 1

      return {
        code: rawCode.toLowerCase(),
        quality: Number.isFinite(qValue) ? qValue : 0,
      }
    })
    .filter((item) => item.code)
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.code)
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {}

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separatorIndex = pair.indexOf('=')
      if (separatorIndex <= 0) return acc

      const key = pair.slice(0, separatorIndex).trim()
      const value = pair.slice(separatorIndex + 1).trim()
      if (!key) return acc

      acc[key] = decodeURIComponent(value)
      return acc
    }, {})
}

function resolveLocale(cookieHeader, acceptLanguage, supportedLocales) {
  const normalizedSet = new Set(supportedLocales.map((locale) => locale.toLowerCase()))

  const cookies = parseCookies(cookieHeader)
  const preferred = cookies.preferred_locale?.toLowerCase()
  if (preferred && normalizedSet.has(preferred)) {
    return { locale: preferred, source: 'cookie' }
  }

  const ranked = parseAcceptLanguage(acceptLanguage)

  for (const requested of ranked) {
    if (normalizedSet.has(requested)) return { locale: requested, source: 'accept-language' }

    const base = requested.split('-')[0]
    if (normalizedSet.has(base)) return { locale: base, source: 'accept-language' }
  }

  return { locale: fallbackLocale, source: 'fallback' }
}

function sanitizeRequestPath(requestPath) {
  const clean = requestPath === '/' ? '/index.html' : requestPath
  const normalized = path.posix.normalize(clean)

  if (normalized.startsWith('../') || normalized.includes('/../')) {
    return null
  }

  return normalized
}

const supportedLocales = getSupportedLocales()

app.use((req, res, next) => {
  res.setHeader('Vary', 'Accept-Language, Cookie')
  const { locale, source } = resolveLocale(
    req.headers.cookie,
    req.headers['accept-language'],
    supportedLocales,
  )
  res.locals.locale = locale
  res.locals.localeSource = source
  res.setHeader('X-Locale-Source', source)
  next()
})

app.use((req, res) => {
  const safePath = sanitizeRequestPath(req.path)
  if (!safePath) {
    res.status(400).send('Bad request')
    return
  }

  const locale = res.locals.locale
  const localeFile = path.join(distRoot, locale, safePath)
  const fallbackFile = path.join(distRoot, fallbackLocale, safePath)
  const isHtmlRequest = safePath.endsWith('.html')

  if (fileExists(localeFile)) {
    res.setHeader('Content-Language', locale)
    if (isHtmlRequest) {
      if (sendLocalizedHtml(res, localeFile, locale)) return
      res.status(500).send('Server error')
      return
    }

    res.sendFile(localeFile)
    return
  }

  if (fileExists(fallbackFile)) {
    res.setHeader('Content-Language', fallbackLocale)
    if (isHtmlRequest) {
      if (sendLocalizedHtml(res, fallbackFile, fallbackLocale)) return
      res.status(500).send('Server error')
      return
    }

    res.sendFile(fallbackFile)
    return
  }

  if (!path.extname(safePath)) {
    const localeIndex = path.join(distRoot, locale, 'index.html')
    const fallbackIndex = path.join(distRoot, fallbackLocale, 'index.html')

    if (fileExists(localeIndex)) {
      if (sendLocalizedHtml(res, localeIndex, locale)) return
      res.status(500).send('Server error')
      return
    }

    if (fileExists(fallbackIndex)) {
      if (sendLocalizedHtml(res, fallbackIndex, fallbackLocale)) return
      res.status(500).send('Server error')
      return
    }
  }

  res.status(404).send('Not found')
})

app.listen(port, () => {
  const localeList = supportedLocales.join(', ')
  console.log(`[i18n-server] Listening on http://localhost:${port}`)
  console.log(`[i18n-server] Locales: ${localeList}`)
})

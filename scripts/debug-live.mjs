/**
 * Abre uma URL num Chromium real e reporta erros de runtime que `curl` nunca
 * pega (curl so baixa HTML/JS bruto, nao executa nada). Foi assim que achamos
 * o incidente de 14/08/2026: todas as rotas respondiam 200 no curl, mas a
 * pagina ficava em branco porque supabase.ts lançava um erro no boot (env var
 * vazia no build da Vercel) e nao havia ErrorBoundary pra segurar o crash.
 *
 * Uso: node scripts/debug-live.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'https://agendamento.drmanuelataide.com.br/'

const browser = await chromium.launch()
const page = await browser.newPage()

const consoleMessages = []
const pageErrors = []
const failedRequests = []

page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => pageErrors.push(err.stack || err.message))
page.on('requestfailed', (req) =>
  failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`),
)
page.on('response', (res) => {
  if (res.url().includes('/assets/') && res.status() >= 400) {
    failedRequests.push(`${res.status()} ${res.url()}`)
  }
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(2000)

const bodyText = await page.evaluate(() => document.body.innerText)
const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? 'NO #root')
const mainJsContentType = await page.evaluate(async () => {
  const script = document.querySelector('script[type="module"]')
  if (!script) return 'NO SCRIPT TAG FOUND'
  try {
    const res = await fetch(script.src)
    return `${script.src} -> Content-Type: ${res.headers.get('content-type')}`
  } catch (e) {
    return `fetch failed: ${e.message}`
  }
})

await page.screenshot({ path: 'scripts/debug-live-screenshot.png', fullPage: true })

console.log('=== URL ===')
console.log(url)
console.log('=== BODY TEXT (visible) ===')
console.log(JSON.stringify(bodyText))
console.log('=== #root innerHTML (first 500 chars) ===')
console.log(rootHtml.slice(0, 500))
console.log('=== MAIN SCRIPT CONTENT-TYPE ===')
console.log(mainJsContentType)
console.log('=== CONSOLE MESSAGES ===')
consoleMessages.forEach((m) => console.log(m))
console.log('=== PAGE ERRORS (uncaught exceptions) ===')
pageErrors.forEach((e) => console.log(e))
console.log('=== FAILED / BAD REQUESTS ===')
failedRequests.forEach((f) => console.log(f))

await browser.close()

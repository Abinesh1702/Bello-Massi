// Node resolve hook: allow the app's extensionless relative imports (as Vite does).
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context) } catch (e) {
    if ((specifier.startsWith('.') || specifier.includes('/plugin/')) && !/\.[cm]?jsx?$/.test(specifier)) {
      for (const ext of ['.js', '.jsx', '/index.js']) { try { return await next(specifier + ext, context) } catch { /* try next */ } }
    }
    throw e
  }
}

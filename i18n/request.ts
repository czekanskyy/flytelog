import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

const SUPPORTED_LOCALES = ["en", "pl"] as const
const DEFAULT_LOCALE = "en"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const stored = cookieStore.get("locale")?.value
  const locale = SUPPORTED_LOCALES.includes(stored as (typeof SUPPORTED_LOCALES)[number])
    ? stored!
    : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

// Central brand configuration. Everything user-facing reads from here so the
// product can be rebranded via env vars without touching source. Defaults keep
// the current "NaijaRental" identity when no env override is set.
//
// NEXT_PUBLIC_* vars are inlined at build time, so changing them on the host
// requires a rebuild/redeploy.

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "NaijaRental"

export const BRAND_DOMAIN = process.env.NEXT_PUBLIC_BRAND_DOMAIN || "naijarental.com"

export const BRAND_URL =
  process.env.NEXT_PUBLIC_SITE_URL || `https://${BRAND_DOMAIN}`

export const BRAND_LEGAL_NAME =
  process.env.NEXT_PUBLIC_BRAND_LEGAL_NAME || `${BRAND_NAME} Technologies Ltd`

export const brandEmail = (mailbox: string): string => `${mailbox}@${BRAND_DOMAIN}`

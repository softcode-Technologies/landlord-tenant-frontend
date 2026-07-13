// Central brand configuration. Everything user-facing reads from here so the
// product can be rebranded via env vars without touching source.
//
// NEXT_PUBLIC_* vars are inlined at build time, so changing them on the host
// requires a rebuild/redeploy.

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Krib"

export const BRAND_DOMAIN = process.env.NEXT_PUBLIC_BRAND_DOMAIN || "kribhq.com"

// Brand logo image. Empty by default → the app renders the built-in Building2
// icon mark (via the <BrandLogo /> component). To switch to a real uploaded logo
// everywhere at once, set NEXT_PUBLIC_BRAND_LOGO_URL to its URL/path (e.g.
// "/brand/logo.svg" after dropping the file in /public, or a remote CDN URL).
// No other code changes needed — every logo across the app reads from here.
export const BRAND_LOGO_URL = process.env.NEXT_PUBLIC_BRAND_LOGO_URL || ""

export const BRAND_URL =
  process.env.NEXT_PUBLIC_SITE_URL || `https://${BRAND_DOMAIN}`

export const BRAND_LEGAL_NAME =
  process.env.NEXT_PUBLIC_BRAND_LEGAL_NAME || `${BRAND_NAME} Technologies Ltd`

export const brandEmail = (mailbox: string): string => `${mailbox}@${BRAND_DOMAIN}`

// Mobile apps aren't live yet. Set NEXT_PUBLIC_SHOW_APP_DOWNLOAD=true to reveal
// the "Your rentals, in your pocket" download section (and the matching FAQ)
// once the iOS/Android apps ship. Defaults to hidden.
export const SHOW_APP_DOWNLOAD =
  process.env.NEXT_PUBLIC_SHOW_APP_DOWNLOAD === "true"

// App store URLs for the download badges. Set these to the real App Store /
// Play Store listings when the apps ship. Default "#" (no-op) until then.
export const IOS_APP_URL = process.env.NEXT_PUBLIC_IOS_APP_URL || "#"
export const ANDROID_APP_URL = process.env.NEXT_PUBLIC_ANDROID_APP_URL || "#"

// Refer & Earn isn't ready for tenants yet. Set NEXT_PUBLIC_REFER=true to unlock
// it (removes the padlock + reveals the feature). Defaults to locked ("coming
// soon") — the code stays intact, just gated.
export const REFERRALS_ENABLED = process.env.NEXT_PUBLIC_REFER === "true"

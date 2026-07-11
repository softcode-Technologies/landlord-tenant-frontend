// Cloudflare (OpenNext) build/deploy wrapper.
//
// Next.js 16's `src/proxy.ts` is forced onto the Node runtime, which the
// OpenNext Cloudflare adapter can't run yet. So for the Cloudflare build only,
// we temporarily move proxy.ts aside (route protection is handled instead by
// <CloudflareRouteGuard>, activated via NEXT_PUBLIC_DEPLOY_TARGET=cloudflare),
// then ALWAYS restore it — even if the build fails — so the Vercel path that
// relies on proxy.ts is never left broken.
//
// Usage:
//   node scripts/deploy-cloudflare.mjs            # build only (validate)
//   node scripts/deploy-cloudflare.mjs --deploy   # build + deploy (needs `wrangler login`)
import { execSync } from "node:child_process"
import { existsSync, renameSync } from "node:fs"

const PROXY = "src/proxy.ts"
const HIDDEN = "src/proxy.ts.vercel-only"
const doDeploy = process.argv.includes("--deploy")

function run(cmd) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_DEPLOY_TARGET: "cloudflare" },
  })
}

let moved = false
try {
  if (existsSync(PROXY)) {
    renameSync(PROXY, HIDDEN)
    moved = true
    console.log(`\n→ Hid ${PROXY} for the Cloudflare build (Vercel copy preserved).`)
  }
  run("pnpm exec opennextjs-cloudflare build")
  if (doDeploy) {
    console.log("\n→ Deploying to Cloudflare Workers…")
    run("pnpm exec opennextjs-cloudflare deploy")
  }
} finally {
  if (moved) {
    renameSync(HIDDEN, PROXY)
    console.log(`→ Restored ${PROXY} (Vercel path untouched).\n`)
  }
}

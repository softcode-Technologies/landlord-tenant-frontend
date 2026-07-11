import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal OpenNext config for Cloudflare Workers.
// SSR + dynamic routes work out of the box on the Node.js runtime.
// Later, to enable ISR/on-demand revalidation caching, add an R2 incremental
// cache here (see https://opennext.js.org/cloudflare/caching).
export default defineCloudflareConfig({});

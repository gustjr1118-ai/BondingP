# Cloudflare Workers deployment

Connect GitHub repository `gustjr1118-ai/BondingP` in Workers & Pages, using Workers (not a static Pages export).

- Worker name: `bondingp`
- Build command: `pnpm cf:build`
- Deploy command: `pnpm cf:deploy`
- Root: repository root
- Node.js: 22 or newer

Register runtime Secrets: `GEMINI_API_KEY`, `APP_PASSWORD`, `SESSION_SECRET` (32+ characters). Never commit their values. `GEMINI_MODEL` is configured in wrangler.jsonc. Do not set CLOUD_RUN_BUILD.

The OpenNext adapter retains the existing Next.js 15 server authentication and API routes. No database/cache persistence is configured. Verify build limits and CPU usage before changing any billing plan.

After deployment, check unauthenticated redirect, password login, bilingual generation for both modes, clarification, copying, and mobile layout. Keep Vercel active until these checks pass. The Cloudflare URL depends on the account's workers.dev subdomain.

Configuration is prepared; Cloudflare build and runtime validation are still required.

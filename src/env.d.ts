declare namespace Cloudflare {
  interface Env {
    /** Set via `.dev.vars` locally or `wrangler secret put SESSION_SECRET` in production */
    SESSION_SECRET: string;
  }
}

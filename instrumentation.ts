export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    console.info('[instrumentation] SENTRY_DSN is set. Install @sentry/nextjs to enable full error monitoring.');
  }
}

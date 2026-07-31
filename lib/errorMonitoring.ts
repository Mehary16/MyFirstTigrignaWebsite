export function captureServerError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const payload = {
    message,
    context,
    timestamp: new Date().toISOString()
  };

  console.error('[error-monitoring]', payload);

  if (process.env.SENTRY_DSN) {
    // Hook for Sentry or another provider when @sentry/nextjs is installed.
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(error, { extra: context });
  }
}

export function captureClientError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[client-error]', { message, context });
}

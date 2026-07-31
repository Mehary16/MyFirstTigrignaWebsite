import { NextResponse } from 'next/server';
import { checkRateLimit, getRequestRateLimitKey, type RateLimitResult } from './rateLimit';

type EnforceRateLimitOptions = {
  request: Request;
  scope: string;
  userId?: string | null;
  limit?: number;
  windowMs?: number;
};

export function enforceRateLimit({
  request,
  scope,
  userId,
  limit = 20,
  windowMs = 60_000
}: EnforceRateLimitOptions): RateLimitResult {
  const key = getRequestRateLimitKey(request, scope, userId);
  return checkRateLimit(key, limit, windowMs);
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: 'Too many requests. Please wait and try again.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds)
      }
    }
  );
}

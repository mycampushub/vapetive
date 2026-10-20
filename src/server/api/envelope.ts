/**
 * VAPETIVE — API response envelope.
 *
 * Success: { data, meta? }   Error: { error: { code, message, fields?, requestId? } }
 * Every handler returns through these helpers so clients can unwrap uniformly.
 */

import { NextResponse } from "next/server";

export interface Meta {
  pagination?: { page: number; pageSize: number; total: number; hasMore: boolean };
  [key: string]: unknown;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
}

export function ok<T>(data: T, meta?: Meta, init?: ResponseInit): NextResponse {
  return NextResponse.json(meta ? { data, meta } : { data }, init);
}

export function created<T>(data: T, meta?: Meta): NextResponse {
  return ok(data, meta, { status: 201 });
}

export function fail(
  status: number,
  code: string,
  message: string,
  extra?: { fields?: Record<string, string>; requestId?: string; headers?: Record<string, string> }
): NextResponse {
  const body: ApiErrorBody = {
    error: { code, message, ...(extra?.fields ? { fields: extra.fields } : {}) },
  };
  return NextResponse.json(body, {
    status,
    headers: extra?.headers,
  });
}

/** Common error codes. */
export const ErrorCode = {
  VALIDATION_FAILED: "validation_failed",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  UNAVAILABLE: "unavailable",
  INTERNAL: "internal_error",
} as const;

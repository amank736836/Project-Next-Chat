import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function withCors(json, init = {}) {
  const headers = new Headers(init.headers || {});
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return NextResponse.json(json, { ...init, headers });
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function jsonWithCors(json, init = {}) {
  return withCors(json, init);
}

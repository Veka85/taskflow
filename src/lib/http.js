import { NextResponse } from "next/server";

export function ok(data = {}, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ message, ...extra }, { status });
}

export async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

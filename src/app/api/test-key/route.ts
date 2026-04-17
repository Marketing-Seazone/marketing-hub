import { NextResponse } from 'next/server';
export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    exists: !!key,
    length: key?.length,
    starts_with: key?.substring(0, 10),
  });
}
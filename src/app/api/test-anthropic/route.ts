import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Diga ola em portugues.' }],
    });
    return NextResponse.json({ ok: true, text: response.content[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, status: err.status });
  }
}
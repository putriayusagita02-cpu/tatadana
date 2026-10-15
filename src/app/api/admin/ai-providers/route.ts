import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory runtime state for providers (and Supabase sync)
let aiSettings = {
  mode: 'parallel_failover' as 'single' | 'parallel_failover',
  primaryProvider: 'gemini',
  fallbackProvider: 'openai',
  providers: [
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'gemini-2.0-flash',
      isActive: true,
      apiKeyMasked: 'AIzaSy...Ab92',
      multimodal: true,
      latencyMs: 340,
    },
    {
      id: 'openai',
      name: 'OpenAI GPT',
      model: 'gpt-4o-mini',
      isActive: true,
      apiKeyMasked: 'sk-proj...7xQ1',
      multimodal: true,
      latencyMs: 520,
    },
    {
      id: 'deepseek',
      name: 'DeepSeek AI',
      model: 'deepseek-chat',
      isActive: false,
      apiKeyMasked: 'sk-ds...99p0',
      multimodal: false,
      latencyMs: 410,
    },
  ],
};

export async function GET() {
  return NextResponse.json({ success: true, settings: aiSettings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.mode) aiSettings.mode = body.mode;
    if (body.primaryProvider) aiSettings.primaryProvider = body.primaryProvider;
    if (body.fallbackProvider) aiSettings.fallbackProvider = body.fallbackProvider;
    if (body.providers) aiSettings.providers = body.providers;

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi Multi-Provider AI berhasil diperbarui.',
      settings: aiSettings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal update provider' }, { status: 500 });
  }
}

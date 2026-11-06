import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } },
  });

  const probe = new URL(request.url).searchParams.get('probe');
  if (probe) {
    const models = probe.split(',').map((m) => m.trim()).filter(Boolean);
    const results = [];
    for (const model of models) {
      const started = Date.now();
      try {
        const res = await ai.models.generateContent({
          model,
          contents: 'Reply with the single word OK.',
        });
        results.push({
          model,
          ok: true,
          ms: Date.now() - started,
          text: (res.text || '').slice(0, 40),
        });
      } catch (err: any) {
        results.push({
          model,
          ok: false,
          ms: Date.now() - started,
          error: err?.message || String(err),
        });
      }
    }
    return Response.json({ results });
  }

  const names: string[] = [];
  try {
    const pager = await ai.models.list();
    for await (const model of pager) {
      names.push(model.name || '');
    }
  } catch (err: any) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
  return Response.json({ count: names.length, models: names });
}

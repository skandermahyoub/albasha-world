import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GEMINI_MODEL = 'gemini-2.0-flash';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prompt = body.prompt;
    if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    const data = await resp.json().catch(() => ({}));
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

    if (text) return Response.json({ response: text });
    return Response.json({ response: 'عذراً، تعذّر الرد الآن. حاول مرة أخرى لاحقاً.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
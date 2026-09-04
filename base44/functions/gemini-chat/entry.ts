import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_PROMPT_CHARS = 12000;
const HOURLY_LIMIT = 30;
const DAILY_LIMIT = 120;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });
    if (prompt.length > MAX_PROMPT_CHARS) return Response.json({ error: 'الطلب أطول من الحد المسموح' }, { status: 400 });

    const usage = await base44.asServiceRole.entities.AIUsage.filter({ user_email: user.email, feature: 'smart_chat' }, '-created_date', 200).catch(() => []);
    const now = Date.now();
    const hourAgo = now - 3600_000;
    const dayAgo = now - 86_400_000;
    const successful = usage.filter((u: any) => u.status === 'success');
    const hourly = successful.filter((u: any) => new Date(u.created_date || 0).getTime() >= hourAgo).length;
    const daily = successful.filter((u: any) => new Date(u.created_date || 0).getTime() >= dayAgo).length;
    if (hourly >= HOURLY_LIMIT || daily >= DAILY_LIMIT) {
      return Response.json({ error: 'تم بلوغ الحد المؤقت لاستخدام المساعد الذكي. حاول لاحقاً.' }, { status: 429 });
    }

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
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    if (text) {
      await base44.asServiceRole.entities.AIUsage.create({ user_email: user.email, feature: 'smart_chat', prompt_chars: prompt.length, response_chars: text.length, status: 'success' }).catch(() => {});
      return Response.json({ response: text });
    }
    await base44.asServiceRole.entities.AIUsage.create({ user_email: user.email, feature: 'smart_chat', prompt_chars: prompt.length, response_chars: 0, status: 'failed' }).catch(() => {});
    return Response.json({ response: 'عذراً، تعذّر الرد الآن. حاول مرة أخرى لاحقاً.' });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تشغيل المساعد' }, { status: 500 });
  }
});

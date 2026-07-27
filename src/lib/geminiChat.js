import { base44 } from '@/api/base44Client';

/**
 * Calls the Gemini chat model via a secure backend function.
 * The API key is kept server-side and never exposed to the client.
 */
export async function geminiChat(prompt) {
  try {
    const res = await base44.functions.invoke('gemini-chat', { prompt });
    if (res?.data?.response) return res.data.response;
    return 'عذراً، تعذّر الرد الآن. حاول مرة أخرى لاحقاً.';
  } catch (e) {
    return 'عذراً، حدث خطأ في الاتصال بالمساعد. حاول مرة أخرى.';
  }
}
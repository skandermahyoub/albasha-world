import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { geminiChat } from '@/lib/geminiChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function AIManagerChat({ contextSummary }) {
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || 'متجري';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'أهلاً بك، أنا مساعدك الإداري الذكي. اسألني أي شيء عن أرباح متجرك، مخزونك، أو نفقاتك، وسأجيبك بناءً على بيانات متجرك الفعلية.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-6).map(m => `${m.role === 'user' ? 'المدير' : 'المساعد'}: ${m.content}`).join('\n');
    const prompt = `أنت مساعد ذكي متخصص في إدارة متجر تجاري صغير اسمه "${storeName}". لديك بيانات حقيقية عن المتجر:\n\n${contextSummary}\n\nسجل المحادثة السابق:\n${history}\n\nأجب على آخر سؤال من المدير بشكل مباشر وعملي ومختصر، بلغة عربية بسيطة، بصفتك مستشار أعمال يفهم أرقام هذا المتجر تحديداً. لا تخترع أرقاماً غير موجودة في البيانات أعلاه.`;

    const answer = await geminiChat(prompt);
    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-[480px]">
      <div className="p-3 border-b border-border font-heading font-bold text-sm flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" /> استشر مساعدك الإداري
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-secondary' : 'bg-primary/10 text-primary'}`}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5" /></div>
            <div className="rounded-xl px-3 py-2 bg-secondary"><Loader2 className="w-4 h-4 animate-spin" /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="مثال: هل أستطيع تحمل راتب موظف جديد؟"
          disabled={loading}
        />
        <Button size="icon" onClick={handleSend} disabled={loading}><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
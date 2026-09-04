import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, ShoppingCart, Sparkles, Cigarette, Mic, MicOff, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { geminiChat } from '@/lib/geminiChat';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/useCart';
import { getLevelInfo } from '@/components/home/LevelProgressBar';

const DEFAULT_QUICK_SUGGESTIONS = [
  { text: 'اقترح لي نكهة معسل رائعة', icon: Cigarette },
  { text: 'أفضل أجهزة الفيب للمبتدئين', icon: Sparkles },
  { text: 'أنسب هدية راقية أقدمها', icon: null },
  { text: 'عطر فاخر للمناسبات', icon: null },
  { text: 'ما هي نقاط الولاء الخاصة بي؟', icon: null },
];

function ProductSuggestionCard({ product, format, onAddCart }) {
  const [added, setAdded] = useState(false);
  const handleAdd = (e) => {
    e.preventDefault();
    onAddCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  return (
    <Link to={`/product/${product.id}`} className="block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex gap-2 bg-background rounded-xl border border-border p-2 hover:border-primary/50 transition-colors"
      >
        <img
          src={product.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'}
          alt={product.title}
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{product.title}</p>
          {product.brand && <p className="text-[10px] text-muted-foreground">{product.brand}</p>}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-primary">{format ? format(product.price) : `${product.price} $`}</span>
            <button
              onClick={handleAdd}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${added ? 'bg-lime-500 text-white' : 'bg-primary text-white hover:bg-primary/80'}`}
            >
              {added ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-secondary rounded-2xl rounded-tr-sm">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function SmartChatOverlay({ onClose, settings }) {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const tcSuggestions = settings?.theme_config?.quick_suggestions;
  const QUICK_SUGGESTIONS = (tcSuggestions && tcSuggestions.length > 0)
    ? tcSuggestions.map(text => ({ text, icon: null }))
    : DEFAULT_QUICK_SUGGESTIONS;

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list('-sales_count', 80).catch(() => []),
      base44.auth.me().catch(() => null),
    ]).then(([p, me]) => {
      setProducts(p.filter(x => x.status === 'active'));
      setUser(me);
      if (me) {
        base44.entities.LoyaltyPoints.filter({ user_email: me.email }).then(lp => {
          const loyaltyData = lp[0] || null;
          setLoyalty(loyaltyData);
          const levelInfo = loyaltyData ? getLevelInfo(loyaltyData.points || 0) : null;
          setMessages([{
            role: 'assistant',
            content: `مرحباً${me.full_name ? ' يا ' + me.full_name.split(' ')[0] : ''}!\n\nأنا **مساعد ${settings?.store_name || 'عالم الباشا للتسوق'}**، مستشارك الشخصي للتسوق.\n\n${levelInfo ? `أرى أنك في مستوى **${levelInfo.label}** - رائع!\n\n` : ''}كيف أقدر أساعدك اليوم؟`,
            products: []
          }]);
        }).catch(() => {
          setMessages([{
            role: 'assistant',
            content: `مرحباً${me.full_name ? ' يا ' + me.full_name.split(' ')[0] : ''}!\n\nأنا **مساعد ${settings?.store_name || 'عالم الباشا للتسوق'}**، مستشارك الشخصي للتسوق.\n\nأقدر أساعدك في اختيار منتجات الشيشة والبوتيك والعطور والفيب والحيوانات الأليفة واقتراح أفضل العروض. كيف أقدر أخدمك؟`,
            products: []
          }]);
        });
      } else {
        setMessages([{
          role: 'assistant',
          content: `مرحباً بك في ${settings?.store_name || 'عالم الباشا للتسوق'}!\n\nيمكنك تصفح المتجر بحرية. لاستخدام **المساعد الذكي الشخصي** وحفظ سياقك ونقاطك، سجّل الدخول أولاً.`,
          products: []
        }]);
      }
    });
  }, []);

  useEffect(() => {
    if (settings?.currency) {
      const rates = settings.exchange_rates || {};
      const rate = rates[settings.currency] || 1;
      const sym = { SAR: 'ر.س', AED: 'د.إ', USD: '$', YER_OLD: 'ر.ي', YER_NEW: 'ر.ي' }[settings.currency] || '$';
      setFormat(() => (price) => `${(price * rate).toFixed(0)} ${sym}`);
    }
  }, [settings]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'ar-SA';
    rec.interimResults = false;
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const send = async (overrideText) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    const userMsg = (overrideText || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, products: [] }]);
    setLoading(true);

    const history = messages.slice(-8).map(m =>
      `${m.role === 'user' ? 'العميل' : 'الخبير'}: ${m.content.replace(/\*\*/g, '')}`
    ).join('\n');

    const productList = products.slice(0, 60).map(p =>
      `[ID:${p.id}] ${p.title} | ${p.brand || ''} | ${p.price} $ | ${p.store_key} | ${p.storage || ''} | ${p.is_bestseller ? 'bestseller' : ''} | ${p.is_new ? 'جديد' : ''}`
    ).join('\n');

    const userContext = user
      ? `العميل: ${user.full_name || 'زائر'} | نقاط الولاء: ${loyalty?.points || 0} | مستوى: ${getLevelInfo(loyalty?.points || 0).label}`
      : 'زائر غير مسجل';

    const persona = settings?.chat_persona || `أنت "مساعد ${settings?.store_name || 'عالم الباشا للتسوق'}"، مستشار ودود. ساعد العملاء في اختيار المنتجات المناسبة واقتراح أفضل العروض.`;

    const prompt = `${persona}

أنت تعمل في متجر "${settings?.store_name || 'عالم الباشا للتسوق'}".

سياق العميل: ${userContext}

المنتجات المتاحة:
${productList}

المحادثة السابقة:
${history}

رسالة العميل الآن: ${userMsg}

تعليمات صارمة:
1. أجب بعربية راقية ودودة لا تتجاوز 100 كلمة
2. إذا سأل عن منتج أو احتياج، اقترح من القائمة مع سبب موجز
3. إذا أردت اقتراح منتجات، أضف في آخر ردك: SUGGEST:[ID1,ID2,ID3]
4. إذا سأل عن مقارنة بين جهازين، قارن المواصفات والأسعار
5. إذا سأل عن نقاطه، أخبره برصيده ومستواه وكم يتبقى للمستوى التالي
6. لا تستخدم إيموجي مطلقاً
7. لا تقترح منتجات غير موجودة في القائمة`;

    const res = await geminiChat(prompt);
    const suggestMatch = res.match(/SUGGEST:\[([^\]]+)\]/);
    const suggestedIds = suggestMatch ? suggestMatch[1].split(',').map(s => s.trim()) : [];
    const suggestedProducts = products.filter(p => suggestedIds.includes(p.id)).slice(0, 4);
    const cleanText = res.replace(/SUGGEST:\[[^\]]+\]/, '').trim();

    setMessages(prev => [...prev, { role: 'assistant', content: cleanText, products: suggestedProducts }]);
    setLoading(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[89] bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="fixed z-[90] bg-background flex flex-col overflow-hidden shadow-2xl border border-border inset-x-3 bottom-3 h-[72vh] rounded-3xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[400px] sm:h-[600px] sm:max-h-[80vh]"
      >
      <div className="bg-gradient-to-l from-primary via-primary to-amber-600 text-primary-foreground p-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner overflow-hidden"
          >
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Cigarette className="w-5 h-5" />
            )}
          </motion.div>
          <div>
            <h3 className="font-heading font-bold text-base">مساعد {settings?.store_name || 'عالم الباشا للتسوق'}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-300 animate-pulse" />
              <p className="text-xs opacity-80">مستشارك للتسوق</p>
            </div>
          </div>
        </div>
        {user && loyalty && (
          <div className="text-left ml-auto mr-3">
            <p className="text-[10px] opacity-70">نقاطك</p>
            <p className="font-bold text-sm">{loyalty.points || 0}</p>
          </div>
        )}
        <button onClick={onClose} className="hover:bg-white/10 rounded-full p-1.5 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Cigarette className="w-2.5 h-2.5 text-primary" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">مساعد {settings?.store_name || 'عالم الباشا للتسوق'}</span>
                </div>
              )}
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tl-none'
                  : 'bg-secondary text-secondary-foreground rounded-tr-none'
              }`}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="my-0.5 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.products?.length > 0 && (
                <div className="w-full mt-2 space-y-2 max-w-xs">
                  {msg.products.map(p => (
                    <ProductSuggestionCard key={p.id} product={p} format={format} onAddCart={addItem} />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Cigarette className="w-2.5 h-2.5 text-primary" />
              )}
            </div>
            <TypingDots />
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {user && (
      <div className="px-3 pb-2 flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
        {QUICK_SUGGESTIONS.map(({ text, icon: SuggIcon }) => (
          <button
            key={text}
            onClick={() => send(text)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-xs hover:bg-primary hover:text-white transition-all duration-200"
          >
            {SuggIcon && <SuggIcon className="w-3 h-3" />}
            {text}
          </button>
        ))}
      </div>
      )}

      <div className="p-3 border-t border-border bg-background shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={isListening ? stopVoice : startVoice}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              <Input
                placeholder={isListening ? 'يستمع...' : `اسأل مساعد ${settings?.store_name || 'عالم الباشا للتسوق'}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 bg-secondary border-0 rounded-xl"
                disabled={loading || isListening}
              />
              <Button
                size="icon"
                type="submit"
                disabled={loading || (!input.trim() && !isListening)}
                className="rounded-xl w-10 h-10 shrink-0 bg-gradient-to-br from-primary to-lime-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button type="button" className="w-full" onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول لاستخدام المساعد الذكي</Button>
          )}
        </form>
      </div>
      </motion.div>
    </>
  );
}
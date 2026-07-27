import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Send, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const getVisitorKey = () => {
  let key = localStorage.getItem('basha_visitor_key');
  if (!key) {
    key = `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('basha_visitor_key', key);
  }
  return key;
};

export default function SocialEngagement({ contentType, contentId, title, shareText, allowComments = true, compact = false }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ name: '', comment: '' });
  const [saving, setSaving] = useState(false);
  const visitorKey = useMemo(getVisitorKey, []);

  const load = async () => {
    const [reactionRows, commentRows] = await Promise.all([
      base44.entities.ContentReaction.filter({ content_type: contentType, content_id: contentId }).catch(() => []),
      allowComments ? base44.entities.ContentComment.filter({ content_type: contentType, content_id: contentId, status: 'approved' }, '-created_date', 20).catch(() => []) : Promise.resolve([]),
    ]);
    setLikes(reactionRows.length);
    setLiked(reactionRows.some(r => r.visitor_key === visitorKey));
    setComments(commentRows);
  };

  useEffect(() => { load(); }, [contentType, contentId]);

  const toggleLike = async () => {
    if (liked) return toast.message('أعجبك هذا المحتوى بالفعل');
    await base44.entities.ContentReaction.create({ content_type: contentType, content_id: contentId, visitor_key: visitorKey, reaction: 'like' });
    setLiked(true);
    setLikes(v => v + 1);
  };

  const share = async () => {
    const data = { title, text: shareText || title, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط للمشاركة');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) return toast.error('اكتب اسمك وتعليقك أولاً');
    setSaving(true);
    const row = await base44.entities.ContentComment.create({ content_type: contentType, content_id: contentId, name: form.name.trim(), comment: form.comment.trim(), status: 'approved' });
    setComments([row, ...comments]);
    setForm({ name: '', comment: '' });
    setSaving(false);
    toast.success('تم نشر تعليقك');
  };

  return (
    <div className={compact ? 'space-y-3' : 'rounded-2xl border border-border/50 bg-card p-4 space-y-4'}>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={liked ? 'default' : 'outline'} size="sm" onClick={toggleLike} className="gap-2">
          <Heart className={liked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} /> أعجبني {likes > 0 ? likes : ''}
        </Button>
        <Button variant="outline" size="sm" onClick={share} className="gap-2">
          <Share2 className="w-4 h-4" /> مشاركة
        </Button>
        {allowComments && (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground px-2">
            <MessageCircle className="w-4 h-4" /> {comments.length} تعليق
          </span>
        )}
      </div>

      {allowComments && (
        <div className="space-y-3">
          {comments.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="rounded-xl bg-secondary/50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground">{c.created_date ? new Date(c.created_date).toLocaleDateString('ar-SA') : ''}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={submitComment} className="space-y-2">
            <Input placeholder="اسمك" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Textarea placeholder="اكتب تعليقك للجمهور..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} />
            <Button type="submit" disabled={saving} size="sm" className="gap-2">
              <Send className="w-4 h-4" /> نشر التعليق
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
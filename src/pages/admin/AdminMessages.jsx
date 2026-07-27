import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const load = () => base44.entities.ContactMessage.list('-created_date', 100).then(setMessages).catch(() => []);
  useEffect(() => { load(); }, []);

  const toggleRead = async (msg) => {
    await base44.entities.ContactMessage.update(msg.id, { is_read: !msg.is_read });
    load();
  };

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">الرسائل ({messages.filter(m => !m.is_read).length} جديدة)</h1>
      <div className="space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`bg-card rounded-lg p-4 border transition-colors ${msg.is_read ? 'border-border/50' : 'border-primary/30 bg-primary/5'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">{msg.name}</span>
              <span className="text-xs text-muted-foreground">📱 {msg.phone}</span>
            </div>
            <p className="text-sm text-muted-foreground">{msg.message}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={() => toggleRead(msg)}>
                {msg.is_read ? <EyeOff className="w-3 h-3 ml-1" /> : <Eye className="w-3 h-3 ml-1" />}
                {msg.is_read ? 'غير مقروء' : 'مقروء'}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => { await base44.entities.ContactMessage.delete(msg.id); load(); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد رسائل</p>}
      </div>
    </div>
  );
}
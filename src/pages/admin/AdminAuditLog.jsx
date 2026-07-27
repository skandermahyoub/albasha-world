import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { ScrollText, Search } from 'lucide-react';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.AuditLog.list('-created_date', 200).then(setLogs).catch(() => []);
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.description || '').toLowerCase().includes(s) ||
           (l.performed_by || '').toLowerCase().includes(s) ||
           (l.entity_type || '').toLowerCase().includes(s) ||
           (l.action || '').toLowerCase().includes(s);
  });

  const actionColors = {
    create: 'bg-green-500/10 text-green-600',
    update: 'bg-blue-500/10 text-blue-600',
    delete: 'bg-red-500/10 text-red-600',
    login: 'bg-purple-500/10 text-purple-600',
    logout: 'bg-gray-500/10 text-gray-600',
    price_change: 'bg-orange-500/10 text-orange-600',
    settings_change: 'bg-yellow-500/10 text-yellow-600',
  };

  const actionLabels = {
    create: 'إنشاء', update: 'تعديل', delete: 'حذف', login: 'تسجيل دخول',
    logout: 'تسجيل خروج', export: 'تصدير', import: 'استيراد',
    settings_change: 'تغيير إعدادات', price_change: 'تغيير سعر', other: 'أخرى',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <ScrollText className="w-6 h-6" /> سجل النشاط (Audit Log)
        </h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث في السجل..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      <div className="space-y-2">
        {filtered.map(log => (
          <div key={log.id} className="bg-card rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${actionColors[log.action] || 'bg-gray-500/10 text-gray-600'}`}>
                {actionLabels[log.action] || log.action}
              </span>
              {log.entity_type && <span className="text-xs text-muted-foreground">| {log.entity_type}</span>}
              {log.entity_name && <span className="text-xs font-medium truncate">| {log.entity_name}</span>}
            </div>
            <p className="text-sm">{log.description}</p>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>بواسطة: {log.performed_by || 'غير معروف'}</span>
              <span>{new Date(log.created_date).toLocaleString('ar-EG')}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد سجلات</p>}
      </div>
    </div>
  );
}
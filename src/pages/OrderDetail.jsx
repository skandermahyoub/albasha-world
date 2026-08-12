import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StickyHeader from '@/components/layout/StickyHeader';
import OrderDetailsCard from '@/components/orders/OrderDetailsCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function OrderDetail() {
  const { orderNumber } = useParams(); const navigate = useNavigate(); const [order, setOrder] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { base44.functions.invoke('track-order', { order_number: orderNumber }).then(res => setOrder(res.data?.order || null)).finally(() => setLoading(false)); }, [orderNumber]);
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!order) return <div className="min-h-screen bg-background flex flex-col gap-4 items-center justify-center p-4"><p>الطلب غير متاح.</p><Button onClick={() => navigate('/my-account')}>العودة إلى حسابي</Button></div>;
  return <div className="min-h-screen bg-background"><StickyHeader visible cartCount={0} /><main className="pt-20 pb-10 px-4 max-w-2xl mx-auto"><Button variant="ghost" size="sm" onClick={() => navigate('/my-account')}><ArrowRight className="w-4 h-4" /> طلباتي</Button><div className="my-5"><h1 className="font-heading font-bold text-2xl">طلب #{order.order_number}</h1><p className="text-sm text-muted-foreground">{order.created_date && new Date(order.created_date).toLocaleString('ar-SA')}</p></div><OrderDetailsCard order={order} /></main></div>;
}
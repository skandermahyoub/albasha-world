import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const DISTRIBUTION = [
  { name: 'إدارة و CRM', value: 25, color: 'hsl(71, 64%, 51%)' },
  { name: 'تجارة ومبيعات', value: 30, color: 'hsl(38, 43%, 60%)' },
  { name: 'المخزون والتشغيل', value: 15, color: 'hsl(280, 60%, 55%)' },
  { name: 'تسويق ومحتوى', value: 18, color: 'hsl(200, 70%, 55%)' },
  { name: 'دعم وخدمة', value: 12, color: 'hsl(340, 60%, 55%)' },
];

const MODULES = [
  { name: 'المتجر', المتانة: 95, 'سهولة الاستخدام': 90 },
  { name: 'الإدارة', المتانة: 92, 'سهولة الاستخدام': 85 },
  { name: 'المخزون', المتانة: 88, 'سهولة الاستخدام': 93 },
  { name: 'المالية', المتانة: 90, 'سهولة الاستخدام': 82 },
  { name: 'التسويق', المتانة: 87, 'سهولة الاستخدام': 88 },
];

const COUNTS = [
  { name: 'صفحات', 'الإدارة': 40, 'العميل': 18 },
  { name: 'كيانات', 'الإدارة': 35, 'العميل': 0 },
  { name: 'أنظمة', 'الإدارة': 9, 'العميل': 0 },
  { name: 'أدوات تشغيل', 'الإدارة': 10, 'العميل': 0 },
];

export default function CapabilityCharts() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold text-primary tracking-wider">تحليل الإمكانيات</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">رسوم بيانية للنظام</h2>
          <p className="text-muted-foreground">توزيع المميزات وقوة كل وحدة في النظام</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-6"
          >
            <h3 className="font-heading font-bold text-lg mb-4 text-center">توزيع المميزات</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={DISTRIBUTION} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DISTRIBUTION.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6"
          >
            <h3 className="font-heading font-bold text-lg mb-4 text-center">قوة الوحدات</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={MODULES}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="المتانة" dataKey="المتانة" stroke="hsl(71, 64%, 51%)" fill="hsl(71, 64%, 51%)" fillOpacity={0.4} />
                <Radar name="سهولة الاستخدام" dataKey="سهولة الاستخدام" stroke="hsl(38, 43%, 60%)" fill="hsl(38, 43%, 60%)" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-6"
          >
            <h3 className="font-heading font-bold text-lg mb-4 text-center">إحصائيات شاملة</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={COUNTS}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'hsl(71, 64%, 51%, 0.1)' }} />
                <Bar dataKey="الإدارة" fill="hsl(71, 64%, 51%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="العميل" fill="hsl(38, 43%, 60%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { useState } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', Transport: '#3b82f6', Housing: '#8b5cf6',
  Entertainment: '#ec4899', Health: '#10b981', Shopping: '#f59e0b',
  Utilities: '#6366f1', Other: '#94a3b8'
};

interface MonthlyData {
  month: number; year: number; income: number; expense: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const chartData = data.map(d => ({
    name: MONTHS[d.month - 1],
    Income: d.income,
    Expense: d.expense,
    Net: d.income - d.expense
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Overview</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
          <Tooltip formatter={(val: number) => [`$${val.toFixed(2)}`, '']} />
          <Legend />
          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryData { category: string; _sum: { amount: number } }

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e293b" className="text-sm font-semibold">{payload.category}</text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill="#64748b" className="text-xs">${value.toFixed(0)}</text>
      <text x={cx} y={cy + 35} textAnchor="middle" fill="#10b981" className="text-xs">{`${(percent * 100).toFixed(1)}%`}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const expenses = data.filter(d => d._sum.amount > 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={expenses} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
            dataKey="_sum.amount" nameKey="category"
            activeIndex={activeIndex} activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
          >
            {expenses.map(entry => (
              <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
        {expenses.map(e => (
          <div key={e.category} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
            {e.category}
          </div>
        ))}
      </div>
    </div>
  );
}

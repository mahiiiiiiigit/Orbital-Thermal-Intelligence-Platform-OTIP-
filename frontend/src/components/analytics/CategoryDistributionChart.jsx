import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Sun, Moon } from 'lucide-react';
import { TAXONOMY_COLORS } from '../../constants/taxonomy';

export function CategoryDistributionChart({ data = [] }) {
  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#0f172a]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[180px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/60">
            <span
              className="w-3 h-3 rounded-md"
              style={{ backgroundColor: item.color || '#38bdf8' }}
            />
            <span className="font-bold text-white uppercase">{item.name}</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span>Detections:</span>
              <span className="font-bold text-white">{item.count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Share:</span>
              <span className="font-bold text-sky-400">{item.percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Radiance:</span>
              <span className="font-bold text-orange-400">{item.avgFrp} MW</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalDetections = data.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span>Thermal Taxonomy Category Breakdown</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Distribution of classified radiative anomalies across physical source categories
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-dark-900 px-2.5 py-1 rounded-lg border border-slate-800">
          Total Sample: <strong className="text-white">{totalDetections.toLocaleString()}</strong>
        </div>
      </div>

      {/* Grid: Bar Chart + Mini Donut/KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        
        {/* Horizontal / Categorical Bar Chart (2 cols) */}
        <div className="md:col-span-2 h-[270px] w-full">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                width={85}
              />

              <Tooltip content={<CustomBarTooltip />} />

              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || TAXONOMY_COLORS[entry.id] || '#38bdf8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart & Diurnal breakdown (1 col) */}
        <div className="flex flex-col justify-between bg-dark-900/80 rounded-xl p-3.5 border border-slate-800/80">
          <div className="h-[140px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`pie-cell-${index}`}
                      fill={entry.color || TAXONOMY_COLORS[entry.id] || '#38bdf8'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomBarTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Top Source</span>
              <span className="text-xs font-bold text-white font-mono">
                {data[0]?.name || 'Wildfire'}
              </span>
            </div>
          </div>

          {/* Diurnal vs Nocturnal Breakdown */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Diurnal (Daytime)</span>
              </div>
              <span className="font-bold text-amber-400">64.2%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nocturnal (Night)</span>
              </div>
              <span className="font-bold text-cyan-400">35.8%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

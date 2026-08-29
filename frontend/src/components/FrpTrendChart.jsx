import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';

export function FrpTrendChart({ hotspots = [], activeDate = null }) {
  const chartData = useMemo(() => {
    if (!hotspots || hotspots.length === 0) return [];

    const daily = new Map();
    hotspots.forEach((h) => {
      const date = h.timestamp?.slice(0, 10);
      if (!date) return;
      if (!daily.has(date)) {
        daily.set(date, []);
      }
      daily.get(date).push(Number(h.frp || 0));
    });

    const dates = Array.from(daily.keys()).sort();
    return dates.map((date) => {
      const values = daily.get(date);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      return {
        date,
        shortDate: date.slice(5),
        meanFrp: Number(avg.toFixed(1)),
        count: values.length,
      };
    });
  }, [hotspots]);

  if (chartData.length === 0) return null;

  const currentPoint = chartData.find((d) => d.date === activeDate);

  return (
    <div className="w-full h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="frpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
          <XAxis
            dataKey="shortDate"
            stroke="#94a3b8"
            fontSize={9}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[11px] shadow-xl">
                    <p className="font-mono text-slate-800 dark:text-slate-300 font-bold">{data.date}</p>
                    <p className="text-sky-600 dark:text-sky-400 font-semibold">Mean Radiance: {data.meanFrp} MW</p>
                    <p className="text-slate-500 dark:text-slate-400">{data.count} active thermal detections</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="meanFrp"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#frpGradient)"
          />
          {currentPoint && (
            <ReferenceDot
              x={currentPoint.shortDate}
              y={currentPoint.meanFrp}
              r={5}
              fill="#ec4899"
              stroke="#ffffff"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

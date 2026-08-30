import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
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
      const dObj = new Date(date);
      const monthStr = dObj.toLocaleString('en-US', { month: 'short' });
      const dayNum = dObj.getDate();
      return {
        date,
        shortDate: `${monthStr} ${dayNum}`,
        meanFrp: Number(avg.toFixed(1)),
        count: values.length,
      };
    });
  }, [hotspots]);

  if (chartData.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-slate-500 font-mono">
        No trend telemetry available
      </div>
    );
  }

  return (
    <div className="w-full h-24 pt-0.5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 6, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="frpCyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="shortDate"
            stroke="#64748b"
            fontSize={9}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#64748b"
            fontSize={9}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-dark-900 border border-dark-700 rounded-md p-1.5 text-[10.5px] shadow-xl text-white">
                    <p className="font-mono text-sky-400 font-bold">{data.date}</p>
                    <p className="font-semibold text-slate-200">Mean: {data.meanFrp} MW</p>
                    <p className="text-[9.5px] text-slate-400">{data.count} detections</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="meanFrp"
            stroke="#06b6d4"
            strokeWidth={1.8}
            fillOpacity={1}
            fill="url(#frpCyanGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

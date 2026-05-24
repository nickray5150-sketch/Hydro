import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Award, Droplets, CalendarCheck } from 'lucide-react';
import { HistoryRecord } from '../types';

interface AnalyticsChartsProps {
  history: HistoryRecord[];
  unit: 'ml' | 'oz';
}

export default function AnalyticsCharts({ history, unit }: AnalyticsChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Get past 7 days (including today)
  const chartData = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const record = history.find((h) => h.date === dateStr);
      const loggedAmount = record?.logs.reduce((acc, l) => acc + l.amount, 0) || 0;
      const target = record?.target || 2000;

      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        loggedAmount,
        target,
        percentage: Math.min(100, Math.round((loggedAmount / target) * 100)),
      });
    }
    return days;
  }, [history]);

  // Analytics Metrics calculations
  const metrics = useMemo(() => {
    let totalLogs = 0;
    let completedDaysCount = 0;
    let maxDayAmount = 0;
    let maxDayName = 'None';

    chartData.forEach((day) => {
      totalLogs += day.loggedAmount;
      if (day.loggedAmount >= day.target) {
        completedDaysCount++;
      }
      if (day.loggedAmount > maxDayAmount) {
        maxDayAmount = day.loggedAmount;
        maxDayName = day.dayName;
      }
    });

    const averageLogged = Math.round(totalLogs / 7);
    const completedRatePercent = Math.round((completedDaysCount / 7) * 100);

    return {
      averageLogged,
      completedRatePercent,
      maxDayAmount,
      maxDayName,
      completedDaysCount,
    };
  }, [chartData]);

  // SVG Chart sizing parameters
  const chartHeight = 180;
  const chartWidth = 460;
  const paddingX = 40;
  const paddingY = 20;
  const graphWidth = chartWidth - paddingX * 2;
  const graphHeight = chartHeight - paddingY * 2;

  // Compute maximum amount to scale y-axis perfectly
  const maxInChart = Math.max(...chartData.map((d) => Math.max(d.loggedAmount, d.target, 1000)));
  const yAxisMax = Math.ceil((maxInChart + 500) / 500) * 500;

  // Generate gridlines
  const gridLines = [0, yAxisMax / 2, yAxisMax];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-sky-100 dark:bg-sky-955/50 rounded-xl text-sky-600 dark:text-sky-400">
            <BarChart3 className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Progress Analytics Dashboard</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Hydration trends for the past 7 days</p>
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <Droplets className="h-3 w-3 text-sky-400" /> Daily Avg
            </span>
            <div className="mt-1">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {metrics.averageLogged} ml
              </div>
              <span className="text-[9px] text-slate-400 font-medium">Hydrated average</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <Award className="h-3 w-3 text-amber-500" /> Reached Target
            </span>
            <div className="mt-1">
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.completedDaysCount} / 7 days
              </div>
              <span className="text-[9px] text-slate-400 font-medium">{metrics.completedRatePercent}% success</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-sky-400 animate-pulse" /> Peak Day
            </span>
            <div className="mt-1">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {metrics.maxDayName}
              </div>
              <span className="text-[9px] text-slate-400 font-medium">{metrics.maxDayAmount} ml drank</span>
            </div>
          </div>
        </div>

        {/* Elegant SVG Chart Panel */}
        <div className="relative border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 select-none pb-4">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible"
          >
            <defs>
              {/* Vibrant Sky Gradient */}
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              {/* Highlight bar hover state */}
              <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              {/* Threshold line gradient */}
              <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Y-Axis Gridlines */}
            {gridLines.map((val, idx) => {
              const yVal = paddingY + graphHeight - (val / yAxisMax) * graphHeight;
              return (
                <g key={idx} className="opacity-40">
                  <line
                    x1={paddingX}
                    y1={yVal}
                    x2={chartWidth - paddingX}
                    y2={yVal}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray={idx === 1 ? '4 4' : undefined}
                    className="dark:stroke-slate-700"
                  />
                  <text
                    x={paddingX - 10}
                    y={yVal + 3}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="500"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Render Bars for each of the 7 days */}
            {chartData.map((day, idx) => {
              const rectWidth = 26;
              const spacing = graphWidth / 7;
              const xVal = paddingX + idx * spacing + (spacing - rectWidth) / 2;

              // Calculate proportional heights
              const barHeight = (day.loggedAmount / yAxisMax) * graphHeight;
              const targetHeight = (day.target / yAxisMax) * graphHeight;

              // Constrained heights inside graph limit
              const yWaterY = paddingY + graphHeight - barHeight;
              const yTargetY = paddingY + graphHeight - targetHeight;

              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Daily Goal Marker Threshold Line */}
                  <line
                    x1={xVal - 4}
                    y1={yTargetY}
                    x2={xVal + rectWidth + 4}
                    y2={yTargetY}
                    stroke={day.percentage >= 100 ? '#10b981' : '#a1a1aa'}
                    strokeWidth="2.5"
                    strokeDasharray="2 1"
                    className="opacity-75"
                  />

                  {/* Filled Water Bar */}
                  <rect
                    x={xVal}
                    y={yWaterY}
                    width={rectWidth}
                    height={Math.max(2, barHeight)} // absolute minimum for aesthetic
                    rx="6"
                    fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
                    className="transition-all duration-300"
                  />

                  {/* Day Label X-Axis */}
                  <text
                    x={xVal + rectWidth / 2}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill={isHovered ? '#0ea5e9' : '#64748b'}
                    className="dark:fill-slate-400 font-semibold"
                  >
                    {day.dayName}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip details */}
          <div className="h-6 mt-2 flex items-center justify-center">
            {hoveredIndex !== null ? (
              <div className="text-[11px] bg-slate-800 dark:bg-slate-950 text-white px-3 py-1 rounded-full flex gap-2 font-medium transition-all shadow-sm">
                <span>{chartData[hoveredIndex].dayName}:</span>
                <span className="font-bold text-sky-400">
                  {chartData[hoveredIndex].loggedAmount} ml
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-200">
                  {chartData[hoveredIndex].percentage}% met
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                Hover over hydration bars to view specific insights
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

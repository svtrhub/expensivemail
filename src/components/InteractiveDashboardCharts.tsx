import React, { useState, useMemo } from 'react';
import { Expense, SupportedCurrency } from '../types';
import { formatCurrency, convertCurrency } from '../services/currency';
import { LanguageCode } from '../services/translations';
import { TrendingUp, PieChart, BarChart3, Filter } from 'lucide-react';

interface InteractiveDashboardChartsProps {
  expenses: Expense[];
  currency: SupportedCurrency;
  ratesToIDR: Record<SupportedCurrency, number>;
  language: LanguageCode;
  onSelectCategoryFilter?: (category: string | null) => void;
  activeCategoryFilter?: string | null;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

// Category color map harmonized with Liquid Glass Midnight Navy palette
const CATEGORY_COLORS: Record<
  string,
  { main: string; glow: string; text: string; bg: string }
> = {
  'Software SaaS': {
    main: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.4)',
    text: 'text-sky-400',
    bg: 'bg-sky-500/20',
  },
  'Marketing & Ads': {
    main: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  Operational: {
    main: '#10B981',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  'Travel & Dining': {
    main: '#818CF8',
    glow: 'rgba(129, 140, 248, 0.4)',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
  },
  'Office Supplies': {
    main: '#F43F5E',
    glow: 'rgba(244, 63, 94, 0.4)',
    text: 'text-rose-400',
    bg: 'bg-rose-500/20',
  },
  'Consulting & Services': {
    main: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.4)',
    text: 'text-purple-400',
    bg: 'bg-purple-500/20',
  },
  'Utility & Logistics': {
    main: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.4)',
    text: 'text-teal-400',
    bg: 'bg-teal-500/20',
  },
  Other: {
    main: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.4)',
    text: 'text-slate-400',
    bg: 'bg-slate-500/20',
  },
};

const DEFAULT_COLOR = {
  main: '#60A5FA',
  glow: 'rgba(96, 165, 250, 0.4)',
  text: 'text-blue-400',
  bg: 'bg-blue-500/20',
};

export const InteractiveDashboardCharts: React.FC<
  InteractiveDashboardChartsProps
> = ({
  expenses,
  currency,
  ratesToIDR,
  language,
  onSelectCategoryFilter,
  activeCategoryFilter,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null
  );
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [chartViewMode, setChartViewMode] = useState<
    'both' | 'trend' | 'category'
  >('both');

  // Convert expenses to active currency amounts
  const processedExpenses = useMemo(() => {
    return expenses.map((exp) => {
      const converted = convertCurrency(
        exp.amount,
        exp.currency as SupportedCurrency,
        currency,
        ratesToIDR
      );
      return {
        ...exp,
        convertedAmount: converted,
        dateObj: new Date(exp.date),
      };
    });
  }, [expenses, currency, ratesToIDR]);

  // Filter expenses by time range
  const filteredByTimeExpenses = useMemo(() => {
    if (timeRange === 'all') return processedExpenses;
    const now = new Date();
    const daysMap: Record<TimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      all: 9999,
    };
    const cutoffDays = daysMap[timeRange];
    const cutoffDate = new Date(
      now.getTime() - cutoffDays * 24 * 60 * 60 * 1000
    );
    return processedExpenses.filter((exp) => exp.dateObj >= cutoffDate);
  }, [processedExpenses, timeRange]);

  // Aggregate daily totals for line chart
  const timeSeriesData = useMemo(() => {
    const daysCount =
      timeRange === '7d'
        ? 7
        : timeRange === '30d'
          ? 30
          : timeRange === '90d'
            ? 90
            : 30;
    const now = new Date();
    const result: {
      dateStr: string;
      label: string;
      total: number;
      count: number;
    }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(
        language === 'id' ? 'id-ID' : 'en-US',
        {
          month: 'short',
          day: 'numeric',
        }
      );

      const dayExpenses = filteredByTimeExpenses.filter(
        (exp) => exp.date.split('T')[0] === dateStr
      );

      const total = dayExpenses.reduce(
        (acc, curr) => acc + curr.convertedAmount,
        0
      );
      result.push({
        dateStr,
        label: dayLabel,
        total,
        count: dayExpenses.length,
      });
    }
    return result;
  }, [filteredByTimeExpenses, timeRange, language]);

  // Calculate SVG Trend Line Path
  const trendLineGeometry = useMemo(() => {
    if (timeSeriesData.length === 0)
      return { pathD: '', areaD: '', points: [], maxVal: 1 };

    const maxVal = Math.max(...timeSeriesData.map((d) => d.total), 1);
    const width = 600;
    const height = 200;
    const padding = 20;

    const points = timeSeriesData.map((d, index) => {
      const x =
        padding + (index / (timeSeriesData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.total / maxVal) * (height - 2 * padding);
      return { x, y, ...d };
    });

    if (points.length === 1) {
      return {
        pathD: `M ${points[0].x} ${points[0].y}`,
        areaD: '',
        points,
        maxVal,
      };
    }

    // Smooth cubic bezier path construction
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const areaD = `${pathD} L ${lastPt.x} ${height - padding} L ${firstPt.x} ${height - padding} Z`;

    const startDateLabel = firstPt?.label || '';
    const midDateLabel = points[Math.floor(points.length / 2)]?.label || '';
    const endDateLabel = lastPt?.label || '';

    return {
      pathD,
      areaD,
      points,
      maxVal,
      startDateLabel,
      midDateLabel,
      endDateLabel,
    };
  }, [timeSeriesData]);

  // Category aggregate calculation for Donut Chart
  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    filteredByTimeExpenses.forEach((exp) => {
      const cat = exp.category || 'Other';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += exp.convertedAmount;
      map[cat].count += 1;
      grandTotal += exp.convertedAmount;
    });

    const categories = Object.keys(map).map((cat) => {
      const total = map[cat].total;
      const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
      const colors = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
      return {
        category: cat,
        total,
        count: map[cat].count,
        percentage,
        colors,
      };
    });

    // Sort by largest spending first
    categories.sort((a, b) => b.total - a.total);
    return { categories, grandTotal };
  }, [filteredByTimeExpenses]);

  // Donut chart path geometry calculation
  const donutGeometry = useMemo(() => {
    const { categories, grandTotal } = categoryData;
    if (grandTotal === 0 || categories.length === 0) return [];

    let currentAngle = 0;
    const center = 100;
    const radius = 75;
    const innerRadius = 52;

    return categories.map((item) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const ix1 = center + innerRadius * Math.cos(endRad);
      const iy1 = center + innerRadius * Math.sin(endRad);
      const ix2 = center + innerRadius * Math.cos(startRad);
      const iy2 = center + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return {
        ...item,
        pathData,
        startAngle,
        endAngle,
      };
    });
  }, [categoryData]);

  // Summary Metrics
  const totalPeriodSpend = useMemo(() => {
    return filteredByTimeExpenses.reduce(
      (acc, e) => acc + e.convertedAmount,
      0
    );
  }, [filteredByTimeExpenses]);

  const peakDay = useMemo(() => {
    if (timeSeriesData.length === 0) return null;
    return [...timeSeriesData].sort((a, b) => b.total - a.total)[0];
  }, [timeSeriesData]);

  const activePoint =
    hoveredPointIndex !== null
      ? trendLineGeometry.points[hoveredPointIndex]
      : null;

  return (
    <div id="interactive-dashboard-charts" className="space-y-4 mb-6">
      {/* Top Controls Header */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#A3E2FF]/20 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#2251FF]/20 text-[#6FE0FF] border border-[#6FE0FF]/30 shadow-xs shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-white font-editorial tracking-tight">
                {language === 'id'
                  ? 'Visualisasi & Tren Transaksi'
                  : 'Transaction Trends & Analytics'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#6FE0FF]/15 text-[#6FE0FF] border border-[#6FE0FF]/30">
                Interactive
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {language === 'id'
                ? 'Analisis grafik pengeluaran real-time dan rasio kategori'
                : 'Real-time expenditure trajectory and category distribution'}
            </p>
          </div>
        </div>

        {/* Action Controls: View Mode & Time Horizon Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div
            className="inline-flex rounded-xl bg-[#0A1120]/80 p-1 border border-white/10 text-xs font-bold"
            role="group"
            aria-label="Chart View Mode"
          >
            <button
              type="button"
              onClick={() => setChartViewMode('both')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartViewMode === 'both'
                  ? 'bg-[#2251FF] text-[#EAF4FF] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Show All Charts"
            >
              {language === 'id' ? 'Semua' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('trend')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartViewMode === 'trend'
                  ? 'bg-[#2251FF] text-[#EAF4FF] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Show Trend Line Only"
            >
              {language === 'id' ? 'Tren' : 'Trend'}
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('category')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartViewMode === 'category'
                  ? 'bg-[#2251FF] text-[#EAF4FF] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Show Category Breakdown Only"
            >
              {language === 'id' ? 'Kategori' : 'Category'}
            </button>
          </div>

          {/* Time Range Selector */}
          <div
            className="inline-flex rounded-xl bg-[#0A1120]/80 p-1 border border-white/10 text-xs font-bold font-mono"
            role="group"
            aria-label="Time Horizon Selector"
          >
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer uppercase ${
                  timeRange === range
                    ? 'bg-[#38BDF8] text-[#0A1120] font-extrabold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label={`Time range ${range}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Container for Charts */}
      <div
        className={`grid gap-5 ${
          chartViewMode === 'both'
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1'
        }`}
      >
        {/* CHART 1: Interactive Transaction Value Over Time Line & Area Chart */}
        {(chartViewMode === 'both' || chartViewMode === 'trend') && (
          <div
            className={`glass-panel p-5 rounded-2xl border border-[#A3E2FF]/20 shadow-xl flex flex-col justify-between ${
              chartViewMode === 'both' ? 'lg:col-span-7' : 'w-full'
            }`}
          >
            {/* Header & KPI Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#6FE0FF]" />
                  <h4 className="text-sm font-bold text-white font-editorial tracking-tight">
                    {language === 'id'
                      ? 'Tren Nilai Transaksi Harian'
                      : 'Transaction Volume Trajectory'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {language === 'id'
                    ? 'Grafik pergerakan total nominal pengeluaran'
                    : 'Daily aggregate expenditure trajectory'}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-right">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                    {language === 'id'
                      ? 'Total Periode Ini'
                      : 'Period Aggregate'}
                  </span>
                  <span className="text-sm font-bold font-mono text-[#6FE0FF]">
                    {formatCurrency(totalPeriodSpend, currency)}
                  </span>
                </div>
                {peakDay && (
                  <div className="hidden sm:block pl-3 border-l border-white/10">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                      {language === 'id' ? 'Puncak Pengeluaran' : 'Peak Day'}
                    </span>
                    <span className="text-xs font-bold font-mono text-amber-300">
                      {peakDay.label} ({formatCurrency(peakDay.total, currency)}
                      )
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive SVG Area/Line Chart Surface */}
            <div className="relative w-full h-[220px] sm:h-[240px] select-none my-2">
              <svg
                viewBox="0 0 600 200"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                role="img"
                aria-label="Interactive Transaction Trend Chart"
              >
                <defs>
                  {/* Glowing Line Gradient */}
                  <linearGradient
                    id="lineGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#2251FF" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#6FE0FF" />
                  </linearGradient>

                  {/* Gradient Area Fill */}
                  <linearGradient
                    id="areaGrad"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#2251FF" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#2251FF" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Soft Line Glow Filter */}
                  <filter
                    id="glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>

                {/* Horizontal Grid Baseline Guidelines */}
                <line
                  x1="20"
                  y1="20"
                  x2="580"
                  y2="20"
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <line
                  x1="20"
                  y1="100"
                  x2="580"
                  y2="100"
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <line
                  x1="20"
                  y1="180"
                  x2="580"
                  y2="180"
                  stroke="rgba(255,255,255,0.12)"
                />

                {/* Filled Area Under Curve */}
                {trendLineGeometry.areaD && (
                  <path d={trendLineGeometry.areaD} fill="url(#areaGrad)" />
                )}

                {/* Glowing Smooth Bezier Trend Line */}
                {trendLineGeometry.pathD && (
                  <path
                    d={trendLineGeometry.pathD}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                )}

                {/* Hover Crosshair Vertical Guide */}
                {activePoint && (
                  <line
                    x1={activePoint.x}
                    y1="10"
                    x2={activePoint.x}
                    y2="180"
                    stroke="#6FE0FF"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />
                )}

                {/* Interactive Data Point Nodes */}
                {trendLineGeometry.points.map((pt, idx) => {
                  const isHovered = hoveredPointIndex === idx;
                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      {/* Transparent enlarged hover target circle */}
                      <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                      {/* Visible Node Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '6' : '3.5'}
                        fill={isHovered ? '#6FE0FF' : '#38BDF8'}
                        stroke={isHovered ? '#0A1120' : '#2251FF'}
                        strokeWidth={isHovered ? '2.5' : '1.5'}
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Compact & Tightly Anchored Glass Tooltip Popover (Contained safely inside chart area) */}
              {activePoint &&
                (() => {
                  const rawLeft = (activePoint.x / 600) * 100;
                  const clampLeft = Math.max(14, Math.min(86, rawLeft));
                  const isNearTop = activePoint.y < 50;
                  const rawTop = (activePoint.y / 200) * 100;
                  // Clamp top position between 12% and 78% so popover never bleeds outside card boundaries
                  const clampTop = Math.max(12, Math.min(78, rawTop));

                  return (
                    <div
                      id="line-chart-tooltip"
                      className={`glass-dropdown absolute pointer-events-none z-[80] bg-[#071422]/95 backdrop-blur-2xl px-3 py-2 rounded-xl border border-[#6FE0FF] shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs space-y-0.5 transform -translate-x-1/2 transition-all duration-75 ${
                        isNearTop ? 'translate-y-3' : '-translate-y-full -mt-3'
                      }`}
                      style={{
                        left: `${clampLeft}%`,
                        top: `${clampTop}%`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-0.5">
                        <span className="font-mono font-bold text-slate-300 text-[11px]">
                          {activePoint.label}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-[#2251FF] text-white">
                          {activePoint.count}{' '}
                          {activePoint.count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <div className="font-mono font-extrabold text-xs sm:text-sm text-[#EAF4FF]">
                        {formatCurrency(activePoint.total, currency)}
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* X-Axis Date Range Labels */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10">
              <span>{trendLineGeometry.startDateLabel}</span>
              <span className="text-[#6FE0FF] font-semibold">
                {trendLineGeometry.midDateLabel}
              </span>
              <span>{trendLineGeometry.endDateLabel}</span>
            </div>
          </div>
        )}

        {/* CHART 2: Spending Category Allocation Donut Chart */}
        {(chartViewMode === 'both' || chartViewMode === 'category') && (
          <div
            className={`glass-panel p-5 rounded-2xl border border-[#A3E2FF]/20 shadow-xl flex flex-col justify-between ${
              chartViewMode === 'both' ? 'lg:col-span-5' : 'w-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-[#6FE0FF]" />
                <h4 className="text-sm font-bold text-white font-editorial tracking-tight">
                  {language === 'id'
                    ? 'Distribusi Pengeluaran Kategori'
                    : 'Spending Category Breakdown'}
                </h4>
              </div>
              {activeCategoryFilter && (
                <button
                  type="button"
                  onClick={() =>
                    onSelectCategoryFilter && onSelectCategoryFilter(null)
                  }
                  className="text-[10px] font-mono font-bold text-[#6FE0FF] hover:underline bg-[#2251FF]/30 px-2 py-0.5 rounded-full border border-[#6FE0FF]/30"
                >
                  {language === 'id' ? 'Reset Filter' : 'Reset Filter'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-300">
              {language === 'id'
                ? 'Proporsi anggaran menurut kategori'
                : 'Category allocation breakdown'}
            </p>

            {/* Prominent Center-Aligned SVG Donut Chart Surface (Enlarged to fill card) */}
            {categoryData.grandTotal > 0 ? (
              <div className="flex flex-col items-center justify-center py-2 my-1">
                {/* SVG Donut */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 shrink-0">
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full overflow-visible"
                  >
                    <defs>
                      {donutGeometry.map((item, i) => (
                        <filter
                          id={`glow-${i}`}
                          key={i}
                          x="-20%"
                          y="-20%"
                          width="140%"
                          height="140%"
                        >
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feComposite
                            in="SourceGraphic"
                            in2="blur"
                            operator="over"
                          />
                        </filter>
                      ))}
                    </defs>

                    {donutGeometry.map((item, idx) => {
                      const isHovered = hoveredCategory === item.category;
                      const isFilterSelected =
                        activeCategoryFilter === item.category;

                      return (
                        <path
                          key={idx}
                          d={item.pathData}
                          fill={item.colors.main}
                          opacity={
                            activeCategoryFilter
                              ? isFilterSelected
                                ? 1
                                : 0.35
                              : isHovered
                                ? 1
                                : 0.88
                          }
                          stroke={
                            isHovered || isFilterSelected
                              ? '#EAF4FF'
                              : 'rgba(14, 22, 40, 0.8)'
                          }
                          strokeWidth={
                            isHovered || isFilterSelected ? '3' : '1.5'
                          }
                          className="transition-all duration-200 cursor-pointer transform origin-center"
                          style={{
                            transform:
                              isHovered || isFilterSelected
                                ? 'scale(1.05)'
                                : 'scale(1)',
                            transformOrigin: '100px 100px',
                          }}
                          onMouseEnter={() => setHoveredCategory(item.category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          onClick={() =>
                            onSelectCategoryFilter &&
                            onSelectCategoryFilter(
                              activeCategoryFilter === item.category
                                ? null
                                : item.category
                            )
                          }
                        />
                      );
                    })}
                  </svg>

                  {/* Donut Center Metrics Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3">
                    <span className="text-xs font-mono uppercase font-bold text-slate-300 block truncate max-w-[150px]">
                      {hoveredCategory ||
                        activeCategoryFilter ||
                        (language === 'id'
                          ? 'TOTAL PENGELUARAN'
                          : 'TOTAL EXPENDITURE')}
                    </span>
                    <span className="text-lg sm:text-2xl font-extrabold font-mono text-white truncate max-w-[180px] mt-1 text-readability-shadow">
                      {hoveredCategory
                        ? formatCurrency(
                            categoryData.categories.find(
                              (c) => c.category === hoveredCategory
                            )?.total || 0,
                            currency
                          )
                        : formatCurrency(categoryData.grandTotal, currency)}
                    </span>
                    <span className="text-xs font-bold text-[#6FE0FF] mt-1 bg-[#2251FF]/40 px-2.5 py-0.5 rounded-full border border-[#6FE0FF]/40">
                      {hoveredCategory
                        ? `${categoryData.categories.find((c) => c.category === hoveredCategory)?.percentage.toFixed(1)}%`
                        : `${categoryData.categories.length} ${language === 'id' ? 'Kategori Terdaftar' : 'Categories Active'}`}
                    </span>
                  </div>
                </div>

                {/* Subtitle Hint */}
                <p className="text-[11px] text-slate-400 mt-4 text-center">
                  {language === 'id'
                    ? 'Arahkan kursor atau ketuk segmen donut untuk melihat detail kategori'
                    : 'Hover or tap donut segments to inspect category breakdown'}
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                {language === 'id'
                  ? 'Belum ada data pengeluaran untuk periode ini'
                  : 'No expenditure data recorded for this timeframe'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

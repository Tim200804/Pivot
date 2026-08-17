import { memo, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const colors = {
  hrv: { line: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  rhr: { line: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
  sleepHours: { line: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
  sleepDeep: { line: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  spo2: { line: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  mood: { line: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
  motivation: { line: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
  fatigue: { line: '#f97316', bg: 'rgba(249,115,22,0.08)' },
}

const metricLabels = {
  hrv: 'HRV (ms)',
  rhr: 'RHR (bpm)',
  sleepHours: 'Sleep (hrs)',
  sleepDeep: 'Deep Sleep (%)',
  spo2: 'SpO2 (%)',
  mood: 'Mood (1-5)',
  motivation: 'Motivation (1-10)',
  fatigue: 'Fatigue (1-10)',
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  animation: {
    duration: 400,
    easing: 'easeOutQuart',
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyleWidth: 8,
        padding: 16,
        font: { size: 11, family: 'Satoshi, system-ui' },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      titleColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleFont: { family: 'Satoshi, system-ui', weight: '600' },
      bodyFont: { family: 'Satoshi, system-ui' },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      beginAtZero: false,
    },
  },
}

const HealthTrendChart = memo(function HealthTrendChart({ data, title, metrics, darkMode }) {
  const safeData = Array.isArray(data) ? data : []
  const safeMetrics = Array.isArray(metrics) ? metrics : []
  const labels = useMemo(() => safeData.map(d => d.day), [safeData])

  const datasets = useMemo(() => safeMetrics.map(metric => ({
    label: metricLabels[metric] || metric,
    data: safeData.map(d => d[metric]),
    borderColor: colors[metric]?.line || '#3b82f6',
    backgroundColor: colors[metric]?.bg || 'rgba(59,130,246,0.08)',
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: colors[metric]?.line || '#3b82f6',
    borderWidth: 2,
  })), [safeData, safeMetrics])

  const chartData = useMemo(() => ({ labels, datasets }), [labels, datasets])

  const options = useMemo(() => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins.legend,
        display: safeMetrics.length > 1,
        labels: {
          ...baseOptions.plugins.legend.labels,
          color: darkMode ? '#94a3b8' : '#64748b',
        },
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f1f5f9' : '#0f172a',
        bodyColor: darkMode ? '#cbd5e1' : '#475569',
        borderColor: darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.08)',
      },
    },
    scales: {
      x: {
        ...baseOptions.scales.x,
        grid: { color: darkMode ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b',
          font: { size: 11 },
          maxTicksLimit: safeData.length > 14 ? 10 : undefined,
          maxRotation: safeData.length > 14 ? 45 : 0,
        },
      },
      y: {
        ...baseOptions.scales.y,
        grid: { color: darkMode ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: { color: darkMode ? '#94a3b8' : '#64748b', font: { size: 11 } },
      },
    },
  }), [darkMode, safeMetrics.length, safeData.length])

  return (
    <div className="glass-card p-6">
      {title && (
        <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300 mb-4">{title}</h3>
      )}
      <div className="chart-container" style={{ height: 280 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
})

export default HealthTrendChart

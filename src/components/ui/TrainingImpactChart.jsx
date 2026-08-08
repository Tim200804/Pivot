import { memo, useMemo } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
  Tooltip,
  Legend
)

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
      callbacks: {
        afterBody: (context) => {
          const idx = context[0].dataIndex
          const row = context[0].chart._customData?.[idx]
          if (!row) return ''
          const lines = []
          if (row.trainingType) lines.push(`Type: ${row.trainingType}`)
          if (row.trainingPhase) lines.push(`Phase: ${row.trainingPhase}`)
          if (row.focusArea) lines.push(`Focus: ${row.focusArea}`)
          if (row.coachNotes) lines.push(`Notes: ${row.coachNotes}`)
          return lines.length ? '' + lines.join('\n') : ''
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      grid: { color: 'rgba(148,163,184,0.06)', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      beginAtZero: false,
      title: { display: true, text: 'HRV / RHR / Sleep', color: '#64748b', font: { size: 10 } },
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      ticks: { color: '#64748b', font: { size: 11 } },
      beginAtZero: true,
      title: { display: true, text: 'Training Load', color: '#64748b', font: { size: 10 } },
    },
  },
}

const TrainingImpactChart = memo(function TrainingImpactChart({ healthData, trainingData, title, darkMode }) {
  const merged = useMemo(() => {
    const map = new Map()
    healthData.forEach(h => map.set(h.day || h.date, { ...h }))
    trainingData.forEach(t => {
      const key = t.day || t.date
      const existing = map.get(key) || {}
      map.set(key, { ...existing, ...t, load: t.plannedLoad || t.actualLoad || (t.intensityScore * t.volumeScore) })
    })
    return Array.from(map.values()).sort((a, b) => (a.day || a.date).localeCompare(b.day || b.date))
  }, [healthData, trainingData])

  const labels = useMemo(() => merged.map(d => d.day || d.date), [merged])

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Training Load',
        data: merged.map(d => d.load || 0),
        backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.35)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y1',
        order: 3,
      },
      {
        type: 'line',
        label: 'HRV (ms)',
        data: merged.map(d => d.hrv),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        yAxisID: 'y',
        order: 1,
      },
      {
        type: 'line',
        label: 'RHR (bpm)',
        data: merged.map(d => d.rhr),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'Sleep (hrs)',
        data: merged.map(d => d.sleepHours),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.08)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        yAxisID: 'y',
        order: 2,
      },
    ],
  }), [merged, labels, darkMode])

  const options = useMemo(() => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins.legend,
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
          maxTicksLimit: merged.length > 14 ? 10 : undefined,
          maxRotation: merged.length > 14 ? 45 : 0,
        },
      },
      y: {
        ...baseOptions.scales.y,
        grid: { color: darkMode ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: { color: darkMode ? '#94a3b8' : '#64748b', font: { size: 11 } },
        title: { display: true, text: 'HRV / RHR / Sleep', color: darkMode ? '#94a3b8' : '#64748b', font: { size: 10 } },
      },
      y1: {
        ...baseOptions.scales.y1,
        ticks: { color: darkMode ? '#94a3b8' : '#64748b', font: { size: 11 } },
        title: { display: true, text: 'Training Load', color: darkMode ? '#94a3b8' : '#64748b', font: { size: 10 } },
      },
    },
  }), [darkMode, merged.length])

  return (
    <div className="glass-card p-6">
      {title && (
        <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300 mb-4">{title}</h3>
      )}
      <div className="chart-container" style={{ height: 320 }}>
        <Chart ref={(chart) => { if (chart) chart.canvas._customData = merged }} type="bar" data={chartData} options={options} />
      </div>
    </div>
  )
})

export default TrainingImpactChart

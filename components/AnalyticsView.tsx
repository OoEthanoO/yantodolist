'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format, startOfDay, subDays, addDays, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, endOfMonth as getEndOfMonth } from 'date-fns'
import { TrendingUp, CheckCircle2, ListTodo, Clock, Target, Calendar as CalendarIcon } from 'lucide-react'

interface Todo {
  id: string
  title: string
  description?: string | null
  completed: boolean
  priority: 'low' | 'high'
  dueDate?: Date | null
  scheduledDate?: Date | null
  createdAt: Date
  updatedAt: Date
  userId?: string
}

interface AnalyticsViewProps {
  todos: Todo[]
}

interface ChartDatum {
  date: string
  created: number
  completed: number
  total: number
}

interface HoverPoint {
  x: number
  y: number
  label: string
  value: number
  suffix: string
  color: string
}

interface ChartLayout {
  horizontalPadding: number
  effectiveWidth: number
}

type SummaryRange = '7' | '31' | '365'

const summaryRangeOptions: { value: SummaryRange; label: string }[] = [
  { value: '7', label: 'Last 7 Days' },
  { value: '31', label: 'Last 30 Days' },
  { value: '365', label: 'Last Year' },
]

interface LineChartProps {
  data: ChartDatum[]
  valueAccessor: (data: ChartDatum) => number
  color: string
  gradientId: string
  maxValue: number
  tooltipSuffix: string
  onMetricsChange?: (layout: ChartLayout) => void
}

function LineChart({
  data,
  valueAccessor,
  color,
  gradientId,
  maxValue,
  tooltipSuffix,
  onMetricsChange,
}: LineChartProps) {
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (data.length === 0) return null

  const safeMax = maxValue <= 0 ? 1 : maxValue
  const length = data.length
  const effectiveWidth = dimensions.width || 600
  const effectiveHeight = dimensions.height || 260
  const horizontalPadding = length > 1 ? Math.max(24, effectiveWidth * 0.06) : Math.max(16, effectiveWidth * 0.04)
  const topPadding = 0
  const bottomPadding = 0
  const chartWidth = Math.max(1, effectiveWidth - horizontalPadding * 2)
  const chartHeight = Math.max(1, effectiveHeight - topPadding - bottomPadding)
  const baseY = topPadding + chartHeight

  useEffect(() => {
    onMetricsChange?.({ horizontalPadding, effectiveWidth })
  }, [horizontalPadding, effectiveWidth, onMetricsChange])

  const points = data.map((datum, idx) => {
    const rawValue = Math.max(0, valueAccessor(datum))
    const ratio = length === 1 ? 0.5 : idx / (length - 1)
    const x = length === 1 ? effectiveWidth / 2 : horizontalPadding + ratio * chartWidth
  const unclampedY = topPadding + (1 - rawValue / safeMax) * chartHeight
  const y = Math.min(baseY, Math.max(topPadding, unclampedY))
    return { x, y, rawValue, label: datum.date }
  })

  const linePath = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ')

  const areaPath = points.length === 1
    ? (() => {
        const point = points[0]
        const halfWidth = Math.min(4, chartWidth / 8)
        const left = Math.max(horizontalPadding, point.x - halfWidth)
        const right = Math.min(horizontalPadding + chartWidth, point.x + halfWidth)
        return [
          `M ${left},${baseY}`,
          `L ${left},${point.y}`,
          `L ${right},${point.y}`,
          `L ${right},${baseY}`,
          'Z'
        ].join(' ')
      })()
    : [
        `M ${points[0].x},${baseY}`,
        `L ${points[0].x},${points[0].y}`,
        ...points.slice(1).map(point => `L ${point.x},${point.y}`),
        `L ${points[points.length - 1].x},${baseY}`,
        'Z'
      ].join(' ')

  const tooltip = hoverPoint && (
    <div
      className="pointer-events-none absolute rounded-md px-2 py-1 text-xs shadow-md"
      style={{
        backgroundColor: 'var(--popover)',
        color: 'var(--popover-foreground)',
        border: `1px solid ${hoverPoint.color}`,
        left: `${Math.min(effectiveWidth - 8, Math.max(8, hoverPoint.x))}px`,
        top: `${Math.max(16, hoverPoint.y - 12)}px`,
        transform: 'translate(-50%, -100%)',
        whiteSpace: 'nowrap',
      }}
    >
      <div className="font-medium" style={{ color: hoverPoint.color }}>{hoverPoint.label}</div>
      <div>{hoverPoint.value} {hoverPoint.suffix}</div>
    </div>
  )

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1={topPadding}
            x2="0"
            y2={baseY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, idx) => (
          <circle
            key={`${point.x}-${idx}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={color}
            stroke="#ffffff"
            strokeWidth={1.5}
            tabIndex={0}
            aria-label={`${point.label}: ${point.rawValue} ${tooltipSuffix}`}
            onMouseEnter={() => setHoverPoint({
              x: point.x,
              y: point.y,
              label: point.label,
              value: point.rawValue,
              suffix: tooltipSuffix,
              color,
            })}
            onMouseLeave={() => setHoverPoint(null)}
            onFocus={() => setHoverPoint({
              x: point.x,
              y: point.y,
              label: point.label,
              value: point.rawValue,
              suffix: tooltipSuffix,
              color,
            })}
            onBlur={() => setHoverPoint(null)}
            onTouchStart={() => setHoverPoint({
              x: point.x,
              y: point.y,
              label: point.label,
              value: point.rawValue,
              suffix: tooltipSuffix,
              color,
            })}
            onTouchEnd={() => setHoverPoint(null)}
            onTouchCancel={() => setHoverPoint(null)}
          >
            <title>{`${point.label}: ${point.rawValue} ${tooltipSuffix}`}</title>
          </circle>
        ))}
      </svg>
      {tooltip}
    </div>
  )
}

export default function AnalyticsView({ todos }: AnalyticsViewProps) {
  const [summaryRange, setSummaryRange] = useState<SummaryRange>('31')
  const [createdLayout, setCreatedLayout] = useState<ChartLayout>({ horizontalPadding: 0, effectiveWidth: 0 })
  const [completedLayout, setCompletedLayout] = useState<ChartLayout>({ horizontalPadding: 0, effectiveWidth: 0 })
  const [totalLayout, setTotalLayout] = useState<ChartLayout>({ horizontalPadding: 0, effectiveWidth: 0 })

  // Calculate various metrics
  const metrics = useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)
    const last7Days = subDays(today, 7)
    const last30Days = subDays(today, 30)

    const totalTasks = todos.length
    const completedTasks = todos.filter(t => t.completed).length
    const activeTasks = totalTasks - completedTasks
    const highPriorityTasks = todos.filter(t => t.priority === 'high' && !t.completed).length
    const overdueTasks = todos.filter(t => 
      !t.completed && t.dueDate && new Date(t.dueDate) < today
    ).length

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Tasks created in last 7 days
    const tasksLast7Days = todos.filter(t => 
      new Date(t.createdAt) >= last7Days
    ).length

    // Tasks completed in last 7 days
    const completedLast7Days = todos.filter(t => 
      t.completed && new Date(t.updatedAt) >= last7Days
    ).length

    // Tasks created in last 30 days
    const tasksLast30Days = todos.filter(t => 
      new Date(t.createdAt) >= last30Days
    ).length

    const getWindowRange = (range: SummaryRange) => {
      switch (range) {
        case '7': {
          return {
            start: startOfDay(subDays(today, 6)),
            endExclusive: addDays(today, 1),
            days: 7,
          }
        }
        case '31': {
          return {
            start: startOfDay(subDays(today, 30)),
            endExclusive: addDays(today, 1),
            days: 31,
          }
        }
        case '365': {
          return {
            start: startOfDay(subDays(today, 364)),
            endExclusive: addDays(today, 1),
            days: 365,
          }
        }
        default:
          return {
            start: startOfDay(subDays(today, 30)),
            endExclusive: addDays(today, 1),
            days: 31,
          }
      }
    }

    const { start: windowStart, endExclusive: windowEndExclusive, days: windowDays } = getWindowRange(summaryRange)

    const createdInWindow = todos.filter(t => {
      const createdAt = new Date(t.createdAt)
      return createdAt >= windowStart && createdAt < windowEndExclusive
    }).length

    const completedInWindow = todos.filter(t => {
      if (!t.completed) return false
      const completedAt = new Date(t.updatedAt)
      return completedAt >= windowStart && completedAt < windowEndExclusive
    }).length

    const completionDurations = todos.reduce<number[]>((acc, todo) => {
      if (!todo.completed) {
        return acc
      }

      const completedAt = new Date(todo.updatedAt)
      if (completedAt < windowStart || completedAt >= windowEndExclusive) {
        return acc
      }

      const createdAt = new Date(todo.createdAt)
      const diffMs = completedAt.getTime() - createdAt.getTime()
      if (diffMs < 0) {
        return acc
      }

      acc.push(diffMs / (1000 * 60 * 60 * 24))
      return acc
    }, [])

    const averageCompletionDays = completionDurations.length > 0
      ? completionDurations.reduce((sum, days) => sum + days, 0) / completionDurations.length
      : null

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      highPriorityTasks,
      overdueTasks,
      completionRate,
      tasksLast7Days,
      completedLast7Days,
      tasksLast30Days,
      windowSummary: {
        days: windowDays,
        createdCount: createdInWindow,
        completedCount: completedInWindow,
        avgCreatedPerDay: windowDays > 0 ? createdInWindow / windowDays : 0,
        avgCompletedPerDay: windowDays > 0 ? completedInWindow / windowDays : 0,
        completionRatio: createdInWindow > 0 ? completedInWindow / createdInWindow : null,
        averageCompletionDays,
      },
    }
  }, [todos, summaryRange])

  // Generate data for charts
  const chartData = useMemo<ChartDatum[]>(() => {
    const today = startOfDay(new Date())
    
    // For 365 days, show monthly data (12 months)
    if (summaryRange === '365') {
      const months = eachMonthOfInterval({ 
        start: startOfMonth(subMonths(today, 11)), 
        end: startOfMonth(today) 
      })
      
      const monthlyData = months.map(month => {
        const monthStart = startOfMonth(month)
        const monthEnd = getEndOfMonth(month)
        monthEnd.setHours(23, 59, 59, 999)

        const created = todos.filter(t => {
          const createdAt = new Date(t.createdAt)
          return createdAt >= monthStart && createdAt <= monthEnd
        }).length

        const completed = todos.filter(t => {
          if (!t.completed) return false
          const updatedAt = new Date(t.updatedAt)
          return updatedAt >= monthStart && updatedAt <= monthEnd
        }).length

        const total = todos.filter(t => new Date(t.createdAt) <= monthEnd).length

        return {
          date: format(month, 'MMM yyyy'),
          created,
          completed,
          total,
        }
      })

      return monthlyData
    }
    
    // For 7 or 31 days, show daily data
    const daysToShow = summaryRange === '7' ? 6 : 30
    const days = eachDayOfInterval({ start: subDays(today, daysToShow), end: today })

    const dailyData = days.map(day => {
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const created = todos.filter(t => {
        const createdAt = new Date(t.createdAt)
        return createdAt >= dayStart && createdAt <= dayEnd
      }).length

      const completed = todos.filter(t => {
        if (!t.completed) return false
        const updatedAt = new Date(t.updatedAt)
        return updatedAt >= dayStart && updatedAt <= dayEnd
      }).length

      const total = todos.filter(t => new Date(t.createdAt) <= dayEnd).length

      return {
        date: format(day, 'MMM d'),
        created,
        completed,
        total,
      }
    })

    return dailyData
  }, [todos, summaryRange])

  const xAxisLabels = useMemo(() => {
    if (chartData.length === 0) return [] as { label: string; idx: number }[]

    // For 365 days (12 months), show all month labels
    if (summaryRange === '365') {
      return chartData.map((_, idx) => ({ label: chartData[idx].date, idx }))
    }
    
    // For 7 days, show all labels
    if (summaryRange === '7') {
      return chartData.map((_, idx) => ({ label: chartData[idx].date, idx }))
    }
    
    // For 31 days, show labels every 5 days
    const step = 5
    const lastIndex = chartData.length - 1
    const indices: number[] = []

    for (let idx = 0; idx <= lastIndex; idx += step) {
      indices.push(idx)
    }

    if (indices[indices.length - 1] !== lastIndex) {
      indices.push(lastIndex)
    }

    const uniqueIndices = Array.from(new Set(indices)).sort((a, b) => a - b)
    return uniqueIndices.map(idx => ({ label: chartData[idx].date, idx }))
  }, [chartData, summaryRange])

  // Find max values for scaling
  const maxCreated = Math.max(...chartData.map(d => d.created), 1)
  const maxCompleted = Math.max(...chartData.map(d => d.completed), 1)
  const maxTotal = Math.max(...chartData.map(d => d.total), 1)

  // Get timeframe display text
  const getTimeframeText = () => {
    switch (summaryRange) {
      case '7':
        return 'Last 7 Days'
      case '31':
        return 'Last 30 Days'
      case '365':
        return 'Last 12 Months'
      default:
        return 'Last 31 Days'
    }
  }

  const windowSummary = metrics.windowSummary
  const averageCreatedPerDayDisplay = windowSummary ? windowSummary.avgCreatedPerDay.toFixed(1) : '0.0'
  const averageCompletedPerDayDisplay = windowSummary ? windowSummary.avgCompletedPerDay.toFixed(1) : '0.0'
  const completionRatioDisplay = windowSummary && windowSummary.completionRatio !== null
    ? `${windowSummary.completionRatio.toFixed(2)}×`
    : '—'
  const averageCompletionDaysDisplay = windowSummary && windowSummary.averageCompletionDays !== null
    ? windowSummary.averageCompletionDays.toFixed(1)
    : '—'
  const displayDays = summaryRange === '31' ? 30 : (windowSummary?.days ?? 0)
  const timeframeBadge = `${displayDays} days`

  const renderXAxis = (layout: ChartLayout) => {
    if (chartData.length === 0 || xAxisLabels.length === 0) return null

    if (layout.effectiveWidth <= 0) {
      return (
        <div className="flex justify-between items-center h-full text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {xAxisLabels.map(({ label }, idx) => (
            <span 
              key={`${label}-${idx}`}
              style={summaryRange === '365' ? {
                display: 'inline-block',
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left',
                fontSize: '10px',
              } : {}}
            >
              {label}
            </span>
          ))}
        </div>
      )
    }

    const chartWidth = Math.max(1, layout.effectiveWidth - layout.horizontalPadding * 2)

    return (
      <div className="relative w-full h-full text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {xAxisLabels.map(({ label, idx }) => {
          const ratio = chartData.length === 1 ? 0.5 : idx / (chartData.length - 1)
          const left = layout.horizontalPadding + ratio * chartWidth
          const clampedLeft = Math.min(layout.effectiveWidth - 6, Math.max(6, left))

          return (
            <span
              key={`${label}-${idx}`}
              className="absolute"
              style={{
                left: `${clampedLeft}px`,
                bottom: summaryRange === '365' ? '0' : '0',
                transform: summaryRange === '365' 
                  ? 'rotate(-45deg) translateX(-50%)' 
                  : 'translateX(-50%)',
                transformOrigin: summaryRange === '365' ? 'bottom left' : 'center',
                whiteSpace: 'nowrap',
                fontSize: summaryRange === '365' ? '10px' : '12px',
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg shadow-md p-4 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ListTodo size={18} className="text-blue-500" />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{metrics.totalTasks}</p>
        </div>

        <div className="rounded-lg shadow-md p-4 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{metrics.completedTasks}</p>
        </div>

        <div className="rounded-lg shadow-md p-4 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={18} className="text-orange-500" />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Active</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{metrics.activeTasks}</p>
        </div>

        <div className="rounded-lg shadow-md p-4 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target size={18} className="text-purple-500" />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>High Priority</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{metrics.highPriorityTasks}</p>
        </div>

        <div className="rounded-lg shadow-md p-4 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarIcon size={18} className="text-red-500" />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{metrics.overdueTasks}</p>
        </div>

        <div className="rounded-lg shadow-md p-4 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp size={18} className="text-indigo-500" />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Completion</span>
          </div>
          <p className="text-2xl font-bold text-indigo-500">{metrics.completionRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Activity Insights</h3>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              View creation, completion, and efficiency trends across different windows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summaryRangeOptions.map(option => {
              const isActive = summaryRange === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setSummaryRange(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all border cursor-pointer ${isActive ? 'font-semibold shadow-sm' : ''}`}
                  style={
                    isActive
                      ? { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', borderColor: '#3b82f6' }
                      : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
                  }
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg shadow-md p-4" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-blue-500" />
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Creation</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                {timeframeBadge}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Tasks Created</span>
                <span className="font-semibold text-blue-500">{windowSummary?.createdCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Average per day</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{averageCreatedPerDayDisplay}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-4" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Completion</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                {timeframeBadge}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Tasks Completed</span>
                <span className="font-semibold text-green-500">{windowSummary?.completedCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Average per day</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{averageCompletedPerDayDisplay}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-4" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" />
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Efficiency</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                {timeframeBadge}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Completed : Created</span>
                <span className="font-semibold text-indigo-500">{completionRatioDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Avg days to complete</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {averageCompletionDaysDisplay === '—' ? '—' : `${averageCompletionDaysDisplay} days`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Tasks Created Chart */}
        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--card)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <TrendingUp size={18} className="text-blue-500" />
            Tasks Created ({getTimeframeText()})
          </h3>
          <div className="relative h-64 mt-6">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="text-right">{maxCreated}</span>
              <span className="text-right">{Math.floor(maxCreated * 0.75)}</span>
              <span className="text-right">{Math.floor(maxCreated * 0.5)}</span>
              <span className="text-right">{Math.floor(maxCreated * 0.25)}</span>
              <span className="text-right">0</span>
            </div>
            
            {/* Grid lines */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              {[0, 0.25, 0.5, 0.75, 1].map((fraction, idx) => (
                <div
                  key={idx}
                  className="absolute left-0 right-0 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    opacity: 0.3,
                    top: `${fraction * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Line chart */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              <LineChart
                data={chartData}
                valueAccessor={(data: ChartDatum) => data.created}
                color="#3b82f6"
                gradientId="analytics-gradient-created"
                maxValue={maxCreated}
                tooltipSuffix="tasks"
                onMetricsChange={setCreatedLayout}
              />
            </div>

            {/* X-axis labels */}
            <div className="absolute left-14 right-0 bottom-0 h-8">
              {renderXAxis(createdLayout)}
            </div>
          </div>
        </div>

        {/* Tasks Completed Chart */}
        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--card)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <CheckCircle2 size={18} className="text-green-500" />
            Tasks Completed ({getTimeframeText()})
          </h3>
          <div className="relative h-64 mt-6">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="text-right">{maxCompleted}</span>
              <span className="text-right">{Math.floor(maxCompleted * 0.75)}</span>
              <span className="text-right">{Math.floor(maxCompleted * 0.5)}</span>
              <span className="text-right">{Math.floor(maxCompleted * 0.25)}</span>
              <span className="text-right">0</span>
            </div>
            
            {/* Grid lines */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              {[0, 0.25, 0.5, 0.75, 1].map((fraction, idx) => (
                <div
                  key={idx}
                  className="absolute left-0 right-0 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    opacity: 0.3,
                    top: `${fraction * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Line chart */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              <LineChart
                data={chartData}
                valueAccessor={(data: ChartDatum) => data.completed}
                color="#22c55e"
                gradientId="analytics-gradient-completed"
                maxValue={maxCompleted}
                tooltipSuffix="tasks"
                onMetricsChange={setCompletedLayout}
              />
            </div>

            {/* X-axis labels */}
            <div className="absolute left-14 right-0 bottom-0 h-8">
              {renderXAxis(completedLayout)}
            </div>
          </div>
        </div>

        {/* Total Tasks Trend Chart */}
        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--card)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <ListTodo size={18} className="text-purple-500" />
            Total Tasks Trend ({getTimeframeText()})
          </h3>
          <div className="relative h-64 mt-6">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="text-right">{maxTotal}</span>
              <span className="text-right">{Math.floor(maxTotal * 0.75)}</span>
              <span className="text-right">{Math.floor(maxTotal * 0.5)}</span>
              <span className="text-right">{Math.floor(maxTotal * 0.25)}</span>
              <span className="text-right">0</span>
            </div>
            
            {/* Grid lines */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              {[0, 0.25, 0.5, 0.75, 1].map((fraction, idx) => (
                <div
                  key={idx}
                  className="absolute left-0 right-0 border-t"
                  style={{
                    borderColor: 'var(--border)',
                    opacity: 0.3,
                    top: `${fraction * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Line chart */}
            <div className="absolute left-14 right-0 top-0 bottom-8">
              <LineChart
                data={chartData}
                valueAccessor={(data: ChartDatum) => data.total}
                color="#a855f7"
                gradientId="analytics-gradient-total"
                maxValue={maxTotal}
                tooltipSuffix="total tasks"
                onMetricsChange={setTotalLayout}
              />
            </div>

            {/* X-axis labels */}
            <div className="absolute left-14 right-0 bottom-0 h-8">
              {renderXAxis(totalLayout)}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {metrics.totalTasks > 0 && (
        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--card)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <TrendingUp size={18} className="text-blue-500" />
            Insights
          </h3>
          <div className="space-y-3 text-sm">
            {metrics.completionRate >= 80 && (
              <div 
                className="flex items-start gap-2 p-3 rounded-lg border" 
                style={{ 
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  borderLeft: '4px solid #22c55e',
                  borderColor: 'rgba(34, 197, 94, 0.2)'
                }}
              >
                <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-600">Excellent Progress!</p>
                  <p className="text-green-600 opacity-90">You've completed {metrics.completionRate.toFixed(0)}% of your tasks. Keep up the great work!</p>
                </div>
              </div>
            )}
            
            {metrics.overdueTasks > 0 && (
              <div 
                className="flex items-start gap-2 p-3 rounded-lg border" 
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '4px solid #ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <CalendarIcon size={16} className="text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-600">Overdue Tasks</p>
                  <p className="text-red-600 opacity-90">You have {metrics.overdueTasks} overdue {metrics.overdueTasks === 1 ? 'task' : 'tasks'}. Consider prioritizing them.</p>
                </div>
              </div>
            )}

            {metrics.highPriorityTasks > 5 && (
              <div 
                className="flex items-start gap-2 p-3 rounded-lg border" 
                style={{ 
                  backgroundColor: 'rgba(249, 115, 22, 0.08)',
                  borderLeft: '4px solid #f97316',
                  borderColor: 'rgba(249, 115, 22, 0.2)'
                }}
              >
                <Target size={16} className="text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-600">Many High Priority Tasks</p>
                  <p className="text-orange-600 opacity-90">You have {metrics.highPriorityTasks} high priority tasks. Focus on completing a few each day.</p>
                </div>
              </div>
            )}

            {metrics.tasksLast7Days > 10 && (
              <div 
                className="flex items-start gap-2 p-3 rounded-lg border" 
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderLeft: '4px solid #3b82f6',
                  borderColor: 'rgba(59, 130, 246, 0.2)'
                }}
              >
                <TrendingUp size={16} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-600">Very Active!</p>
                  <p className="text-blue-600 opacity-90">You've created {metrics.tasksLast7Days} tasks in the last week. You're staying productive!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

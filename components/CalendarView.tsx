'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Clock, AlertCircle } from 'lucide-react'

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

interface CalendarViewProps {
  todos: Todo[]
  onToggleTodo: (id: string) => void
}

type ViewMode = 'month' | 'week' | 'day'

export default function CalendarView({ todos, onToggleTodo }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const daysToDisplay = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      return eachDayOfInterval({ start, end })
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return eachDayOfInterval({ start, end })
    } else {
      return [currentDate]
    }
  }, [currentDate, viewMode])

  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => {
      // Show on due date
      if (todo.dueDate && isSameDay(new Date(todo.dueDate), date)) {
        return true
      }
      // Show on scheduled date
      if (todo.scheduledDate && isSameDay(new Date(todo.scheduledDate), date)) {
        return true
      }
      return false
    })
  }

  const getDateTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('prev')}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-70"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-semibold min-w-[240px] text-center" style={{ color: 'var(--foreground)' }}>
            {getDateTitle()}
          </h2>
          
          <button
            onClick={() => navigate('next')}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-70"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg transition-colors hover:bg-blue-600 bg-blue-500 text-white font-medium"
          >
            Today
          </button>
          
          <div className="rounded-lg shadow-md p-1 flex" style={{ backgroundColor: 'var(--card)' }}>
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-md text-sm transition-colors capitalize ${
                  viewMode === mode ? '' : 'hover:bg-opacity-70'
                }`}
                style={
                  viewMode === mode
                    ? { backgroundColor: 'var(--muted)', color: 'var(--foreground)' }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-sm"
                style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {daysToDisplay.map((date, idx) => {
              const todosForDate = getTodosForDate(date)
              const isCurrentMonth = isSameMonth(date, currentDate)
              const isPast = date < new Date() && !isToday(date)

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 border-b border-r ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${isToday(date) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isToday(date) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                      }`}
                      style={!isToday(date) ? { color: isPast ? 'var(--muted-foreground)' : 'var(--foreground)' } : {}}
                    >
                      {format(date, 'd')}
                    </span>
                    {todosForDate.length > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                      >
                        {todosForDate.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {todosForDate.slice(0, 3).map((todo) => (
                      <button
                        key={todo.id}
                        onClick={() => onToggleTodo(todo.id)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-all hover:shadow-md ${
                          todo.completed ? 'opacity-60' : ''
                        }`}
                        style={{
                          backgroundColor: todo.priority === 'high' ? '#fee2e2' : '#dcfce7',
                          color: todo.priority === 'high' ? '#991b1b' : '#166534',
                        }}
                        title={todo.title}
                      >
                        <div className="flex items-center gap-1">
                          {todo.completed && <Check size={10} />}
                          {todo.scheduledDate && isSameDay(new Date(todo.scheduledDate), date) && (
                            <CalendarIcon size={10} />
                          )}
                          {todo.dueDate && isSameDay(new Date(todo.dueDate), date) && !todo.scheduledDate && (
                            <Clock size={10} />
                          )}
                          <span className={`truncate ${todo.completed ? 'line-through' : ''}`}>
                            {todo.title}
                          </span>
                        </div>
                      </button>
                    ))}
                    {todosForDate.length > 3 && (
                      <div className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                        +{todosForDate.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="space-y-2">
          {daysToDisplay.map((date) => {
            const todosForDate = getTodosForDate(date)
            return (
              <div
                key={date.toString()}
                className={`rounded-lg shadow-md p-4 ${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: 'var(--card)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {format(date, 'EEEE, MMMM d')}
                    {isToday(date) && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-500 text-white">Today</span>
                    )}
                  </h3>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {todosForDate.length} {todosForDate.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {todosForDate.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                    No tasks for this day
                  </p>
                ) : (
                  <div className="space-y-2">
                    {todosForDate.map((todo) => (
                      <div
                        key={todo.id}
                        className={`p-3 rounded-lg border-l-4 ${todo.completed ? 'opacity-60' : ''}`}
                        style={{
                          backgroundColor: 'var(--muted)',
                          borderColor: todo.priority === 'high' ? '#ef4444' : '#22c55e',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4
                              className={`font-medium ${todo.completed ? 'line-through' : ''}`}
                              style={{ color: 'var(--foreground)' }}
                            >
                              {todo.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {todo.scheduledDate && isSameDay(new Date(todo.scheduledDate), date) && (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon size={12} />
                                  Scheduled
                                </span>
                              )}
                              {todo.dueDate && isSameDay(new Date(todo.dueDate), date) && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  Due
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full ${
                                todo.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {todo.priority}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => onToggleTodo(todo.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                              todo.completed ? 'bg-green-500 border-green-500 text-white' : 'hover:border-green-500'
                            }`}
                            style={!todo.completed ? { borderColor: 'var(--border)' } : {}}
                          >
                            {todo.completed && <Check size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--card)' }}>
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
              {isToday(currentDate) && (
                <span className="ml-3 text-sm px-3 py-1 rounded-full bg-blue-500 text-white">Today</span>
              )}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {getTodosForDate(currentDate).length} {getTodosForDate(currentDate).length === 1 ? 'task' : 'tasks'} scheduled
            </p>
          </div>

          {getTodosForDate(currentDate).length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>No tasks for this day</p>
              <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Add tasks with due dates or scheduled dates to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {getTodosForDate(currentDate).map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${todo.completed ? 'opacity-60' : ''}`}
                  style={{
                    backgroundColor: 'var(--muted)',
                    borderColor: todo.priority === 'high' ? '#ef4444' : '#22c55e',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4
                        className={`text-lg font-medium mb-2 ${todo.completed ? 'line-through' : ''}`}
                        style={{ color: 'var(--foreground)' }}
                      >
                        {todo.title}
                      </h4>
                      {todo.description && (
                        <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                          {todo.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {todo.scheduledDate && isSameDay(new Date(todo.scheduledDate), currentDate) && (
                          <span
                            className="flex items-center gap-1 px-3 py-1 rounded-full"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                          >
                            <CalendarIcon size={14} />
                            Scheduled for today
                          </span>
                        )}
                        {todo.dueDate && isSameDay(new Date(todo.dueDate), currentDate) && (
                          <span
                            className="flex items-center gap-1 px-3 py-1 rounded-full"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                          >
                            <Clock size={14} />
                            Due today
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full ${
                            todo.priority === 'high'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}
                        >
                          {todo.priority === 'high' ? 'High Priority' : 'Low Priority'}
                        </span>
                        <span style={{ color: 'var(--muted-foreground)' }}>
                          Created {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ml-4 ${
                        todo.completed ? 'bg-green-500 border-green-500 text-white' : 'hover:border-green-500'
                      }`}
                      style={!todo.completed ? { borderColor: 'var(--border)' } : {}}
                    >
                      {todo.completed && <Check size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

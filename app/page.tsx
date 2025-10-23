// filepath: /Users/ethanxu/YanToDoList/app/page.tsx
'use client'

import { useState, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Check, Trash2, Calendar, CalendarX, User, Clock, AlertCircle, Edit3, Save, X, Flag, ArrowUp, ArrowDown, SortAsc, Settings, Sparkles, Download, Upload, LogIn, Loader2, BarChart3, CalendarDays, List, GitBranch, Copy } from 'lucide-react'
import { APP_VERSION } from '@/lib/version'

const CLIENT_VERSION = APP_VERSION
import { format, isAfter, isBefore, startOfDay, addDays } from 'date-fns'
import { useTodos } from '@/hooks/useTodos'
import { useSettings } from '@/hooks/useSettings'
import AuthModal from '@/components/AuthModal'
import UserProfile from '@/components/UserProfile'
import LocalDataMigration from '@/components/LocalDataMigration'
import CalendarView from '@/components/CalendarView'
import AnalyticsView from '@/components/AnalyticsView'

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

export default function Home() {
  // Authentication and cloud sync
  const { status: sessionStatus } = useSession()
  const {
    todos: cloudTodos, 
    isLoading: todosLoading, 
    error: todosError,
    addTodo: addCloudTodo,
    updateTodo: updateCloudTodo,
    deleteTodo: deleteCloudTodo,
    isAuthenticated 
  } = useTodos()
  
  // Cloud settings management
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    generateRecommendation,
    generateRandomNumber,
      saveAlgorithmResults,
    dismissRecommendation,
  } = useSettings()
  
  // Auth UI state
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Use cloud todos when authenticated, otherwise use empty array
  const todos = isAuthenticated ? cloudTodos : []
  const isUnauthenticated = sessionStatus === 'unauthenticated'
  
  // Local UI state (not synced)
  const [newTodo, setNewTodo] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newScheduledDate, setNewScheduledDate] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'high'>('low')
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editDateValue, setEditDateValue] = useState('')
  const [editingScheduled, setEditingScheduled] = useState<string | null>(null)
  const [editScheduledValue, setEditScheduledValue] = useState('')
  const [editingPriority, setEditingPriority] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [recommendedTask, setRecommendedTask] = useState<Todo | null>(null)
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'analytics'>('list')
  const [serverVersion, setServerVersion] = useState<string | null>(null)
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false)
  const dismissedVersionRef = useRef<string | null>(null)
  
  // Loading/processing states
  const [isAdding, setIsAdding] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // Cloud settings with fallbacks
  const filter = settings?.filter ?? 'all'
  const sortBy = settings?.sortBy ?? 'created'
  const priorityFirst = settings?.priorityFirst ?? true
  const advancedRecommendations = settings?.advancedRecommendations ?? false
  const statsForNerds = settings?.statsForNerds ?? false
  const numCategories = settings?.numCategories ?? 3
  const useCustomBase = settings?.useCustomBase ?? false
  const customBase = settings?.customBase ?? 2.93
  const useHalfWeight = settings?.useHalfWeight ?? false
  // Keep a local draft of the custom base so users can type partial decimals like "2." without it snapping
  const [customBaseInput, setCustomBaseInput] = useState(customBase.toString())
  useEffect(() => {
    // When cloud value changes (other device or save), sync the input
    setCustomBaseInput(customBase.toString())
  }, [customBase])
  
  // Algorithm results from cloud
  const randomNumber = settings?.lastRandomNumber ?? null
  const selectedCategory = settings?.lastSelectedCategory ?? null
  const generatedSum = settings?.lastGeneratedSum ?? null
  const generatedRandomValue = settings?.lastGeneratedRandomValue ?? null
  const generatedAt = settings?.lastGeneratedAt ? format(new Date(settings.lastGeneratedAt), 'MMM d, yyyy \'at\' h:mm a') : null
  const lastRecommendationTime = settings?.lastRecommendationTime ? format(new Date(settings.lastRecommendationTime), 'MMM d, yyyy \'at\' h:mm a') : null
  
  // Real-time calculated values for display
  const [currentSum, setCurrentSum] = useState<number>(0)
  const [currentProbabilities, setCurrentProbabilities] = useState<number[]>([])
  
  // Track current date to trigger recalculation when day changes
  const [currentDate, setCurrentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // NOTE: Todos are now loaded from cloud via useTodos() hook
  // Settings are now loaded from cloud via useSettings() hook
  // No more localStorage usage for user data
  
  // Load recommended task from cloud settings
  useEffect(() => {
    // Only update local recommendedTask if a valid, active todo matches the saved ID.
    // Do not auto-clear server state here to avoid accidental disappearance; clearing is explicit via dismiss.
    if (settings?.lastRecommendedTodoId) {
      const task = todos.find(t => t.id === settings.lastRecommendedTodoId)
      if (task && !task.completed) {
        setRecommendedTask(task)
        return
      }
    }
    setRecommendedTask(null)
  }, [settings?.lastRecommendedTodoId, settings?.lastRecommendationTime, todos])

  // Check for day changes to trigger weight recalculation
  useEffect(() => {
    const checkDayChange = () => {
      const newDate = format(new Date(), 'yyyy-MM-dd')
      if (newDate !== currentDate) {
        setCurrentDate(newDate)
      }
    }

    // Check immediately
    checkDayChange()
    
    // Check every minute for day changes
    const intervalId = setInterval(checkDayChange, 60000)

    return () => {
      clearInterval(intervalId)
    }
  }, [currentDate])

  useEffect(() => {
    let isMounted = true

    const checkVersion = async () => {
      try {
        const response = await fetch('/api/version', { cache: 'no-store' })
        if (!response.ok) return

        const data = await response.json()
        if (!isMounted) return

        const latestVersion: string | null = data?.version ?? null
        setServerVersion(latestVersion)

        if (latestVersion && latestVersion !== CLIENT_VERSION) {
          if (dismissedVersionRef.current !== latestVersion) {
            setShowRefreshPrompt(true)
          }
        } else {
          setShowRefreshPrompt(false)
        }
      } catch (error) {
        console.error('Error checking application version:', error)
      }
    }

    checkVersion()
    const intervalId = setInterval(checkVersion, 60000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  // Save todos to localStorage whenever todos change (for offline backup)
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('yan-todos-backup', JSON.stringify(todos))
    }
  }, [todos])

  const addTodo = async () => {
    if (!newTodo.trim()) return
    
    if (!isAuthenticated) {
      setShowAuthModal(true)
      showNotification('Please sign in to add todos', 'info')
      return
    }

    try {
      setIsAdding(true)
      await addCloudTodo({
        title: newTodo.trim(),
        completed: false,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate + 'T00:00:00') : null,
        scheduledDate: newScheduledDate ? new Date(newScheduledDate + 'T00:00:00') : null,
      })
      
      setNewTodo('')
      setNewDueDate('')
      setNewScheduledDate('')
      setNewPriority('low')
      showNotification('Task added successfully!', 'success')
    } catch (error) {
      console.error('Error adding todo:', error)
      showNotification('Failed to add task', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const toggleTodo = async (id: string) => {
    if (!isAuthenticated) return
    
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    
    try {
      await updateCloudTodo(id, { completed: !todo.completed })
      
      // Clear recommendation if the recommended task is being completed
      if (recommendedTask && recommendedTask.id === id && !todo.completed) {
        dismissRecommendation()
      }
    } catch (error) {
      console.error('Error toggling todo:', error)
      showNotification('Failed to update task', 'error')
    }
  }

  const deleteTodo = async (id: string) => {
    if (!isAuthenticated) return
    
    try {
      await deleteCloudTodo(id)
      showNotification('Task deleted', 'success')
    } catch (error) {
      console.error('Error deleting todo:', error)
      showNotification('Failed to delete task', 'error')
    }
  }

  const updateTodoDueDate = async (id: string, dueDate: Date | undefined | null) => {
    if (!isAuthenticated) return
    
    try {
      await updateCloudTodo(id, { dueDate: dueDate || null })
    } catch (error) {
      console.error('Error updating due date:', error)
      showNotification('Failed to update due date', 'error')
    }
  }

  const startEditingDate = (todoId: string, currentDate?: Date | null) => {
    setEditingDate(todoId)
    setEditDateValue(currentDate ? format(currentDate, 'yyyy-MM-dd') : '')
  }

  const saveEditedDate = (todoId: string) => {
    if (editDateValue) {
      updateTodoDueDate(todoId, new Date(editDateValue + 'T00:00:00'))
    } else {
      updateTodoDueDate(todoId, null)
    }
    setEditingDate(null)
    setEditDateValue('')
  }

  const cancelEditingDate = () => {
    setEditingDate(null)
    setEditDateValue('')
  }

  const updateTodoScheduledDate = async (id: string, scheduledDate: Date | undefined | null) => {
    if (!isAuthenticated) return

    try {
      await updateCloudTodo(id, { scheduledDate: scheduledDate || null })
    } catch (error) {
      console.error('Error updating scheduled date:', error)
      showNotification('Failed to update scheduled date', 'error')
    }
  }

  const startEditingScheduledDate = (todoId: string, currentDate?: Date | null) => {
    setEditingScheduled(todoId)
    setEditScheduledValue(currentDate ? format(currentDate, 'yyyy-MM-dd') : '')
  }

  const saveEditedScheduledDate = (todoId: string) => {
    if (editScheduledValue) {
      updateTodoScheduledDate(todoId, new Date(editScheduledValue + 'T00:00:00'))
    } else {
      updateTodoScheduledDate(todoId, null)
    }
    setEditingScheduled(null)
    setEditScheduledValue('')
  }

  const cancelEditingScheduledDate = () => {
    setEditingScheduled(null)
    setEditScheduledValue('')
  }

  const updateTodoTitle = async (id: string, title: string) => {
    if (!isAuthenticated) return
    
    try {
      await updateCloudTodo(id, { title })
    } catch (error) {
      console.error('Error updating title:', error)
      showNotification('Failed to update title', 'error')
    }
  }

  const startEditingTitle = (todoId: string, currentTitle: string) => {
    setEditingTitle(todoId)
    setEditTitleValue(currentTitle)
  }

  const saveEditedTitle = (todoId: string) => {
    const trimmedTitle = editTitleValue.trim()
    if (trimmedTitle && trimmedTitle !== todos.find(t => t.id === todoId)?.title) {
      updateTodoTitle(todoId, trimmedTitle)
    }
    setEditingTitle(null)
    setEditTitleValue('')
  }

  const cancelEditingTitle = () => {
    setEditingTitle(null)
    setEditTitleValue('')
  }

  const updateTodoPriority = async (id: string, priority: 'low' | 'high') => {
    if (!isAuthenticated) return
    
    try {
      await updateCloudTodo(id, { priority })
    } catch (error) {
      console.error('Error updating priority:', error)
      showNotification('Failed to update priority', 'error')
    }
  }

  const togglePriority = (id: string, currentPriority: 'low' | 'high') => {
    const priorities: ('low' | 'high')[] = ['low', 'high']
    const currentIndex = priorities.indexOf(currentPriority)
    const nextIndex = (currentIndex + 1) % priorities.length
    updateTodoPriority(id, priorities[nextIndex])
  }

  const isOverdue = (todo: Todo) => {
    if (!todo.dueDate || todo.completed) return false
    return isBefore(startOfDay(new Date(todo.dueDate)), startOfDay(new Date()))
  }

  const getDueDateStatus = (todo: Todo) => {
    if (!todo.dueDate) return null
    const today = startOfDay(new Date())
    const dueDate = startOfDay(new Date(todo.dueDate))
    
    if (isBefore(dueDate, today)) return 'overdue'
    if (dueDate.getTime() === today.getTime()) return 'today'
    if (isBefore(dueDate, addDays(today, 3))) return 'soon'
    return 'upcoming'
  }

  // Calculate task weights using useMemo to prevent infinite loops
  const { weights: taskWeights, sum: totalWeight } = useMemo(() => {
    if (!advancedRecommendations) {
      return { weights: {}, sum: 0 }
    }

    const today = startOfDay(new Date())
    const activeTodos = todos.filter(todo => {
      if (todo.completed) return false
      if (todo.scheduledDate) {
        const scheduledDate = startOfDay(new Date(todo.scheduledDate))
        if (isAfter(scheduledDate, today)) {
          return false
        }
      }
      return true
    })
    const weights: { [key: string]: number } = {}
    let sum = 0

    for (const todo of activeTodos) {
      let weight: number

      if (todo.dueDate) {
        // Calculate days until due date
        const today = startOfDay(new Date())
        const dueDate = startOfDay(new Date(todo.dueDate))
        const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        // Apply the same logic as Swift code
        const doubleDays: number = daysDifference > 0 ? daysDifference : 1 / (-daysDifference + 2)
        weight = 1 / doubleDays
      } else {
        // If no due date, give it a moderate weight (equivalent to ~7 days)
        weight = 1 / 7
      }

      // Apply priority multiplier: low=1, high=2
      const priorityMultiplier = todo.priority === 'high' ? 2 : 1
      weight *= priorityMultiplier

      weights[todo.id] = weight
      sum += weight
    }

    return { weights, sum }
  }, [todos, advancedRecommendations, currentDate])

  // Check if YanAlgorithm results are outdated (moved after totalWeight calculation)
  const isYanResultsOutdated = useMemo(() => {
    if (!settings?.lastSettingsSnapshot || !settings?.lastGeneratedAt) return false
    
    const savedSettings = settings.lastSettingsSnapshot as any
    
    // Match the API logic exactly
    let calculatedBase = totalWeight || 2.93
    if (useHalfWeight) {
      calculatedBase = calculatedBase / 2
    }
    const currentEffectiveBase = useCustomBase ? customBase : calculatedBase
    
    return !(
      savedSettings.numCategories === numCategories &&
      savedSettings.useCustomBase === useCustomBase &&
      savedSettings.useHalfWeight === useHalfWeight &&
      savedSettings.customBase === customBase &&
      Math.abs(savedSettings.effectiveBase - currentEffectiveBase) < 0.001
    )
  }, [settings, numCategories, useCustomBase, customBase, useHalfWeight, totalWeight])

  // Recalculate probabilities whenever any parameter that affects them changes
  useEffect(() => {
    calculateCurrentProbabilities()
  }, [totalWeight, useHalfWeight, useCustomBase, customBase, numCategories])

  // Initial calculation on component mount
  useEffect(() => {
    calculateCurrentProbabilities()
  }, [])

  // Setting update functions that sync to cloud
  const setFilter = (newFilter: typeof filter) => updateSettings({ filter: newFilter })
  const setSortBy = (newSortBy: typeof sortBy) => updateSettings({ sortBy: newSortBy })
  const setPriorityFirst = (newPriorityFirst: boolean) => updateSettings({ priorityFirst: newPriorityFirst })
  const setAdvancedRecommendations = (newAdvancedRecommendations: boolean) => updateSettings({ advancedRecommendations: newAdvancedRecommendations })
  const setStatsForNerds = (newStatsForNerds: boolean) => updateSettings({ statsForNerds: newStatsForNerds })
  const setNumCategories = (newNumCategories: number) => updateSettings({ numCategories: newNumCategories })
  const setUseCustomBase = (newUseCustomBase: boolean) => updateSettings({ useCustomBase: newUseCustomBase })
  const setCustomBase = (newCustomBase: number) => updateSettings({ customBase: newCustomBase })
  const setUseHalfWeight = (newUseHalfWeight: boolean) => updateSettings({ useHalfWeight: newUseHalfWeight })

  // Helper function to check if YanAlgorithm settings have changed
  // This is now computed in the useMemo above
  const checkYanResultsValidity = () => {
    // Results validity is now computed in real-time via useMemo
    // No need to set state here
  }

  const handleRefreshNow = () => {
    window.location.reload()
  }

  const handleDismissVersionPrompt = () => {
    dismissedVersionRef.current = serverVersion
    setShowRefreshPrompt(false)
  }

  // Check validity whenever relevant settings change
  useEffect(() => {
    checkYanResultsValidity()
  }, [numCategories, useCustomBase, customBase, useHalfWeight, totalWeight])
  
  const handleCustomBaseInputChange = (value: string) => {
    // Allow only digits and a single decimal point; support partial values like "", ".", and "2."
    const sanitized = value.replace(/[^\d.]/g, '')
    const parts = sanitized.split('.')
    const normalized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized

    const isPartialNumeric = normalized === '' || normalized === '.' || /^(\d+)(\.)?$/.test(normalized) || /^(\d*)\.(\d*)$/.test(normalized)
    if (!isPartialNumeric) return

    setCustomBaseInput(normalized)

    // Commit only when the value represents a complete number (not empty, not just '.', and not ending with '.')
    if (normalized !== '' && normalized !== '.' && !normalized.endsWith('.')) {
      const numValue = parseFloat(normalized)
      if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 20) {
        setCustomBase(numValue)
      }
    }
  }

  const handleCustomBaseInputBlur = () => {
    // On blur, commit if valid, otherwise reset to the current saved value
    if (customBaseInput !== '' && customBaseInput !== '.' && !customBaseInput.endsWith('.')) {
      const numValue = parseFloat(customBaseInput)
      if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 20) {
        if (numValue !== customBase) setCustomBase(numValue)
        setCustomBaseInput(numValue.toString())
        return
      }
    }
    setCustomBaseInput(customBase.toString())
  }

  const resetCustomBase = () => {
    setCustomBase(2.93)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value)
      showNotification(successMessage, 'success')
    } catch (error) {
      console.error('Clipboard copy failed:', error)
      showNotification('Could not copy to clipboard', 'error')
    }
  }

  // Calculate current base and probabilities in real-time
  const calculateCurrentProbabilities = () => {
    // Calculate the current base
    let calculatedBase = totalWeight || 2.93
    if (useHalfWeight) {
      calculatedBase = calculatedBase / 2
    }
    const base = useCustomBase ? customBase : calculatedBase
    
    // Create categories dynamically based on numCategories
    const categories = Array.from({ length: numCategories }, (_, i) => i + 1)
    
    // Calculate sum using base^(i+1) for each category
    let sum = 0
    for (let i = 0; i < categories.length; i++) {
      sum += Math.pow(base, i + 1)
    }
    
    // Calculate probabilities for each category
    const probabilities = categories.map((_, i) => {
      return (Math.pow(base, i + 1) / sum) * 100
    })
    
    setCurrentSum(sum)
    setCurrentProbabilities(probabilities)
  }

  const exportTasks = () => {
    if (todos.length === 0) {
      showNotification('No tasks to export. Add some tasks first!', 'info')
      return
    }
    
    try {
      const dataToExport = {
        tasks: todos,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        metadata: {
          totalTasks: todos.length,
          completedTasks: todos.filter(t => t.completed).length,
          activeTasks: todos.filter(t => !t.completed).length
        }
      }
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yan-todolist-export-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showNotification(`Successfully exported ${todos.length} tasks!`, 'success')
    } catch (error) {
      console.error('Export error:', error)
      showNotification('Error exporting tasks. Please try again.', 'error')
    }
  }

  const importTasks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAuthenticated) {
      setShowAuthModal(true)
      showNotification('Please sign in to import tasks', 'info')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setIsImporting(true)
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // Validate the import data structure
        if (!data.tasks || !Array.isArray(data.tasks)) {
          showNotification('Invalid file format. Please select a valid YanToDoList export file.', 'error')
          return
        }
        
        // Convert date strings back to Todo objects for cloud sync
        type ImportedTask = {
          title: string
          description?: string
          completed: boolean
          priority: 'low' | 'high'
          dueDate: Date | null
        }
        
        const importedTasks: ImportedTask[] = data.tasks.map((task: any, index: number) => {
          try {
            return {
              title: task.title || 'Untitled Task',
              description: task.description,
              completed: Boolean(task.completed),
              priority: (['low', 'high'].includes(task.priority) ? task.priority : 'low') as 'low' | 'high',
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
            }
          } catch (taskError) {
            console.warn(`Error parsing task ${index}:`, taskError)
            return null
          }
        }).filter((task: ImportedTask | null): task is ImportedTask => task !== null) // Remove any failed tasks
        
        if (importedTasks.length === 0) {
          showNotification('No valid tasks found in the import file.', 'error')
          return
        }
        
        // Ask user how to handle the import
        const hasExistingTasks = todos.length > 0
        let shouldReplace = false
        
        if (hasExistingTasks) {
          shouldReplace = confirm(
            `Found ${importedTasks.length} tasks to import.\n\n` +
            `You currently have ${todos.length} tasks.\n\n` +
            `Click OK to REPLACE all current tasks\n` +
            `Click Cancel to ADD to current tasks`
          )
        }
        
        try {
          // If replacing, delete all existing todos first
          if (shouldReplace && hasExistingTasks) {
            await Promise.all(todos.map(todo => deleteCloudTodo(todo.id)))
          }
          
          // Add all imported tasks
          await Promise.all(importedTasks.map((task) => addCloudTodo(task as Parameters<typeof addCloudTodo>[0])))
          
          const message = shouldReplace || !hasExistingTasks
            ? `Replaced all tasks with ${importedTasks.length} imported tasks!`
            : `Added ${importedTasks.length} tasks to your existing tasks!`
          
          showNotification(message, 'success')
        } catch (error) {
          console.error('Error importing tasks to cloud:', error)
          showNotification('Error importing some tasks. Please try again.', 'error')
        } finally {
          setIsImporting(false)
        }
      } catch (error) {
        console.error('Import error:', error)
        showNotification('Error importing file. Please make sure it\'s a valid JSON file.', 'error')
        setIsImporting(false)
      }
    }
    
    reader.onerror = () => {
      showNotification('Error reading file. Please try again.', 'error')
      setIsImporting(false)
    }
    
    reader.readAsText(file)
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  const generateRandomRecommendation = async () => {
    // Filter out completed tasks and tasks scheduled for the future
    const today = startOfDay(new Date())
    const activeTodos = todos.filter(todo => {
      if (todo.completed) return false
      if (todo.scheduledDate) {
        const scheduledDate = startOfDay(new Date(todo.scheduledDate))
        if (isAfter(scheduledDate, today)) {
          return false
        }
      }
      return true
    })
    
    if (activeTodos.length === 0) {
      setRecommendedTask(null)
      return
    }

    setIsGeneratingRecommendation(true)
    
    try {
      const result = await generateRecommendation()
      if (result?.recommendation) {
        setRecommendedTask(result.recommendation)
        showNotification('New task recommendation generated!', 'success')
      }
    } catch (error) {
      console.error('Error generating recommendation:', error)
      showNotification('Failed to generate recommendation', 'error')
    } finally {
      setIsGeneratingRecommendation(false)
    }
  }

  const dismissRecommendationLocal = async () => {
    setRecommendedTask(null)
    await dismissRecommendation()
  }

  const generateRandomNumberLocal = async () => {
      // Generate numbers instantly on client side
      try {
        // Calculate the current base (same logic as calculateCurrentProbabilities)
        let calculatedBase = totalWeight || 2.93
        if (useHalfWeight) {
          calculatedBase = calculatedBase / 2
        }
        const base = useCustomBase ? customBase : calculatedBase
      
        // Create categories dynamically based on numCategories
        const categories = Array.from({ length: numCategories }, (_, i) => i + 1)
      
        // Calculate sum using base^(i+1) for each category
        let sum = 0
        for (let i = 0; i < categories.length; i++) {
          sum += Math.pow(base, i + 1)
        }
      
        // Generate random number between 0 and sum
        const randomValue = Math.random() * sum
      
        // Find selected category using cumulative weights
        let cumulative = 0
        let selectedCategory: number | null = null
      
        for (let i = 0; i < numCategories; i++) {
          cumulative += Math.pow(base, i + 1)
          if (randomValue < cumulative) {
            selectedCategory = i + 1
            break
          }
        }
      
        const generatedAt = new Date()
      
        // Round values for storage
        const finalRandomNumber = Math.floor(randomValue * 1000) / 1000
        const finalSum = Math.floor(sum * 1000) / 1000
        const finalRandomValue = Math.floor(randomValue * 1000) / 1000
      
        // Create settings snapshot
        const settingsSnapshot = {
          numCategories,
          useCustomBase,
          customBase, // Save the actual custom base value
          useHalfWeight,
          effectiveBase: base, // This is what we actually used for calculations
          totalWeight
        }
      
        // Save to server in background (optimistic update will make it appear instant)
        saveAlgorithmResults({
          randomNumber: finalRandomNumber,
          selectedCategory: selectedCategory!,
          generatedSum: finalSum,
          generatedRandomValue: finalRandomValue,
          generatedAt,
          settingsSnapshot
        })
      
        showNotification('Random number generated!', 'success')
      } catch (error) {
        console.error('Error generating random number:', error)
        showNotification('Failed to generate random number', 'error')
      }
  }

  const isCompletedView = filter === 'completed'

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    if (filter === 'overdue') return isOverdue(todo)
    return true
  }).sort((a, b) => {
    // Priority sorting: high -> low (only if priorityFirst is enabled)
    if (priorityFirst && a.priority !== b.priority) {
      const priorityOrder = { 'high': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) {
        const createdComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        return isCompletedView ? -createdComparison : createdComparison
      }
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      const dueDateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      return isCompletedView ? -dueDateComparison : dueDateComparison
    }
    const createdComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return isCompletedView ? -createdComparison : createdComparison
  })

  return (
    <main className="min-h-screen">
      {/* Notification Toast */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 min-w-[300px] ${
            notification.type === 'success' 
              ? 'border-green-500 bg-green-50 text-green-800' 
              : notification.type === 'error'
              ? 'border-red-500 bg-red-50 text-red-800'
              : 'border-blue-500 bg-blue-50 text-blue-800'
          }`}
          style={{
            backgroundColor: notification.type === 'success' 
              ? '#f0fdf4' 
              : notification.type === 'error'
              ? '#fef2f2'
              : '#eff6ff'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showRefreshPrompt && serverVersion && (
        <div className="mb-6">
          <div
            className="rounded-lg border px-4 py-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)', color: 'var(--accent-foreground)' }}
          >
            <div>
              <p className="font-semibold">New version available</p>
              <p className="text-sm opacity-90">
                You are on v{CLIENT_VERSION}. The latest version is v{serverVersion}. Refresh to load the newest experience.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDismissVersionPrompt}
                className="px-4 py-2 rounded-md border text-sm transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--muted-foreground)'
                }}
              >
                Later
              </button>
              <button
                onClick={handleRefreshNow}
                className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                Refresh Now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="mb-8">
        <div className="relative text-center">
          <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--foreground)'}}>YanToDoList</h1>
          
          {/* User Profile - positioned in top left */}
          <div className="absolute top-0 left-0">
            <UserProfile onSignInClick={() => setShowAuthModal(true)} />
          </div>
          
          {/* Settings Toggle - positioned in top right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg transition-colors opacity-50 hover:opacity-100"
              style={{color: 'var(--muted-foreground)'}}
              title="Advanced Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Advanced Settings Panel */}
        {showSettings && (
          <div 
            className="mt-4 p-4 rounded-lg border-l-4 border-blue-500"
            style={{backgroundColor: 'var(--muted)', color: 'var(--card-foreground)'}}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-blue-500" />
                <div>
                  <h3 className="font-medium" style={{color: 'var(--card-foreground)'}}>
                    Advanced Task Recommendations
                  </h3>
                  <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
                    Enable AI-powered task suggestions and smart recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdvancedRecommendations(!advancedRecommendations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  advancedRecommendations ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                style={!advancedRecommendations ? {backgroundColor: 'var(--border)'} : {}}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    advancedRecommendations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {advancedRecommendations && (
              <div className="mt-3 p-3 rounded-md" style={{backgroundColor: 'var(--accent)'}}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm" style={{color: 'var(--muted-foreground)'}}>
                    Advanced recommendations enabled
                  </span>
                </div>
              </div>
            )}

            {/* Data Management Section */}
            <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--border)'}}>
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-blue-500">💾</div>
                  <div>
                    <h3 className="font-medium" style={{color: 'var(--card-foreground)'}}>
                      Data Management
                    </h3>
                    <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
                      Export your tasks or import from a backup file
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Export Button */}
                  <button
                    onClick={exportTasks}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    title="Export all tasks to a JSON file"
                  >
                    <Download size={16} />
                    Export Tasks
                  </button>
                  
                  {/* Import Button */}
                  <label className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer ${
                    isImporting ? 'bg-green-400 cursor-wait' : 'bg-green-500 hover:bg-green-600'
                  }`}>
                    {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {isImporting ? 'Importing...' : 'Import Tasks'}
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTasks}
                      className="hidden"
                      title="Import tasks from a JSON file"
                      disabled={isImporting}
                    />
                  </label>
                </div>
                
                <div className="mt-2 text-xs space-y-1" style={{color: 'var(--muted-foreground)'}}>
                  <div className="flex items-center justify-between">
                    <span>• Export: Download all tasks as JSON</span>
                    <span className="font-mono px-2 py-1 rounded" style={{backgroundColor: 'var(--accent)'}}>
                      {todos.length} tasks
                    </span>
                  </div>
                  <div>• Import: Upload JSON to restore tasks</div>
                </div>
              </div>
            </div>

            {/* Stats for Nerds Option */}
            <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--border)'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-green-500">🤓</div>
                  <div>
                    <h3 className="font-medium" style={{color: 'var(--card-foreground)'}}>
                      Stats for Nerds
                    </h3>
                    <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
                      Show debug information and development tools
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStatsForNerds(!statsForNerds)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    statsForNerds ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={!statsForNerds ? {backgroundColor: 'var(--border)'} : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      statsForNerds ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Debug Panel for Stats for Nerds */}
      {statsForNerds && (
        <div className="mb-6">
          <div 
            className="rounded-lg shadow-md p-4 border-l-4 border-green-500"
            style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500">🤓</div>
              <h2 className="text-lg font-semibold" style={{color: 'var(--card-foreground)'}}>
                Debug Panel
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weight Statistics */}
              <div 
                className="p-3 rounded-md"
                style={{backgroundColor: 'var(--muted)'}}
              >
                <h3 className="font-medium mb-2" style={{color: 'var(--card-foreground)'}}>
                  Weight Statistics
                </h3>
                <div className="space-y-1 text-sm" style={{color: 'var(--muted-foreground)'}}>
                  <div className="flex justify-between">
                    <span>Total Weight:</span>
                    <span className="font-mono">{totalWeight.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tasks:</span>
                    <span className="font-mono">{todos.filter(t => !t.completed).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has Weights:</span>
                    <span className="font-mono">{Object.keys(taskWeights).length > 0 ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Weighted Random Algorithm */}
              <div 
                className="p-3 rounded-md"
                style={{backgroundColor: 'var(--muted)'}}
              >
                <h3 className="font-medium mb-3" style={{color: 'var(--card-foreground)'}}>
                  YanAlgorithm (those who know)
                </h3>
                
                {/* Category Number Selector */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--card-foreground)'}}>
                    Number of Categories:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={numCategories}
                      onChange={(e) => setNumCategories(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div 
                      className="px-3 py-1 rounded font-mono text-sm font-bold min-w-[3rem] text-center"
                      style={{backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}
                    >
                      {numCategories}
                    </div>
                  </div>
                  <div className="text-xs mt-1" style={{color: 'var(--muted-foreground)'}}>
                    Categories: {Array.from({ length: numCategories }, (_, i) => i + 1).join(', ')}
                  </div>
                </div>

                {/* Custom Base Toggle */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{color: 'var(--card-foreground)'}}>
                      Custom Base:
                    </label>
                    <button
                      onClick={() => setUseCustomBase(!useCustomBase)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        useCustomBase ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={!useCustomBase ? {backgroundColor: 'var(--border)'} : {}}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          useCustomBase ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {useCustomBase && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customBaseInput}
                          onChange={(e) => handleCustomBaseInputChange(e.target.value)}
                          onBlur={handleCustomBaseInputBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            }
                          }}
                          placeholder="Enter base value"
                          className="flex-1 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--input)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                        />
                        <button
                          onClick={resetCustomBase}
                          className="px-2 py-1 text-xs rounded transition-colors hover:opacity-80"
                          style={{backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}
                          title="Reset to default (2.93)"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="text-xs space-y-1" style={{color: 'var(--muted-foreground)'}}>
                        <div>Valid range: 0.1 - 20.0</div>
                        <div>Using custom base instead of calculated task weights</div>
                      </div>
                    </div>
                  )}
                  
                  {!useCustomBase && (
                    <div className="text-xs" style={{color: 'var(--muted-foreground)'}}>
                      Using calculated base from task weights ({totalWeight > 0 ? totalWeight.toFixed(3) : '2.930'})
                      {useHalfWeight && <span className="ml-1 text-orange-500 font-medium">(halved)</span>}
                    </div>
                  )}
                </div>

                {/* Half Weight Toggle */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium" style={{color: 'var(--card-foreground)'}}>
                        Use Half Weight:
                      </label>
                      <div 
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{
                          backgroundColor: useHalfWeight ? 'var(--orange)' : 'var(--muted)',
                          color: useHalfWeight ? 'white' : 'var(--muted-foreground)'
                        }}
                        title={useHalfWeight ? 'Using half of calculated weights' : 'Using full calculated weights'}
                      >
                        {useHalfWeight ? '½' : '1'}
                      </div>
                    </div>
                    <button
                      onClick={() => setUseHalfWeight(!useHalfWeight)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                        useHalfWeight ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                      style={!useHalfWeight ? {backgroundColor: 'var(--border)'} : {}}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          useHalfWeight ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="text-xs space-y-1" style={{color: 'var(--muted-foreground)'}}>
                    <div>
                      {useHalfWeight 
                        ? 'Weights are divided by 2, creating more balanced probability distribution' 
                        : 'Using full calculated weights for maximum recommendation accuracy'
                      }
                    </div>
                    {useCustomBase && useHalfWeight && (
                      <div className="text-orange-500 font-medium">
                        Note: Half weight only affects calculated base, not custom base
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Algorithm Results */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{color: 'var(--muted-foreground)'}}>Base:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">
                          {useCustomBase 
                            ? customBase.toFixed(3) 
                            : (totalWeight > 0 ? (useHalfWeight ? (totalWeight / 2).toFixed(3) : totalWeight.toFixed(3)) : '2.930')
                          }
                        </span>
                        <div className="flex gap-1">
                          <span 
                            className={`text-xs px-1 rounded font-medium ${
                              useCustomBase 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-blue-500 text-white'
                            }`}
                            title={useCustomBase ? 'Using custom base' : 'Using calculated base from task weights'}
                          >
                            {useCustomBase ? 'C' : 'A'}
                          </span>
                          {useHalfWeight && !useCustomBase && (
                            <span 
                              className="text-xs px-1 rounded font-medium bg-orange-500 text-white"
                              title="Half weight applied"
                            >
                              ½
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span style={{color: 'var(--muted-foreground)'}}>Sum:</span>
                      <span className="font-mono">{currentSum.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{color: 'var(--muted-foreground)'}}>Random:</span>
                      <span className="font-mono">{generatedRandomValue || '?'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{color: 'var(--muted-foreground)'}}>Selected:</span>
                      <div 
                        className="px-2 py-1 rounded font-mono text-sm font-bold"
                        style={{backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}
                      >
                        {selectedCategory || '?'}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Probability Display */}
                  <div className="text-xs space-y-1" style={{color: 'var(--muted-foreground)'}}>
                    <div className="font-medium mb-2" style={{color: 'var(--card-foreground)'}}>Category Probabilities:</div>
                    {currentProbabilities.map((probability, index) => (
                      <div key={index + 1} className="flex justify-between">
                        <span>Chance of {index + 1}:</span>
                        <span className="font-mono">{probability.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <div className="space-y-2">
                    <button
                      onClick={generateRandomNumberLocal}
                      className="w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Generate Weighted Random
                    </button>
                    
                    {isYanResultsOutdated && generatedAt && (
                      <div className="flex items-center justify-center gap-1 text-xs" style={{color: 'var(--muted-foreground)'}}>
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                        <span>Current results are outdated</span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp and Outdated Indicator */}
                  {generatedAt && (
                    <div className="space-y-2">
                      <div className="text-xs text-center" style={{color: 'var(--muted-foreground)'}}>
                        Generated: {generatedAt}
                      </div>
                      {isYanResultsOutdated && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border-l-4 border-orange-500" style={{backgroundColor: 'var(--muted)', color: 'var(--card-foreground)'}}>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Results may be outdated - settings have changed</span>
                          <button
                            onClick={generateRandomNumberLocal}
                            className="ml-2 px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Weights Table (when advanced recommendations are enabled) */}
            {advancedRecommendations && Object.keys(taskWeights).length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2" style={{color: 'var(--card-foreground)'}}>
                  Individual Task Weights
                </h3>
                <div 
                  className="p-3 rounded-md max-h-32 overflow-y-auto"
                  style={{backgroundColor: 'var(--muted)'}}
                >
                  <div className="space-y-1 text-sm">
                    {todos.filter(t => !t.completed).map(todo => (
                      <div key={todo.id} className="flex justify-between items-center">
                        <span 
                          className="truncate max-w-xs"
                          style={{color: 'var(--card-foreground)'}}
                          title={todo.title}
                        >
                          {todo.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono" style={{color: 'var(--muted-foreground)'}}>
                            {useHalfWeight 
                              ? ((taskWeights[todo.id] || 0) / 2).toFixed(4)
                              : (taskWeights[todo.id] || 0).toFixed(4)
                            }
                          </span>
                          <span 
                            className="text-xs px-1 rounded"
                            style={{backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}
                          >
                            {totalWeight > 0 
                              ? useHalfWeight 
                                ? (((taskWeights[todo.id] / 2) / (totalWeight / 2)) * 100).toFixed(1) + '%'
                                : ((taskWeights[todo.id] / totalWeight) * 100).toFixed(1) + '%'
                              : '0%'
                            }
                          </span>
                          {useHalfWeight && (
                            <span 
                              className="text-xs px-1 rounded bg-orange-500 text-white font-bold"
                              title="Half weight applied"
                            >
                              ½
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {todosLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg" style={{color: 'var(--muted-foreground)'}}>Loading your tasks...</p>
        </div>
      )}

      {/* Unauthenticated State */}
      {isUnauthenticated && !todosLoading && (
        <div className="text-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-blue-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{color: 'var(--foreground)'}}>
              Welcome to YanToDoList
            </h2>
            <p className="mb-6" style={{color: 'var(--muted-foreground)'}}>
              Sign in to access your tasks from anywhere, sync across devices, and never lose your progress.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
            >
              Sign In to Get Started
            </button>
            <div className="mt-8 pt-6 border-t" style={{borderColor: 'var(--border)'}}>
              <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
                ✨ AI-powered task recommendations • 📅 Smart due date tracking • 🎯 Priority management
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only shown when authenticated */}
      {isAuthenticated && !todosLoading && (
        <>
      {/* Add Todo Form */}
      <div className="rounded-lg shadow-md p-6 mb-6" style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--input)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)'
              }}
            />
            <button
              onClick={addTodo}
              disabled={isAdding}
              className={`px-6 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 ${
                isAdding ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-2 items-center">
              <Clock size={20} style={{color: 'var(--muted-foreground)'}} />
              <span className="text-sm" style={{color: 'var(--muted-foreground)'}}>Due:</span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {newDueDate && (
                <button
                  onClick={() => setNewDueDate('')}
                  className="hover:opacity-70 text-sm"
                  style={{color: 'var(--muted-foreground)'}}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Calendar size={20} style={{color: 'var(--muted-foreground)'}} />
              <span className="text-sm" style={{color: 'var(--muted-foreground)'}}>Scheduled:</span>
              <input
                type="date"
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
                className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                title="Schedule when this task should appear"
              />
              {newScheduledDate && (
                <button
                  onClick={() => setNewScheduledDate('')}
                  className="hover:opacity-70 text-sm"
                  style={{color: 'var(--muted-foreground)'}}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Flag size={20} style={{color: 'var(--muted-foreground)'}} />
              <div className="flex rounded-lg p-1" style={{backgroundColor: 'var(--muted)'}}>
                <button
                  onClick={() => setNewPriority('low')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                    newPriority === 'low'
                      ? 'bg-green-500 text-white'
                      : 'hover:bg-opacity-70'
                  }`}
                  style={newPriority !== 'low' ? {color: 'var(--muted-foreground)'} : {}}
                >
                  <ArrowDown size={14} />
                  Low
                </button>
                <button
                  onClick={() => setNewPriority('high')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                    newPriority === 'high'
                      ? 'bg-red-500 text-white'
                      : 'hover:bg-opacity-70'
                  }`}
                  style={newPriority !== 'high' ? {color: 'var(--muted-foreground)'} : {}}
                >
                  <ArrowUp size={14} />
                  High
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="mb-6">
        <div className="rounded-lg shadow-md p-1 flex justify-center" style={{backgroundColor: 'var(--card)'}}>
          <button
            onClick={() => setCurrentView('list')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
              currentView === 'list' ? '' : 'hover:bg-opacity-70'
            }`}
            style={currentView === 'list' ? {backgroundColor: 'var(--muted)', color: 'var(--foreground)'} : {color: 'var(--muted-foreground)'}}
          >
            <List size={20} />
            <span className="font-medium">List</span>
          </button>
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
              currentView === 'calendar' ? '' : 'hover:bg-opacity-70'
            }`}
            style={currentView === 'calendar' ? {backgroundColor: 'var(--muted)', color: 'var(--foreground)'} : {color: 'var(--muted-foreground)'}}
          >
            <CalendarDays size={20} />
            <span className="font-medium">Calendar</span>
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
              currentView === 'analytics' ? '' : 'hover:bg-opacity-70'
            }`}
            style={currentView === 'analytics' ? {backgroundColor: 'var(--muted)', color: 'var(--foreground)'} : {color: 'var(--muted-foreground)'}}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Analytics</span>
          </button>
        </div>
      </div>

      {/* Advanced Task Recommendation Section */}
      {advancedRecommendations && currentView === 'list' && (
        <div className="mb-6">
          <div className="rounded-lg shadow-md p-6" style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-blue-500" />
                <h2 className="text-lg font-semibold" style={{color: 'var(--card-foreground)'}}>
                  Task Recommendations
                </h2>
              </div>
              <button
                onClick={generateRandomRecommendation}
                disabled={isGeneratingRecommendation || todos.filter(t => !t.completed).length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isGeneratingRecommendation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Suggest Task
                  </>
                )}
              </button>
            </div>

            {/* Recommended Task Display */}
            {recommendedTask && !isGeneratingRecommendation && (
              <div 
                className="p-4 rounded-lg border-l-4 border-blue-500 relative"
                style={{backgroundColor: 'var(--muted)'}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">✨ Recommended for you</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recommendedTask.priority === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {recommendedTask.priority === 'high' ? '🔥 High Priority' : '📝 Low Priority'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-lg" style={{color: 'var(--card-foreground)'}}>
                        {recommendedTask.title}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(recommendedTask.title, 'Task name copied to clipboard')}
                        className="p-2 rounded-md transition-colors hover:bg-blue-100 hover:text-blue-600"
                        style={{ color: 'var(--muted-foreground)' }}
                        title="Copy task name"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm" style={{color: 'var(--muted-foreground)'}}>
                      <span>Created {format(new Date(recommendedTask.createdAt), 'MMM d, yyyy')}</span>
                      {recommendedTask.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Due {format(new Date(recommendedTask.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      {lastRecommendationTime && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md" style={{backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}>
                          <Sparkles size={12} />
                          Recommended {lastRecommendationTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleTodo(recommendedTask.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                    >
                      Mark Done
                    </button>
                    <button
                      onClick={dismissRecommendationLocal}
                      className="p-1 rounded-md transition-colors"
                      style={{color: 'var(--muted-foreground)'}}
                      title="Dismiss recommendation"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No tasks message */}
            {todos.filter(t => !t.completed).length === 0 && (
              <div className="text-center py-4" style={{color: 'var(--muted-foreground)'}}>
                <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
                <p>No active tasks to recommend!</p>
                <p className="text-sm">Add some tasks to get personalized suggestions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs and Sort Options */}
      {currentView === 'list' && (
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="rounded-lg shadow-md p-1 flex" style={{backgroundColor: 'var(--card)'}}>
          {(['all', 'active', 'completed', 'overdue'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-md capitalize transition-colors ${
                filter === filterType
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-opacity-70'
              }`}
              style={filter !== filterType ? {color: 'var(--muted-foreground)'} : {}}
            >
              {filterType}
              {filterType === 'overdue' && todos.filter(isOverdue).length > 0 && (
                <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">
                  {todos.filter(isOverdue).length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <div className="rounded-lg shadow-md p-1 flex" style={{backgroundColor: 'var(--card)'}}>
            <button
              onClick={() => setSortBy('created')}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                sortBy === 'created'
                  ? ''
                  : 'hover:bg-opacity-70'
              }`}
              style={sortBy === 'created' ? {backgroundColor: 'var(--muted)', color: 'var(--foreground)'} : {color: 'var(--muted-foreground)'}}
            >
              Sort by Created
            </button>
            <button
              onClick={() => setSortBy('dueDate')}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                sortBy === 'dueDate'
                  ? ''
                  : 'hover:bg-opacity-70'
              }`}
              style={sortBy === 'dueDate' ? {backgroundColor: 'var(--muted)', color: 'var(--foreground)'} : {color: 'var(--muted-foreground)'}}
            >
              Sort by Due Date
            </button>
          </div>
          
          <div className="rounded-lg shadow-md p-1" style={{backgroundColor: 'var(--card)'}}>
            <button
              onClick={() => setPriorityFirst(!priorityFirst)}
              className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                priorityFirst
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'hover:bg-opacity-70'
              }`}
              style={!priorityFirst ? {color: 'var(--muted-foreground)'} : {}}
              title={priorityFirst ? 'Priority sorting enabled' : 'Priority sorting disabled'}
            >
              <SortAsc size={16} />
              <span className="hidden sm:inline">
                {priorityFirst ? 'Priority First' : 'No Priority Sort'}
              </span>
              <span className="sm:hidden">
                {priorityFirst ? 'Priority' : 'Standard'}
              </span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Todo List */}
      {currentView === 'list' && (
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto mb-4" style={{color: 'var(--muted-foreground)'}} />
            <p className="text-lg" style={{color: 'var(--muted-foreground)'}}>No tasks found</p>
            <p style={{color: 'var(--muted-foreground)'}}>Add a task to get started!</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const dueDateStatus = getDueDateStatus(todo)
            const statusColors = {
              overdue: 'text-red-600 bg-red-50',
              today: 'text-orange-600 bg-orange-50',
              soon: 'text-yellow-600 bg-yellow-50',
              upcoming: 'text-blue-600 bg-blue-50'
            }
            const scheduledDateValue = todo.scheduledDate ? new Date(todo.scheduledDate) : null
            const isScheduledUpcoming = scheduledDateValue
              ? isAfter(startOfDay(scheduledDateValue), startOfDay(new Date()))
              : false

            const baseCardClasses = `group rounded-lg shadow-md p-4 transition-all hover:shadow-lg relative ${
              todo.completed ? 'opacity-75' : ''
            }`
            const borderClass = isScheduledUpcoming ? 'border-2 border-dashed border-blue-300' : 'border border-transparent'
            const accentColor = dueDateStatus === 'overdue'
              ? '#ef4444'
              : todo.priority === 'high'
              ? '#f97316'
              : null
            const cardClassName = `${baseCardClasses} ${borderClass}`
            const cardStyle: CSSProperties = {
              backgroundColor: 'var(--card)',
              color: 'var(--card-foreground)'
            }

            if (accentColor) {
              cardStyle.borderLeft = `4px solid ${accentColor}`
            }
            
            return (
              <div
                key={todo.id}
                className={cardClassName}
                style={cardStyle}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-1 ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'hover:border-green-500'
                    }`}
                    style={!todo.completed ? {borderColor: 'var(--border)'} : {}}
                  >
                    {todo.completed && <Check size={16} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {editingTitle === todo.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveEditedTitle(todo.id)
                              } else if (e.key === 'Escape') {
                                cancelEditingTitle()
                              }
                            }}
                            className="flex-1 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            style={{
                              backgroundColor: 'var(--input)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            autoFocus
                            placeholder="Enter task name..."
                          />
                          <button
                            onClick={() => saveEditedTitle(todo.id)}
                            className="p-1 text-green-600 rounded transition-colors flex-shrink-0 hover:bg-green-50"
                            title="Save title (Enter)"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEditingTitle}
                            className="p-1 rounded transition-colors flex-shrink-0"
                            style={{color: 'var(--muted-foreground)'}}
                            title="Cancel (Esc)"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <h3
                          className={`font-medium cursor-pointer hover:opacity-70 transition-opacity ${
                            todo.completed
                              ? 'line-through'
                              : ''
                          }`}
                          style={{color: todo.completed ? 'var(--muted-foreground)' : 'var(--card-foreground)'}}
                          onClick={() => !todo.completed && startEditingTitle(todo.id, todo.title)}
                          title={!todo.completed ? "Click to edit task name" : ""}
                        >
                          {todo.title}
                        </h3>
                      )}
                      <button
                        onClick={() => togglePriority(todo.id, todo.priority)}
                        
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                          todo.priority === 'high'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}
                        title={`Click to cycle priority (currently ${todo.priority})`}
                      >
                        {todo.priority === 'high' ? (
                          <>
                            <ArrowUp size={10} />
                            High
                          </>
                        ) : (
                          <>
                            <ArrowDown size={10} />
                            Low
                          </>
                        )}
                      </button>
                      
                      {/* Weight Percentage Display - only show for active tasks when advanced recommendations are enabled */}
                      {advancedRecommendations && !todo.completed && taskWeights[todo.id] && totalWeight > 0 && (
                        <div 
                          className={`px-3 py-1 rounded-full text-xs font-bold border-2 shadow-sm transition-all hover:shadow-md ${
                            useHalfWeight 
                              ? 'bg-orange-500 text-white border-orange-500' 
                              : 'bg-blue-500 text-white border-blue-500'
                          }`}
                          style={{
                            boxShadow: useHalfWeight ? '0 2px 4px rgba(234, 88, 12, 0.1)' : '0 2px 4px rgba(59, 130, 246, 0.1)'
                          }}
                          title={useHalfWeight 
                            ? `Recommendation weight (½): ${(((taskWeights[todo.id] / 2) / (totalWeight / 2)) * 100).toFixed(1)}% chance of being selected`
                            : `Recommendation weight: ${((taskWeights[todo.id] / totalWeight) * 100).toFixed(1)}% chance of being selected`
                          }
                        >
                          <div className="flex items-center gap-1">
                            <Sparkles size={10} className="animate-pulse" />
                            <span className="font-mono">
                              {useHalfWeight 
                                ? (((taskWeights[todo.id] / 2) / (totalWeight / 2)) * 100).toFixed(1)
                                : ((taskWeights[todo.id] / totalWeight) * 100).toFixed(1)
                              }%
                            </span>
                            {useHalfWeight && (
                              <span className="font-bold text-xs">½</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span style={{color: 'var(--muted-foreground)'}}>
                        Created {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                      </span>
                      {(editingScheduled === todo.id || scheduledDateValue) && (
                        editingScheduled === todo.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editScheduledValue}
                              onChange={(e) => setEditScheduledValue(e.target.value)}
                              className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              style={{
                                backgroundColor: 'var(--input)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border)'
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveEditedScheduledDate(todo.id)}
                              className="p-1 text-green-600 rounded transition-colors hover:bg-green-50"
                              title="Save scheduled date"
                            >
                              <Save size={12} />
                            </button>
                            <button
                              onClick={cancelEditingScheduledDate}
                              className="p-1 rounded transition-colors"
                              style={{color: 'var(--muted-foreground)'}}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingScheduledDate(todo.id, scheduledDateValue)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                              isScheduledUpcoming
                                ? 'border-dashed border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100'
                                : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                            }`}
                            title="Click to edit scheduled date"
                          >
                            <CalendarDays size={12} />
                            <span>
                              {isScheduledUpcoming ? 'Scheduled for ' : 'Scheduled on '}
                              {scheduledDateValue ? format(scheduledDateValue, 'MMM d, yyyy') : ''}
                            </span>
                            <Edit3 size={10} className="ml-1 opacity-60" />
                          </button>
                        )
                      )}
                      
                      {todo.dueDate && (
                        <div className="flex items-center gap-1">
                          {editingDate === todo.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={editDateValue}
                                onChange={(e) => setEditDateValue(e.target.value)}
                                className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                style={{
                                  backgroundColor: 'var(--input)',
                                  color: 'var(--foreground)',
                                  border: '1px solid var(--border)'
                                }}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                autoFocus
                              />
                              <button
                                onClick={() => saveEditedDate(todo.id)}
                                
                                className={`p-1 text-green-600 rounded transition-colors hover:bg-green-50`}
                                title="Save date"
                              >
                                <Save size={12} />
                              </button>
                              <button
                                onClick={cancelEditingDate}
                                
                                className="p-1 rounded transition-colors"
                                style={{color: 'var(--muted-foreground)'}}
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors hover:bg-opacity-80 ${
                                dueDateStatus ? statusColors[dueDateStatus] : 'bg-opacity-10'
                              }`}
                              style={!dueDateStatus ? {color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)'} : {}}
                              onClick={() => startEditingDate(todo.id, todo.dueDate)}
                              title="Click to edit due date"
                            >
                              {dueDateStatus === 'overdue' && <AlertCircle size={12} />}
                              {dueDateStatus !== 'overdue' && <Clock size={12} />}
                              <span>
                                {dueDateStatus === 'today' 
                                  ? 'Due today' 
                                  : dueDateStatus === 'overdue'
                                  ? `Overdue by ${Math.ceil((new Date().getTime() - new Date(todo.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                                  : `Due ${format(new Date(todo.dueDate), 'MMM d, yyyy')}`
                                }
                              </span>
                              <Edit3 size={10} className="ml-1 opacity-60" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!todo.scheduledDate && editingScheduled !== todo.id && (
                      <button
                        onClick={() => startEditingScheduledDate(todo.id)}
                        className="p-2 text-blue-500 rounded-lg transition-colors hover:bg-blue-50"
                        title="Add scheduled date"
                      >
                        <CalendarDays size={16} />
                      </button>
                    )}

                    {todo.scheduledDate && editingScheduled !== todo.id && (
                      <button
                        onClick={() => updateTodoScheduledDate(todo.id, undefined)}
                        className="p-2 text-blue-500 rounded-lg transition-colors hover:bg-blue-50"
                        title="Remove scheduled date"
                      >
                        <CalendarX size={16} />
                      </button>
                    )}

                    {!todo.dueDate && editingDate !== todo.id && (
                      <button
                        onClick={() => startEditingDate(todo.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{color: 'var(--muted-foreground)'}}
                        title="Add due date"
                      >
                        <Calendar size={16} />
                      </button>
                    )}
                    
                    {!todo.dueDate && editingDate === todo.id && (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="px-2 py-1 text-xs rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{
                            backgroundColor: 'var(--input)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditedDate(todo.id)}
                          
                          className={`p-1 text-green-600 rounded transition-colors hover:bg-green-50`}
                          title="Save date"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEditingDate}
                          
                          className="p-1 rounded transition-colors"
                          style={{color: 'var(--muted-foreground)'}}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {todo.dueDate && editingDate !== todo.id && (
                      <button
                        onClick={() => updateTodoDueDate(todo.id, undefined)}
                        
                        className={`p-2 text-red-500 rounded-lg transition-colors hover:bg-red-50`}
                        title="Remove due date"
                      >
                        <X size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      
                      className={`p-2 text-red-500 rounded-lg transition-colors hover:bg-red-50`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      )}

      {/* Stats */}
      {currentView === 'list' && (
      <div className="mt-8 rounded-lg shadow-md p-6" style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-500">{todos.length}</p>
            <p style={{color: 'var(--muted-foreground)'}}>Total Tasks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              {todos.filter(t => t.completed).length}
            </p>
            <p style={{color: 'var(--muted-foreground)'}}>Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">
              {todos.filter(t => !t.completed).length}
            </p>
            <p style={{color: 'var(--muted-foreground)'}}>Remaining</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">
              {todos.filter(isOverdue).length}
            </p>
            <p style={{color: 'var(--muted-foreground)'}}>Overdue</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-500">
              {todos.filter(t => t.priority === 'high' && !t.completed).length}
            </p>
            <p style={{color: 'var(--muted-foreground)'}}>High Priority</p>
          </div>
        </div>
      </div>
      )}

      {/* Calendar View */}
      {currentView === 'calendar' && (
        <CalendarView todos={todos} onToggleTodo={toggleTodo} />
      )}

      {/* Analytics View */}
      {currentView === 'analytics' && (
        <AnalyticsView todos={todos} />
      )}
      </>
      )}

      {/* Footer */}
      <footer className="mt-16 py-8">
        <div className="text-center space-y-4">
          {/* Made with heart by */}
          <div className="flex items-center justify-center gap-2">
            <span style={{color: 'var(--muted-foreground)'}}>Made with</span>
            <span className="text-red-500 animate-pulse text-lg">❤️</span>
            <span style={{color: 'var(--muted-foreground)'}}>by</span>
            <span className="font-semibold" style={{color: 'var(--foreground)'}}>
              Ethan Yan Xu
            </span>
          </div>

          {/* Portfolio link */}
          <div>
            <a
              href="https://ethanyanxu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
              style={{
                color: 'var(--primary)',
                backgroundColor: 'var(--muted)',
                borderColor: 'var(--border)'
              }}
            >
              <span>Visit my portfolio</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t" style={{borderColor: 'var(--border)'}}>
            <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
              © {new Date().getFullYear()} YanToDoList. All rights reserved.
            </p>
          </div>

          <div style={{color: 'var(--muted-foreground)'}}>
            <div className="inline-flex items-center gap-2 text-sm font-mono">
              <GitBranch size={16} className="text-blue-500" />
              <span>Version {CLIENT_VERSION}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Local Data Migration */}
      <LocalDataMigration />
    </main>
  )
}
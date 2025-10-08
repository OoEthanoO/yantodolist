// filepath: /Users/ethanxu/YanToDoList/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Calendar, User, Clock, AlertCircle, Edit3, Save, X, Flag, ArrowUp, ArrowDown, SortAsc, Settings, Sparkles, Download, Upload } from 'lucide-react'
import { format, isAfter, isBefore, startOfDay, addDays } from 'date-fns'

interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'high'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'high'>('low')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'created' | 'dueDate'>('created')
  const [priorityFirst, setPriorityFirst] = useState(true)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editDateValue, setEditDateValue] = useState('')
  const [editingPriority, setEditingPriority] = useState<string | null>(null)
  const [advancedRecommendations, setAdvancedRecommendations] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [recommendedTask, setRecommendedTask] = useState<Todo | null>(null)
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false)
  const [taskWeights, setTaskWeights] = useState<{ [key: string]: number }>({})
  const [totalWeight, setTotalWeight] = useState(0)
  const [statsForNerds, setStatsForNerds] = useState(false)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [generatedSum, setGeneratedSum] = useState<number | null>(null)
  const [generatedRandomValue, setGeneratedRandomValue] = useState<number | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [numCategories, setNumCategories] = useState(3)
  const [useCustomBase, setUseCustomBase] = useState(false)
  const [customBase, setCustomBase] = useState(2.93)
  const [customBaseInput, setCustomBaseInput] = useState('2.93')
  const [useHalfWeight, setUseHalfWeight] = useState(false)
  const [lastRecommendationTime, setLastRecommendationTime] = useState<string | null>(null)
  const [isYanResultsOutdated, setIsYanResultsOutdated] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null)
  
  // Real-time calculated values for display
  const [currentSum, setCurrentSum] = useState<number>(0)
  const [currentProbabilities, setCurrentProbabilities] = useState<number[]>([])

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('yan-todos')
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos)
      // Convert date strings back to Date objects and migrate medium priority to low
      const todosWithDates = parsedTodos.map((todo: any) => ({
        ...todo,
        priority: todo.priority === 'medium' ? 'low' : (todo.priority || 'low'), // Migrate medium to low, default to low if no priority
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt)
      }))
      setTodos(todosWithDates)
    }
  }, [])

  // Load user preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('yan-todo-preferences')
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences)
        if (preferences.filter) setFilter(preferences.filter)
        if (preferences.sortBy) setSortBy(preferences.sortBy)
        if (typeof preferences.priorityFirst === 'boolean') setPriorityFirst(preferences.priorityFirst)
        if (typeof preferences.advancedRecommendations === 'boolean') setAdvancedRecommendations(preferences.advancedRecommendations)
        if (typeof preferences.statsForNerds === 'boolean') setStatsForNerds(preferences.statsForNerds)
        if (typeof preferences.numCategories === 'number' && preferences.numCategories >= 2 && preferences.numCategories <= 10) setNumCategories(preferences.numCategories)
        if (typeof preferences.useCustomBase === 'boolean') setUseCustomBase(preferences.useCustomBase)
        if (typeof preferences.customBase === 'number' && preferences.customBase > 0) {
          setCustomBase(preferences.customBase)
          setCustomBaseInput(preferences.customBase.toString())
        }
        if (typeof preferences.useHalfWeight === 'boolean') setUseHalfWeight(preferences.useHalfWeight)
      } catch (error) {
        console.log('Error loading preferences:', error)
      }
    }
  }, [])

  // Load saved recommendation from localStorage on mount
  useEffect(() => {
    const savedRecommendation = localStorage.getItem('yan-last-recommendation')
    if (savedRecommendation) {
      try {
        const recommendation = JSON.parse(savedRecommendation)
        if (recommendation.taskId && recommendation.generatedAt) {
          // Find the task by ID in the current todos
          const task = todos.find(t => t.id === recommendation.taskId)
          if (task && !task.completed) {
            setRecommendedTask(task)
            setLastRecommendationTime(recommendation.generatedAt)
          }
        }
      } catch (error) {
        console.log('Error loading saved recommendation:', error)
      }
    }
  }, [todos])

  // Load saved YanAlgorithm results from localStorage on mount
  useEffect(() => {
    const savedYanResults = localStorage.getItem('yan-algorithm-results')
    if (savedYanResults) {
      try {
        const results = JSON.parse(savedYanResults)
        if (results.randomNumber !== undefined) setRandomNumber(results.randomNumber)
        if (results.selectedCategory !== undefined) setSelectedCategory(results.selectedCategory)
        if (results.generatedSum !== undefined) setGeneratedSum(results.generatedSum)
        if (results.generatedRandomValue !== undefined) setGeneratedRandomValue(results.generatedRandomValue)
        if (results.generatedAt) setGeneratedAt(results.generatedAt)
      } catch (error) {
        console.log('Error loading saved YanAlgorithm results:', error)
      }
    }
  }, [])

  // Load saved YanAlgorithm results from localStorage on mount
  useEffect(() => {
    const savedYanResults = localStorage.getItem('yan-algorithm-results')
    if (savedYanResults) {
      try {
        const results = JSON.parse(savedYanResults)
        if (results.randomNumber !== undefined) setRandomNumber(results.randomNumber)
        if (results.selectedCategory !== undefined) setSelectedCategory(results.selectedCategory)
        if (results.generatedSum !== undefined) setGeneratedSum(results.generatedSum)
        if (results.generatedRandomValue !== undefined) setGeneratedRandomValue(results.generatedRandomValue)
        if (results.generatedAt) setGeneratedAt(results.generatedAt)
      } catch (error) {
        console.log('Error loading saved YanAlgorithm results:', error)
      }
    }
  }, [])

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('yan-todos', JSON.stringify(todos))
  }, [todos])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    const preferences = {
      filter,
      sortBy,
      priorityFirst,
      advancedRecommendations,
      statsForNerds,
      numCategories,
      useCustomBase,
      customBase,
      useHalfWeight
    }
    localStorage.setItem('yan-todo-preferences', JSON.stringify(preferences))
  }, [filter, sortBy, priorityFirst, advancedRecommendations, statsForNerds, numCategories, useCustomBase, customBase, useHalfWeight])

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        title: newTodo.trim(),
        completed: false,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate + 'T00:00:00') : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setTodos([todo, ...todos])
      setNewTodo('')
      setNewDueDate('')
      setNewPriority('low')
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
        : todo
    ))
    
    // Clear recommendation if the recommended task is being completed
    if (recommendedTask && recommendedTask.id === id) {
      const updatedTodo = todos.find(t => t.id === id)
      if (updatedTodo && !updatedTodo.completed) { // If being marked as completed
        dismissRecommendation()
      }
    }
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const updateTodoDueDate = (id: string, dueDate: Date | undefined) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, dueDate, updatedAt: new Date() }
        : todo
    ))
  }

  const startEditingDate = (todoId: string, currentDate?: Date) => {
    setEditingDate(todoId)
    setEditDateValue(currentDate ? format(currentDate, 'yyyy-MM-dd') : '')
  }

  const saveEditedDate = (todoId: string) => {
    if (editDateValue) {
      updateTodoDueDate(todoId, new Date(editDateValue + 'T00:00:00'))
    } else {
      updateTodoDueDate(todoId, undefined)
    }
    setEditingDate(null)
    setEditDateValue('')
  }

  const cancelEditingDate = () => {
    setEditingDate(null)
    setEditDateValue('')
  }

  const updateTodoPriority = (id: string, priority: 'low' | 'high') => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, priority, updatedAt: new Date() }
        : todo
    ))
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

  const calculateTaskWeights = () => {
    const activeTodos = todos.filter(todo => !todo.completed)
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

    setTaskWeights(weights)
    setTotalWeight(sum)
  }

  // Calculate weights whenever todos change and advanced recommendations are enabled
  useEffect(() => {
    if (advancedRecommendations) {
      calculateTaskWeights()
    }
  }, [todos, advancedRecommendations])

  // Recalculate probabilities whenever any parameter that affects them changes
  useEffect(() => {
    calculateCurrentProbabilities()
  }, [totalWeight, useHalfWeight, useCustomBase, customBase, numCategories])

  // Initial calculation on component mount
  useEffect(() => {
    calculateCurrentProbabilities()
  }, [])

  // Helper function to check if YanAlgorithm settings have changed
  const checkYanResultsValidity = () => {
    const savedYanResults = localStorage.getItem('yan-algorithm-results')
    if (!savedYanResults) {
      setIsYanResultsOutdated(false)
      return
    }
    
    try {
      const results = JSON.parse(savedYanResults)
      if (!results.settingsUsed) {
        setIsYanResultsOutdated(false)
        return
      }
      
      const savedSettings = results.settingsUsed
      const currentCalculatedBase = totalWeight || 2.93
      const currentEffectiveBase = useCustomBase ? customBase : (useHalfWeight ? currentCalculatedBase / 2 : currentCalculatedBase)
      
      // Compare all relevant settings
      const settingsMatch = (
        savedSettings.numCategories === numCategories &&
        savedSettings.useCustomBase === useCustomBase &&
        savedSettings.useHalfWeight === useHalfWeight &&
        Math.abs(savedSettings.effectiveBase - currentEffectiveBase) < 0.001 // Allow small floating point differences
      )
      
      setIsYanResultsOutdated(!settingsMatch)
    } catch (error) {
      setIsYanResultsOutdated(false)
    }
  }

  // Check validity whenever relevant settings change
  useEffect(() => {
    checkYanResultsValidity()
  }, [numCategories, useCustomBase, customBase, useHalfWeight, totalWeight])
  const handleCustomBaseInputChange = (value: string) => {
    setCustomBaseInput(value)
    
    // Only update the actual customBase if the value is valid
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 20) {
      setCustomBase(numValue)
    }
  }

  const handleCustomBaseInputBlur = () => {
    const numValue = parseFloat(customBaseInput)
    
    // If invalid input, reset to current customBase value
    if (isNaN(numValue) || numValue <= 0 || numValue > 20) {
      setCustomBaseInput(customBase.toString())
    } else {
      // Ensure the actual value is updated and formatted
      setCustomBase(numValue)
      setCustomBaseInput(numValue.toString())
    }
  }

  const resetCustomBase = () => {
    setCustomBase(2.93)
    setCustomBaseInput('2.93')
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
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

  const importTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // Validate the import data structure
        if (!data.tasks || !Array.isArray(data.tasks)) {
          showNotification('Invalid file format. Please select a valid YanToDoList export file.', 'error')
          return
        }
        
        // Convert date strings back to Date objects and validate structure
        const importedTasks = data.tasks.map((task: any, index: number) => {
          try {
            return {
              id: task.id || `imported-${Date.now()}-${index}`,
              title: task.title || 'Untitled Task',
              description: task.description,
              completed: Boolean(task.completed),
              priority: task.priority === 'medium' ? 'low' : (['low', 'high'].includes(task.priority) ? task.priority : 'low'),
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
              updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date()
            }
          } catch (taskError) {
            console.warn(`Error parsing task ${index}:`, taskError)
            return null
          }
        }).filter(Boolean) // Remove any failed tasks
        
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
        
        if (shouldReplace || !hasExistingTasks) {
          // Replace all tasks
          setTodos(importedTasks)
          showNotification(`Replaced all tasks with ${importedTasks.length} imported tasks!`, 'success')
        } else {
          // Add to existing tasks
          setTodos([...importedTasks, ...todos])
          showNotification(`Added ${importedTasks.length} tasks to your existing ${todos.length} tasks!`, 'success')
        }
      } catch (error) {
        console.error('Import error:', error)
        showNotification('Error importing file. Please make sure it\'s a valid JSON file.', 'error')
      }
    }
    
    reader.onerror = () => {
      showNotification('Error reading file. Please try again.', 'error')
    }
    
    reader.readAsText(file)
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  const generateRandomRecommendation = () => {
    const activeTodos = todos.filter(todo => !todo.completed)
    
    if (activeTodos.length === 0) {
      setRecommendedTask(null)
      return
    }

    setIsGeneratingRecommendation(true)
    
    // Add a small delay for better UX (simulating "thinking")
    setTimeout(() => {
      // Use pre-calculated weights
      if (totalWeight <= 0) {
        // Fallback to random selection if weights don't work
        const randomIndex = Math.floor(Math.random() * activeTodos.length)
        setRecommendedTask(activeTodos[randomIndex])
        setIsGeneratingRecommendation(false)
        return
      }

      // Apply half weight option if enabled
      const effectiveWeight = useHalfWeight ? totalWeight / 2 : totalWeight
      
      // Generate random value and select task based on weighted probability
      const randomValue = Math.random() * effectiveWeight
      console.log(`Random Value: ${randomValue}, Total Weight: ${totalWeight}, Effective Weight: ${effectiveWeight}`)

      let cumulative = 0
      let selectedTask: Todo | null = null

      for (const todo of activeTodos) {
        const taskWeight = useHalfWeight ? (taskWeights[todo.id] || 0) / 2 : (taskWeights[todo.id] || 0)
        cumulative += taskWeight
        if (randomValue < cumulative) {
          selectedTask = todo
          break
        }
      }

      const finalTask = selectedTask || activeTodos[0] // Fallback to first task
      const generationTime = new Date().toLocaleString()
      
      setRecommendedTask(finalTask)
      setLastRecommendationTime(generationTime)
      setIsGeneratingRecommendation(false)
      
      // Save recommendation to localStorage
      const recommendationData = {
        taskId: finalTask.id,
        generatedAt: generationTime
      }
      localStorage.setItem('yan-last-recommendation', JSON.stringify(recommendationData))
    }, 800)
  }

  const dismissRecommendation = () => {
    setRecommendedTask(null)
    setLastRecommendationTime(null)
    localStorage.removeItem('yan-last-recommendation')
  }

  const generateRandomNumber = () => {
    // Use the current calculated sum instead of recalculating
    const sum = currentSum
    
    // Calculate the current base for logging
    let calculatedBase = totalWeight || 2.93
    if (useHalfWeight) {
      calculatedBase = calculatedBase / 2
    }
    const base = useCustomBase ? customBase : calculatedBase
    
    // Generate random number between 0 and sum
    const randomValue = Math.random() * sum
    
    // Find selected category using cumulative weights
    let cumulative = 0
    let selectedCat: number | null = null
    
    for (let i = 0; i < numCategories; i++) {
      cumulative += Math.pow(base, i + 1)
      if (randomValue < cumulative) {
        selectedCat = i + 1
        break
      }
    }
    
    // Update only the generation-specific state
    const finalRandomNumber = Math.floor(randomValue * 1000) / 1000 // 3 decimal places
    const finalSum = Math.floor(sum * 1000) / 1000 // 3 decimal places
    const finalRandomValue = Math.floor(randomValue * 1000) / 1000 // 3 decimal places
    const finalGeneratedAt = new Date().toLocaleString()
    
    setRandomNumber(finalRandomNumber)
    setSelectedCategory(selectedCat)
    setGeneratedSum(finalSum)
    setGeneratedRandomValue(finalRandomValue)
    setGeneratedAt(finalGeneratedAt)
    
    // Save YanAlgorithm results to localStorage
    const yanResults = {
      randomNumber: finalRandomNumber,
      selectedCategory: selectedCat,
      generatedSum: finalSum,
      generatedRandomValue: finalRandomValue,
      generatedAt: finalGeneratedAt,
      // Also save the settings used for this generation
      settingsUsed: {
        numCategories,
        useCustomBase,
        customBase: useCustomBase ? customBase : calculatedBase,
        useHalfWeight,
        effectiveBase: base
      }
    }
    localStorage.setItem('yan-algorithm-results', JSON.stringify(yanResults))
    
    // Reset outdated flag since we just generated fresh results
    setIsYanResultsOutdated(false)
    
    console.log(`Base: ${base} (${useCustomBase ? 'custom' : 'calculated'}${useHalfWeight && !useCustomBase ? ' with half weight' : ''})`)
    console.log(`Sum: ${sum}`)
    console.log(`Random number: ${randomValue}`)
    console.log(`Selected category: ${selectedCat}`)
    
    // Log probabilities for all categories using current probabilities
    currentProbabilities.forEach((probability, index) => {
      console.log(`Chance of ${index + 1}: ${probability.toFixed(2)}%`)
    })
    
    console.log(`Generated at: ${new Date().toLocaleString()}`)
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    if (filter === 'overdue') return isOverdue(todo)
    return true
  }).sort((a, b) => {
    // Priority sorting: high -> medium -> low (only if priorityFirst is enabled)
    if (priorityFirst && a.priority !== b.priority) {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      {/* Header */}
      <header className="mb-8">
        <div className="relative text-center">
          <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--foreground)'}}>YanToDoList</h1>
          
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
                  <label className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer">
                    <Upload size={16} />
                    Import Tasks
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTasks}
                      className="hidden"
                      title="Import tasks from a JSON file"
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
                      onClick={generateRandomNumber}
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
                            onClick={generateRandomNumber}
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
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <Calendar size={20} style={{color: 'var(--muted-foreground)'}} />
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

      {/* Advanced Task Recommendation Section */}
      {advancedRecommendations && (
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
                    <h3 className="font-medium text-lg mb-1" style={{color: 'var(--card-foreground)'}}>
                      {recommendedTask.title}
                    </h3>
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
                      onClick={dismissRecommendation}
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

      {/* Todo List */}
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
            
            return (
              <div
                key={todo.id}
                className={`rounded-lg shadow-md p-4 transition-all hover:shadow-lg ${
                  todo.completed ? 'opacity-75' : ''
                } ${dueDateStatus === 'overdue' ? 'border-l-4 border-red-500' : todo.priority === 'high' ? 'border-l-4 border-orange-500' : ''}`}
                style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}
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
                      <h3
                        className={`font-medium ${
                          todo.completed
                            ? 'line-through'
                            : ''
                        }`}
                        style={{color: todo.completed ? 'var(--muted-foreground)' : 'var(--card-foreground)'}}
                      >
                        {todo.title}
                      </h3>
                      <button
                        onClick={() => togglePriority(todo.id, todo.priority)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 hover:opacity-80 ${
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
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
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
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
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
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove due date"
                      >
                        <X size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Stats */}
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
        </div>
      </footer>
    </main>
  )
}
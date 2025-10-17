'use client'

import useSWR, { mutate } from 'swr'
import { useSession } from 'next-auth/react'

export interface UserSettings {
  id: string
  userId: string
  
  // UI Preferences
  filter: 'all' | 'active' | 'completed' | 'overdue'
  sortBy: 'created' | 'dueDate'
  priorityFirst: boolean
  advancedRecommendations: boolean
  statsForNerds: boolean

  // YanAlgorithm Settings
  numCategories: number
  useCustomBase: boolean
  customBase: number
  useHalfWeight: boolean

  // Last Recommendation Data
  lastRecommendedTodoId?: string | null
  lastRecommendationTime?: Date | null

  // YanAlgorithm Results
  lastRandomNumber?: number | null
  lastSelectedCategory?: number | null
  lastGeneratedSum?: number | null
  lastGeneratedRandomValue?: number | null
  lastGeneratedAt?: Date | null
  lastSettingsSnapshot?: any

  createdAt: Date
  updatedAt: Date
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useSettings() {
  const { data: session } = useSession()
  const { data: settings, error, isLoading } = useSWR<UserSettings>(
    session ? '/api/user/settings' : null,
    fetcher,
    {
      refreshInterval: 30000, // Check for updates every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!session) return

    // Apply optimistic update
    const currentSettings = settings
    if (currentSettings) {
      const optimisticSettings = { 
        ...currentSettings, 
        ...updates, 
        updatedAt: new Date() 
      }
      mutate('/api/user/settings', optimisticSettings, false)
    }

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Refresh with real data from server
        mutate('/api/user/settings')
      } else {
        // Revert optimistic update on error
        if (currentSettings) {
          mutate('/api/user/settings', currentSettings, false)
        }
        throw new Error('Failed to update settings')
      }

      return response
    } catch (error) {
      // Revert optimistic update on error
      if (currentSettings) {
        mutate('/api/user/settings', currentSettings, false)
      }
      throw error
    }
  }

  const generateRecommendation = async () => {
    if (!session) return null

    // New behavior: generate on client for instant UX and persist to server
    try {
      // Fetch current user's active todos to compute weights client-side
      const todosRes = await fetch('/api/todos')
      if (!todosRes.ok) throw new Error('Failed to fetch todos')
      const todos = await todosRes.json()
      const activeTodos = (todos || []).filter((t: any) => !t.completed)
      if (activeTodos.length === 0) {
        // Clear any previous recommendation if no active tasks
        await updateSettings({ lastRecommendedTodoId: null, lastRecommendationTime: null })
        return { recommendation: null, method: 'no_active_tasks' }
      }

      // Read settings for weight options
      const useHalfWeight = settings?.useHalfWeight ?? false

      // Calculate weights similar to server logic
      const weights: Record<string, number> = {}
      let totalWeight = 0
      for (const todo of activeTodos) {
        let weight: number
        if (todo.dueDate) {
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const dueDate = new Date(todo.dueDate); dueDate.setHours(0, 0, 0, 0)
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const doubleDays = daysDiff > 0 ? daysDiff : 1 / (-daysDiff + 2)
          weight = 1 / doubleDays
        } else {
          weight = 1 / 7
        }
        const priorityMultiplier = todo.priority === 'high' ? 2 : 1
        weight *= priorityMultiplier
        weights[todo.id] = weight
        totalWeight += weight
      }

      let selected = activeTodos[0]
      if (totalWeight > 0) {
        const effectiveWeight = useHalfWeight ? totalWeight / 2 : totalWeight
        const randomValue = Math.random() * effectiveWeight
        let cumulative = 0
        for (const todo of activeTodos) {
          const taskWeight = useHalfWeight ? weights[todo.id] / 2 : weights[todo.id]
          cumulative += taskWeight
          if (randomValue < cumulative) { selected = todo; break }
        }
      } else {
        // Fallback random selection
        selected = activeTodos[Math.floor(Math.random() * activeTodos.length)]
      }

      const generationTime = new Date()

      // Optimistically update settings cache
      const currentSettings = settings
      if (currentSettings) {
        mutate('/api/user/settings', { ...currentSettings, lastRecommendedTodoId: selected.id, lastRecommendationTime: generationTime }, false)
      }

      // Persist to server
      const resp = await fetch('/api/user/save-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastRecommendedTodoId: selected.id, lastRecommendationTime: generationTime })
      })
      if (!resp.ok) {
        // Revert on error
        if (currentSettings) mutate('/api/user/settings', currentSettings, false)
        throw new Error('Failed to save recommendation')
      }

      // Revalidate to sync with server state
      mutate('/api/user/settings')
      return { recommendation: selected, method: 'client_weighted' }
    } catch (error) {
      throw error
    }
  }

  const generateRandomNumber = async () => {
    if (!session) return null

    // Show loading state immediately by updating isGenerating flag
    // This will be handled in the UI component calling this function

    try {
      const response = await fetch('/api/user/generate-number', {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        // Refresh settings to get updated algorithm results
        mutate('/api/user/settings')
        return result
      } else {
        throw new Error('Failed to generate random number')
      }
    } catch (error) {
      throw error
    }
  }

  const saveAlgorithmResults = async (results: {
    randomNumber: number
    selectedCategory: number
    generatedSum: number
    generatedRandomValue: number
    generatedAt: Date
    settingsSnapshot: any
  }) => {
    if (!session) return null

    // Optimistically update the settings with the new algorithm results
    const currentSettings = settings
    if (currentSettings) {
      const optimisticSettings = {
        ...currentSettings,
        lastRandomNumber: results.randomNumber,
        lastSelectedCategory: results.selectedCategory,
        lastGeneratedSum: results.generatedSum,
        lastGeneratedRandomValue: results.generatedRandomValue,
        lastGeneratedAt: results.generatedAt,
        lastSettingsSnapshot: results.settingsSnapshot,
        updatedAt: new Date()
      }
      mutate('/api/user/settings', optimisticSettings, false)
    }

    try {
      const response = await fetch('/api/user/save-algorithm-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      })

      if (response.ok) {
        // Refresh with real data from server
        mutate('/api/user/settings')
        return response.json()
      } else {
        // Revert optimistic update on error
        if (currentSettings) {
          mutate('/api/user/settings', currentSettings, false)
        }
        throw new Error('Failed to save algorithm results')
      }
    } catch (error) {
      // Revert optimistic update on error
      if (currentSettings) {
        mutate('/api/user/settings', currentSettings, false)
      }
      throw error
    }
  }

  const dismissRecommendation = async () => {
    if (!session) return

    await updateSettings({
      lastRecommendedTodoId: null,
      lastRecommendationTime: null,
    })
  }

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    generateRecommendation,
    generateRandomNumber,
    saveAlgorithmResults,
    dismissRecommendation,
    isAuthenticated: !!session,
  }
}
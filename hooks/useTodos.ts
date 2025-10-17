'use client'

import useSWR, { mutate } from 'swr'
import { useSession } from 'next-auth/react'

export interface Todo {
  id: string
  title: string
  description?: string | null
  completed: boolean
  priority: 'low' | 'high'
  dueDate?: Date | null
  createdAt: Date
  updatedAt: Date
  userId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useTodos() {
  const { data: session } = useSession()
  const { data: todos, error, isLoading } = useSWR<Todo[]>(
    session ? '/api/todos' : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds for real-time sync
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const addTodo = async (todo: Partial<Todo>) => {
    if (!session) return

    // Create optimistic new todo
    const optimisticTodo: Todo = {
      id: `temp-${Date.now()}`, // Temporary ID
      title: todo.title || '',
      description: todo.description || null,
      completed: todo.completed || false,
      priority: todo.priority || 'low',
      dueDate: todo.dueDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: session.user.id,
    }

    // Optimistically update the UI
    const currentTodos = todos || []
    mutate('/api/todos', [...currentTodos, optimisticTodo], false)

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      })

      if (response.ok) {
        // Refresh with real data from server
        mutate('/api/todos')
      } else {
        // Revert optimistic update on error
        mutate('/api/todos', currentTodos, false)
        throw new Error('Failed to add todo')
      }

      return response
    } catch (error) {
      // Revert optimistic update on error
      mutate('/api/todos', currentTodos, false)
      throw error
    }
  }

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    if (!session) return

    // Apply optimistic update
    const currentTodos = todos || []
    const optimisticTodos = currentTodos.map(todo => 
      todo.id === id 
        ? { ...todo, ...updates, updatedAt: new Date() }
        : todo
    )
    
    mutate('/api/todos', optimisticTodos, false)

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Refresh with real data from server
        mutate('/api/todos')
      } else {
        // Revert optimistic update on error
        mutate('/api/todos', currentTodos, false)
        throw new Error('Failed to update todo')
      }

      return response
    } catch (error) {
      // Revert optimistic update on error
      mutate('/api/todos', currentTodos, false)
      throw error
    }
  }

  const deleteTodo = async (id: string) => {
    if (!session) return

    // Apply optimistic delete
    const currentTodos = todos || []
    const optimisticTodos = currentTodos.filter(todo => todo.id !== id)
    
    mutate('/api/todos', optimisticTodos, false)

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh with real data from server
        mutate('/api/todos')
      } else {
        // Revert optimistic update on error
        mutate('/api/todos', currentTodos, false)
        throw new Error('Failed to delete todo')
      }

      return response
    } catch (error) {
      // Revert optimistic update on error
      mutate('/api/todos', currentTodos, false)
      throw error
    }
  }

  return {
    todos: todos || [],
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    isAuthenticated: !!session,
  }
}

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { X, Upload, AlertCircle } from 'lucide-react'

interface LocalTodo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export default function LocalDataMigration() {
  const { data: session } = useSession()
  const [localTodos, setLocalTodos] = useState<LocalTodo[]>([])
  const [showMigration, setShowMigration] = useState(false)
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    if (!session) return

    // Check for local todos
    const savedTodos = localStorage.getItem('yan-todos')
    const hasMigrated = localStorage.getItem('yan-data-migrated')

    if (savedTodos && !hasMigrated) {
      try {
        const todos = JSON.parse(savedTodos)
        if (todos.length > 0) {
          setLocalTodos(todos)
          setShowMigration(true)
        }
      } catch (error) {
        console.error('Error parsing local todos:', error)
      }
    }
  }, [session])

  const handleMigrate = async () => {
    setMigrating(true)

    try {
      for (const todo of localTodos) {
        await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: todo.title,
            description: todo.description,
            completed: todo.completed,
            priority: todo.priority,
            dueDate: todo.dueDate,
          }),
        })
      }

      // Mark as migrated
      localStorage.setItem('yan-data-migrated', 'true')
      
      // Optionally clear local todos
      localStorage.removeItem('yan-todos')
      
      setShowMigration(false)
      
      // Refresh the page to load cloud todos
      window.location.reload()
    } catch (error) {
      console.error('Migration error:', error)
      alert('Failed to migrate some tasks. Please try again.')
    } finally {
      setMigrating(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('yan-data-migrated', 'skipped')
    setShowMigration(false)
  }

  if (!showMigration) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-lg shadow-2xl max-w-md w-full p-6"
        style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <Upload size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1" style={{color: 'var(--foreground)'}}>
              Migrate Local Data
            </h2>
            <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
              We found {localTodos.length} task{localTodos.length !== 1 ? 's' : ''} stored locally
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg hover:bg-opacity-80"
            style={{color: 'var(--muted-foreground)'}}
            disabled={migrating}
          >
            <X size={20} />
          </button>
        </div>

        <div 
          className="p-4 rounded-lg mb-4 border-l-4 border-blue-500"
          style={{backgroundColor: 'var(--muted)'}}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5" />
            <div className="text-sm" style={{color: 'var(--card-foreground)'}}>
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1" style={{color: 'var(--muted-foreground)'}}>
                <li>Your local tasks will be uploaded to the cloud</li>
                <li>They'll sync across all your devices</li>
                <li>Local storage will be cleared after migration</li>
                <li>You can continue using the app normally</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted-foreground)'
            }}
            disabled={migrating}
          >
            Skip
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {migrating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Migrating...
              </>
            ) : (
              <>
                <Upload size={18} />
                Migrate Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

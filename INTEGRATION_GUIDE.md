# Integration Guide: Adding Authentication & Cloud Sync to page.tsx

## Overview
This document explains how to integrate the authentication and cloud sync features into your existing `app/page.tsx` file.

## Key Changes Needed

### 1. Import Required Modules

Add these imports at the top of `page.tsx`:

```typescript
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTodos } from '@/hooks/useTodos'
import AuthModal from '@/components/AuthModal'
import UserProfile from '@/components/UserProfile'
```

### 2. Replace Local Storage with Cloud Sync

**Current State**: Using localStorage for todos
```typescript
const [todos, setTodos] = useState<Todo[]>([])

useEffect(() => {
  const saved = localStorage.getItem('yan-todos')
  if (saved) setTodos(JSON.parse(saved))
}, [])

useEffect(() => {
  localStorage.setItem('yan-todos', JSON.stringify(todos))
}, [todos])
```

**New State**: Using cloud sync hook
```typescript
const { data: session } = useSession()
const { todos, isLoading, addTodo, updateTodo, deleteTodo, isAuthenticated } = useTodos()
const [showAuthModal, setShowAuthModal] = useState(false)
```

### 3. Update CRUD Operations

**Add Todo**: Replace `addTodo` function
```typescript
const addTodo = async () => {
  if (!newTodo.trim()) return
  
  if (!isAuthenticated) {
    setShowAuthModal(true)
    return
  }

  await addTodo({
    title: newTodo.trim(),
    priority: newPriority,
    dueDate: newDueDate ? new Date(newDueDate + 'T00:00:00') : null,
    completed: false,
  })

  setNewTodo('')
  setNewDueDate('')
  setNewPriority('medium')
}
```

**Update Todo**: Replace toggle and update functions
```typescript
const toggleTodo = async (id: string) => {
  const todo = todos.find(t => t.id === id)
  if (todo) {
    await updateTodo(id, { completed: !todo.completed })
  }
}

const updateTodoDueDate = async (id: string, dueDate: Date | undefined) => {
  await updateTodo(id, { dueDate })
}

const updateTodoPriority = async (id: string, priority: 'low' | 'medium' | 'high') => {
  await updateTodo(id, { priority })
}
```

**Delete Todo**: Replace delete function
```typescript
const deleteTodo = async (id: string) => {
  await deleteTodo(id)
}
```

### 4. Add Authentication UI

Add auth modal and user profile to the JSX:

```typescript
return (
  <main className="min-h-screen">
    {/* Auth Modal */}
    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    
    {/* Header with User Profile */}
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">YanToDoList</h1>
        <UserProfile onSignInClick={() => setShowAuthModal(true)} />
      </div>
      {/* Existing settings toggle */}
    </header>
    
    {/* Rest of your components */}
  </main>
)
```

### 5. Show Loading State

Add loading indicator while fetching todos:

```typescript
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
) : (
  // Your existing todo list
)}
```

### 6. Handle Unauthenticated State

Show message when not signed in:

```typescript
{!isAuthenticated && !isLoading && (
  <div className="rounded-lg shadow-md p-8 mb-6 text-center" style={{backgroundColor: 'var(--card)'}}>
    <h2 className="text-2xl font-bold mb-4">Welcome to YanToDoList</h2>
    <p className="mb-4" style={{color: 'var(--muted-foreground)'}}>
      Sign in to sync your tasks across all your devices
    </p>
    <button
      onClick={() => setShowAuthModal(true)}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
    >
      Sign In to Get Started
    </button>
  </div>
)}
```

### 7. Keep Local Storage for Preferences

Keep using localStorage for:
- User preferences (filter, sort, etc.)
- Algorithm settings
- Last recommendation (optional - can also sync)
- YanAlgorithm results

These are user-specific settings that don't need cloud sync.

### 8. Update Type Definitions

The Todo type from the database includes userId:

```typescript
interface Todo {
  id: string
  title: string
  description?: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date | null
  createdAt: Date
  updatedAt: Date
  userId: string
}
```

Make sure to handle the database Date objects:

```typescript
// Convert dates when needed
const formattedTodos = todos.map(todo => ({
  ...todo,
  dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
  createdAt: new Date(todo.createdAt),
  updatedAt: new Date(todo.updatedAt)
}))
```

## Migration Strategy

### For Existing Users

Create a migration helper that:
1. Checks for existing localStorage todos
2. If user signs in with existing todos
3. Offers to sync local todos to cloud
4. Merges or replaces based on user choice

```typescript
const migrateLocalTodos = async () => {
  const localTodos = localStorage.getItem('yan-todos')
  if (!localTodos || !isAuthenticated) return
  
  const todos = JSON.parse(localTodos)
  
  // Ask user if they want to sync local todos
  if (confirm(`Found ${todos.length} local tasks. Upload to cloud?`)) {
    for (const todo of todos) {
      await addTodo(todo)
    }
    localStorage.removeItem('yan-todos') // Clear after sync
  }
}

useEffect(() => {
  if (isAuthenticated) {
    migrateLocalTodos()
  }
}, [isAuthenticated])
```

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in with Google OAuth
- [ ] Todos sync across browser tabs
- [ ] Todos persist after page refresh
- [ ] Todos sync to other devices (test on mobile)
- [ ] Sign out clears local data
- [ ] Import/Export still works for signed-in users
- [ ] Algorithm recommendations work with cloud data
- [ ] Loading states display correctly
- [ ] Error handling works (network failures, etc.)

## Performance Considerations

1. **SWR Caching**: Automatic caching reduces server requests
2. **Optimistic Updates**: UI updates immediately, syncs in background
3. **Polling Interval**: 5 seconds - can adjust based on needs
4. **Deduplication**: SWR prevents duplicate requests

## Security Checks

- [ ] API routes validate authentication
- [ ] Users can only access their own todos
- [ ] Passwords are hashed (never stored plain text)
- [ ] Session tokens are secure (httpOnly cookies)
- [ ] HTTPS enforced in production
- [ ] Environment variables secured

## Next Steps

1. Update `page.tsx` with these changes
2. Test authentication flow
3. Test cloud sync across devices
4. Deploy to Vercel
5. Configure production database
6. Set up Google OAuth (optional)
7. Monitor and optimize performance

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Check database connection
4. Review Vercel deployment logs
5. Test API endpoints directly

---

This integration maintains all your existing features while adding powerful cloud sync and multi-device support!

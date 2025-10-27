'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { LogIn, UserPlus, Mail, Lock, User, Loader2, X } from 'lucide-react'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid email or password')
        } else {
          onClose()
        }
      } else {
        // Sign up
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Something went wrong')
        } else {
          // Auto sign in after signup
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })

          if (result?.error) {
            setError('Account created but failed to sign in')
          } else {
            onClose()
          }
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-lg shadow-2xl max-w-md w-full p-8 relative"
        style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-opacity-80 cursor-pointer"
          style={{color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)'}}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{color: 'var(--foreground)'}}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{color: 'var(--muted-foreground)'}}>
            {isLogin ? 'Sign in to sync your tasks' : 'Sign up to get started'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--foreground)'}}>
                Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{color: 'var(--muted-foreground)'}} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--input)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{color: 'var(--foreground)'}}>
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{color: 'var(--muted-foreground)'}} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{color: 'var(--foreground)'}}>
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{color: 'var(--muted-foreground)'}} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>
        </form>

        {/* Toggle sign in/up */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus('already-verified')
            setMessage(data.message || 'Email already verified')
          } else {
            setStatus('success')
            setMessage(data.message || 'Email verified successfully!')
          }
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            router.push('/')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An error occurred during verification')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: 'var(--background)'}}>
      <div 
        className="max-w-md w-full rounded-2xl shadow-2xl p-8"
        style={{backgroundColor: 'var(--card)', color: 'var(--card-foreground)'}}
      >
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          )}
          {(status === 'success' || status === 'already-verified') && (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-4" style={{color: 'var(--foreground)'}}>
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified! ✨'}
          {status === 'already-verified' && 'Already Verified ✓'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-center mb-6" style={{color: 'var(--muted-foreground)'}}>
          {message}
        </p>

        {/* Additional Info */}
        {status === 'success' && (
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg"
              style={{backgroundColor: 'var(--accent)'}}
            >
              <p className="text-sm text-center" style={{color: 'var(--foreground)'}}>
                🎉 You can now sign in to your account and start organizing your tasks!
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Go to Sign In
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {status === 'already-verified' && (
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Go to Sign In
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg bg-red-50"
              style={{border: '1px solid rgb(239 68 68)'}}
            >
              <p className="text-sm text-center text-red-700">
                The verification link may have expired or is invalid.
              </p>
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm" style={{color: 'var(--muted-foreground)'}}>
                Need a new verification email?
              </p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <Mail size={18} />
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Auto-redirect message */}
        {(status === 'success' || status === 'already-verified') && (
          <p className="text-xs text-center mt-6" style={{color: 'var(--muted-foreground)'}}>
            Redirecting to home page in 3 seconds...
          </p>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: 'var(--background)'}}>
        <div className="max-w-md w-full rounded-2xl shadow-2xl p-8" style={{backgroundColor: 'var(--card)'}}>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-4" style={{color: 'var(--foreground)'}}>
            Loading...
          </h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

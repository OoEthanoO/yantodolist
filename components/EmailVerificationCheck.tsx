'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Mail, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function EmailVerificationCheck() {
  const { data: session } = useSession()
  const [showBanner, setShowBanner] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!session?.user?.email) {
        setCheckingStatus(false)
        return
      }

      try {
        const response = await fetch('/api/auth/check-verification')
        const data = await response.json()

        if (response.ok) {
          setIsVerified(data.verified)
          setShowBanner(!data.verified)
        }
      } catch (error) {
        console.error('Error checking email verification:', error)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkEmailVerification()
  }, [session])

  const handleResendEmail = async () => {
    if (!session?.user?.email) return

    setResendingEmail(true)
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })

      if (response.ok) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      }
    } catch (error) {
      console.error('Error resending verification email:', error)
    } finally {
      setResendingEmail(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Store dismissal in session storage (temporary)
    sessionStorage.setItem('emailVerificationBannerDismissed', 'true')
  }

  // Don't show if not logged in, still checking, verified, or dismissed
  if (!session || checkingStatus || isVerified || !showBanner) {
    return null
  }

  // Check if user dismissed it this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('emailVerificationBannerDismissed')) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-lg" style={{backgroundColor: 'var(--card)'}}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-yellow-500" size={20} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-sm mb-1" style={{color: 'var(--foreground)'}}>
                  📧 Email Verification Required
                </p>
                <p className="text-sm mb-2" style={{color: 'var(--muted-foreground)'}}>
                  Your email <strong>{session.user.email}</strong> is not verified. 
                  Please check your inbox and click the verification link to ensure full access to your account.
                </p>
                <p className="text-xs mb-3" style={{color: 'var(--muted-foreground)'}}>
                  💡 Don't see it? Check your spam/junk folder
                </p>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={resendingEmail || resendSuccess}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {resendingEmail ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : resendSuccess ? (
                      <>
                        <CheckCircle2 size={16} />
                        Email Sent!
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="text-sm px-3 py-2 rounded-lg transition-colors hover:bg-opacity-80 cursor-pointer"
                    style={{color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)'}}
                  >
                    Dismiss for now
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded transition-colors hover:bg-opacity-80 cursor-pointer"
                style={{color: 'var(--muted-foreground)'}}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

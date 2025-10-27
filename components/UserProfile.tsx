'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User as UserIcon } from 'lucide-react'

interface UserProfileProps {
  onSignInClick: () => void
}

export default function UserProfile({ onSignInClick }: UserProfileProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full animate-pulse" style={{backgroundColor: 'var(--muted)'}}></div>
      </div>
    )
  }

  if (!session) {
    return (
      <button
        onClick={onSignInClick}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium cursor-pointer"
      >
        <UserIcon size={18} />
        Sign In
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{backgroundColor: 'var(--muted)'}}>
        {session.user.image ? (
          <img 
            src={session.user.image} 
            alt={session.user.name || 'User'} 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {session.user.name?.[0] || session.user.email?.[0] || 'U'}
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-sm font-medium" style={{color: 'var(--foreground)'}}>
            {session.user.name || 'User'}
          </p>
          <p className="text-xs" style={{color: 'var(--muted-foreground)'}}>
            {session.user.email}
          </p>
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="p-2 rounded-lg transition-colors hover:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer"
        title="Sign Out"
      >
        <LogOut size={20} />
      </button>
    </div>
  )
}

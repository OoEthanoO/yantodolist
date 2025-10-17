import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YanToDoList',
  description: 'A cloud-based todo list application',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`} style={{backgroundColor: 'var(--background)', color: 'var(--foreground)'}}>
        <AuthProvider>
          <div className="container mx-auto max-w-4xl px-4 py-8">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
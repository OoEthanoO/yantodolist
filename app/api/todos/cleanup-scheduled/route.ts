import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST cleanup past scheduled dates
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all todos with scheduled dates for this user
    const todosWithScheduledDates = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        scheduledDate: {
          not: null
        }
      }
    })

    // Filter todos where scheduled date is in the past (before today)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const pastScheduledTodos = todosWithScheduledDates.filter((todo: { scheduledDate: Date | null }) => {
      if (!todo.scheduledDate) return false
      const scheduledDate = new Date(todo.scheduledDate)
      const scheduledDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate())
      return scheduledDay < today
    })

    // Clear scheduled dates for past tasks
    if (pastScheduledTodos.length > 0) {
      await prisma.todo.updateMany({
        where: {
          id: {
            in: pastScheduledTodos.map((todo: { id: string }) => todo.id)
          }
        },
        data: {
          scheduledDate: null,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ 
      message: 'Cleanup completed',
      clearedCount: pastScheduledTodos.length,
      clearedTodoIds: pastScheduledTodos.map((t: { id: string }) => t.id)
    })
  } catch (error) {
    console.error('Error cleaning up scheduled dates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

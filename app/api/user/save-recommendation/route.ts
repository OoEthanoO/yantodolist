import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST persist client-generated recommendation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { lastRecommendedTodoId, lastRecommendationTime } = body || {}

    if (!lastRecommendedTodoId) {
      return NextResponse.json(
        { error: 'lastRecommendedTodoId is required' },
        { status: 400 }
      )
    }

    // Validate that the todo exists and belongs to the current user
    const todo = await prisma.todo.findUnique({ where: { id: lastRecommendedTodoId } })
    if (!todo || todo.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid todo id' },
        { status: 400 }
      )
    }

    const time = lastRecommendationTime ? new Date(lastRecommendationTime) : new Date()

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        lastRecommendedTodoId,
        lastRecommendationTime: time,
      },
      create: {
        userId: session.user.id,
        lastRecommendedTodoId,
        lastRecommendationTime: time,
      }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error saving recommendation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

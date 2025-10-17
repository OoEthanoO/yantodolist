import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST generate random recommendation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's todos and settings
    const [todos, settings] = await Promise.all([
      prisma.todo.findMany({
        where: { 
          userId: session.user.id,
          completed: false 
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      })
    ])

    if (todos.length === 0) {
      return NextResponse.json({ 
        recommendation: null,
        message: 'No active tasks available for recommendation'
      })
    }

    // Use settings or defaults for recommendation logic
    const useHalfWeight = settings?.useHalfWeight ?? false
    const useCustomBase = settings?.useCustomBase ?? false
    const customBase = settings?.customBase ?? 2.93

    // Calculate task weights (same logic as frontend)
    const weights: { [key: string]: number } = {}
    let totalWeight = 0

    for (const todo of todos) {
      let weight: number

      if (todo.dueDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(todo.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        const doubleDays = daysDifference > 0 ? daysDifference : 1 / (-daysDifference + 2)
        weight = 1 / doubleDays
      } else {
        weight = 1 / 7 // Default weight for tasks without due date
      }

      // Apply priority multiplier: low=1, high=2
      const priorityMultiplier = todo.priority === 'high' ? 2 : 1
      weight *= priorityMultiplier

      weights[todo.id] = weight
      totalWeight += weight
    }

    if (totalWeight <= 0) {
      // Fallback to random selection
      const randomIndex = Math.floor(Math.random() * todos.length)
      const selectedTodo = todos[randomIndex]
      
      // Save recommendation to settings
      await prisma.userSettings.upsert({
        where: { userId: session.user.id },
        update: {
          lastRecommendedTodoId: selectedTodo.id,
          lastRecommendationTime: new Date(),
        },
        create: {
          userId: session.user.id,
          lastRecommendedTodoId: selectedTodo.id,
          lastRecommendationTime: new Date(),
        }
      })

      return NextResponse.json({
        recommendation: selectedTodo,
        method: 'random_fallback',
        generatedAt: new Date().toISOString()
      })
    }

    // Apply half weight option if enabled
    const effectiveWeight = useHalfWeight ? totalWeight / 2 : totalWeight
    
    // Generate random value and select task based on weighted probability
    const randomValue = Math.random() * effectiveWeight
    let cumulative = 0
    let selectedTodo = null

    for (const todo of todos) {
      const taskWeight = useHalfWeight ? weights[todo.id] / 2 : weights[todo.id]
      cumulative += taskWeight
      if (randomValue < cumulative) {
        selectedTodo = todo
        break
      }
    }

    const finalTodo = selectedTodo || todos[0] // Fallback
    const generationTime = new Date()
    
    // Save recommendation to settings
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        lastRecommendedTodoId: finalTodo.id,
        lastRecommendationTime: generationTime,
      },
      create: {
        userId: session.user.id,
        lastRecommendedTodoId: finalTodo.id,
        lastRecommendationTime: generationTime,
      }
    })

    return NextResponse.json({
      recommendation: finalTodo,
      method: 'weighted_random',
      totalWeight,
      effectiveWeight,
      randomValue,
      taskWeights: weights,
      generatedAt: generationTime.toISOString()
    })

  } catch (error) {
    console.error('Error generating recommendation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
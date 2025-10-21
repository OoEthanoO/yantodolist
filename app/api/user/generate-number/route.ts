import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST generate YanAlgorithm random number
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's settings and active todos for weight calculation
    const [settings, allTodos] = await Promise.all([
      prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      }),
      prisma.todo.findMany({
        where: { 
          userId: session.user.id,
          completed: false 
        }
      })
    ])

    // Filter out tasks scheduled for the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todos = allTodos.filter(todo => {
      if (todo.scheduledDate) {
        const scheduledDate = new Date(todo.scheduledDate)
        scheduledDate.setHours(0, 0, 0, 0)
        // Only include tasks scheduled for today or earlier
        return scheduledDate <= today
      }
      // Include tasks without a scheduled date
      return true
    })

    // Use settings or defaults
    const numCategories = settings?.numCategories ?? 3
    const useCustomBase = settings?.useCustomBase ?? false
    const customBase = settings?.customBase ?? 2.93
    const useHalfWeight = settings?.useHalfWeight ?? false

    // Calculate total weight from active todos (same logic as recommendation)
    let totalWeight = 0
    if (todos.length > 0) {
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
          weight = 1 / 7
        }

        const priorityMultiplier = todo.priority === 'high' ? 2 : 1
        weight *= priorityMultiplier
        totalWeight += weight
      }
    }

    // Calculate the base to use
    let calculatedBase = totalWeight || 2.93
    if (useHalfWeight) {
      calculatedBase = calculatedBase / 2
    }
    const base = useCustomBase ? customBase : calculatedBase

    // Create categories dynamically based on numCategories
    const categories = Array.from({ length: numCategories }, (_, i) => i + 1)
    
    // Calculate sum using base^(i+1) for each category
    let sum = 0
    for (let i = 0; i < categories.length; i++) {
      sum += Math.pow(base, i + 1)
    }
    
    // Calculate probabilities for each category
    const probabilities = categories.map((_, i) => {
      return (Math.pow(base, i + 1) / sum) * 100
    })

    // Generate random number between 0 and sum
    const randomValue = Math.random() * sum
    
    // Find selected category using cumulative weights
    let cumulative = 0
    let selectedCategory: number | null = null
    
    for (let i = 0; i < numCategories; i++) {
      cumulative += Math.pow(base, i + 1)
      if (randomValue < cumulative) {
        selectedCategory = i + 1
        break
      }
    }

    const generatedAt = new Date()

    // Round values for storage
    const finalRandomNumber = Math.floor(randomValue * 1000) / 1000
    const finalSum = Math.floor(sum * 1000) / 1000
    const finalRandomValue = Math.floor(randomValue * 1000) / 1000

    // Save algorithm results to settings
    const settingsSnapshot = {
      numCategories,
      useCustomBase,
      customBase, // Save the actual custom base value, not the effective base
      useHalfWeight,
      effectiveBase: base, // This is what we actually used for calculations
      totalWeight
    }

    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        lastRandomNumber: finalRandomNumber,
        lastSelectedCategory: selectedCategory,
        lastGeneratedSum: finalSum,
        lastGeneratedRandomValue: finalRandomValue,
        lastGeneratedAt: generatedAt,
        lastSettingsSnapshot: settingsSnapshot,
      },
      create: {
        userId: session.user.id,
        lastRandomNumber: finalRandomNumber,
        lastSelectedCategory: selectedCategory,
        lastGeneratedSum: finalSum,
        lastGeneratedRandomValue: finalRandomValue,
        lastGeneratedAt: generatedAt,
        lastSettingsSnapshot: settingsSnapshot,
      }
    })

    return NextResponse.json({
      randomNumber: finalRandomNumber,
      selectedCategory,
      generatedSum: finalSum,
      generatedRandomValue: finalRandomValue,
      generatedAt: generatedAt.toISOString(),
      base,
      probabilities,
      settingsUsed: settingsSnapshot
    })

  } catch (error) {
    console.error('Error generating random number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
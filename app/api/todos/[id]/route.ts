import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH update a todo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const updates = await req.json()

    // Verify todo belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    // Enforce mutual exclusivity: dueDate and constantDueDays cannot both be set
    let finalDueDate = updates.dueDate !== undefined
      ? (updates.dueDate ? new Date(updates.dueDate) : null)
      : existingTodo.dueDate
    
    let finalConstantDueDays = updates.constantDueDays !== undefined
      ? updates.constantDueDays
      : existingTodo.constantDueDays

    // If setting constantDueDays, clear dueDate
    if (updates.constantDueDays !== undefined && updates.constantDueDays !== null) {
      finalDueDate = null
    }
    
    // If setting dueDate, clear constantDueDays
    if (updates.dueDate !== undefined && updates.dueDate !== null) {
      finalConstantDueDays = null
    }

    // Update todo
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...updates,
        dueDate: finalDueDate,
        constantDueDays: finalConstantDueDays,
        scheduledDate: updates.scheduledDate !== undefined 
          ? (updates.scheduledDate ? new Date(updates.scheduledDate) : null)
          : existingTodo.scheduledDate,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE a todo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify todo belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    await prisma.todo.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Todo deleted successfully' })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

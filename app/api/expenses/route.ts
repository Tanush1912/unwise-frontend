import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/server-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      description,
      total_amount,
      paidBy,
      splitMethod,
      groupId,
      group_id,
      receipt_image_url,
      splits = [],
      payers = [],
      category = "EXPENSE",
      type
    } = body

    const finalGroupId = group_id || groupId

    if (!description || !total_amount || !finalGroupId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (total_amount <= 0) {
      return Response.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    const expenseTypeMap: Record<string, string> = {
      'equally': 'EQUAL',
      'exact': 'EXACT_AMOUNT',
      'percentage': 'PERCENTAGE',
      'itemized': 'ITEMIZED',
    }
    const expenseType = type || expenseTypeMap[splitMethod] || 'EQUAL'

    let finalPayers = payers
    if (!finalPayers.length && paidBy) {
      const paidByArray = Array.isArray(paidBy) ? paidBy : [paidBy]
      finalPayers = paidByArray.map((userId: string) => ({
        user_id: userId,
        amount_paid: total_amount / paidByArray.length,
      }))
    }

    let finalSplits = splits
    if (Array.isArray(splits)) {
      finalSplits = splits.map((split: any) => ({
        user_id: split.user_id || split.userId,
        amount: split.amount,
        percentage: split.percentage || null,
      }))
    } else if (typeof splits === 'object') {
      finalSplits = Object.entries(splits).map(([userId, amount]) => ({
        user_id: userId,
        amount: amount as number,
      }))
    }

    if (expenseType === 'EXACT_AMOUNT' && finalSplits.length > 0) {
      const splitTotal = finalSplits.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
      if (Math.abs(splitTotal - total_amount) > 0.01) {
        return Response.json(
          { error: "Sum of splits must equal total amount" },
          { status: 400 }
        )
      }
    }

    if (finalPayers.length > 0) {
      const payerTotal = finalPayers.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0)
      if (Math.abs(payerTotal - total_amount) > 0.01) {
        return Response.json(
          { error: "Sum of payers must equal total amount" },
          { status: 400 }
        )
      }
    }

    const expenseData: any = {
      group_id: finalGroupId,
      total_amount: parseFloat(total_amount.toString()),
      description: description.trim(),
      type: expenseType,
      category: category,
      splits: finalSplits,
    }

    if (receipt_image_url) {
      expenseData.receipt_image_url = receipt_image_url
    }

    if (finalPayers.length > 0) {
      expenseData.payers = finalPayers
    } else if (finalPayers.length === 0 && paidBy && !Array.isArray(paidBy)) {
      expenseData.paid_by_user_id = paidBy
    }

    return proxyToBackend(request, '/expenses', {
      method: 'POST',
      body: expenseData,
    })
  } catch (error) {
    console.error("Error creating expense:", error)
    return Response.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}


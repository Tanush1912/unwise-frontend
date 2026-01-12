import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/server-api"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { payerId, payer_id, recipientId, receiver_id, amount } = body
    const finalPayerId = payer_id || payerId
    const finalReceiverId = receiver_id || recipientId

    if (!finalPayerId || !finalReceiverId || !amount) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return Response.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    const backendBody = {
      payer_id: finalPayerId,
      receiver_id: finalReceiverId,
      amount: parseFloat(amount),
    }


    return proxyToBackend(request, `/groups/${id}/settle`, {
      method: 'POST',
      body: backendBody,
    })
  } catch (error) {
    console.error("Error processing settlement:", error)
    return Response.json(
      { error: "Failed to process settlement" },
      { status: 500 }
    )
  }
}


import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/server-api"

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/groups')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, member_ids = [] } = body

    if (!name || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const backendType = type.toUpperCase()
    const validTypes = ['TRIP', 'HOME', 'COUPLE', 'OTHER']
    if (!validTypes.includes(backendType)) {
      return Response.json(
        { error: "Invalid group type" },
        { status: 400 }
      )
    }

    return proxyToBackend(request, '/groups', {
      method: 'POST',
      body: {
      name: name.trim(),
        type: backendType,
        member_ids,
      },
    })
  } catch (error) {
    console.error("Error creating group:", error)
    return Response.json(
      { error: "Failed to create group" },
      { status: 500 }
    )
  }
}


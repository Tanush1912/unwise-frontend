import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/server-api"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("receipt") || formData.get("image")

    if (!file) {
      return Response.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const backendFormData = new FormData()
    backendFormData.append('image', file as File)

    return proxyToBackend(request, '/scan-receipt', {
      method: 'POST',
      body: backendFormData,
      headers: {},
    })
  } catch (error) {
    console.error("Error scanning receipt:", error)
    return Response.json(
      { error: "Failed to scan receipt" },
      { status: 500 }
    )
  }
}


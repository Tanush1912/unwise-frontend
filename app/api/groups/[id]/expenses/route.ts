import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/server-api"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToBackend(request, `/groups/${id}/expenses`)
}


import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/server-api"

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/dashboard')
}


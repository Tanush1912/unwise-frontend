import { NextResponse } from "next/server"

const DEMO_EMAIL = "demo@unwise.app"
const DEMO_PASSWORD = "UnwiseDemo2026!"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Auth failed" }, { status: 401 })
  }

  const data = await res.json()

  return NextResponse.json(
    { access_token: data.access_token, refresh_token: data.refresh_token },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    }
  )
}

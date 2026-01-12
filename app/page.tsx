"use client"

export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { Dashboard } from "@/components/dashboard"
import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { DashboardLoading } from "@/components/dashboard-loading"

function HomeContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code')
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('OAuth callback error:', error)
            return
          }
          if (data.session) {
            await supabase.auth.refreshSession()
            await new Promise(resolve => setTimeout(resolve, 1000))
            router.replace('/')
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error)
        }
      }
    }

    handleOAuthCallback()
  }, [searchParams, router])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <DashboardLoading />
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen pb-24">
      <Dashboard />
      <BottomNav />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <HomeContent />
    </Suspense>
  )
}

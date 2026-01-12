"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  Users,
  History,
  ArrowRight,
  Pizza,
  Beer,
  Coffee,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Home,
  Banknote,
  Plus
} from "lucide-react"
import { formatDistanceToNow, format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useDashboard, DashboardResponse, fetchGroups, fetchGroupDetails, fetchExpenseDetails } from "@/hooks/use-groups"
import { fetchFriends } from "@/hooks/use-friends"
import { DashboardLoading } from "./dashboard-loading"
import { useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"

const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

const getCategoryIcon = (description: string, type: string) => {
  if (type === "PAYMENT" || type === "REPAYMENT") {
    return { icon: Banknote, color: "bg-gray-100 text-black" }
  }
  const desc = description.toLowerCase()
  if (desc.includes("pizza") || desc.includes("dinner") || desc.includes("restaurant") || desc.includes("food")) {
    return { icon: Pizza, color: "bg-gray-100 text-black" }
  }
  if (desc.includes("beer") || desc.includes("drink") || desc.includes("bar")) {
    return { icon: Beer, color: "bg-gray-100 text-black" }
  }
  if (desc.includes("coffee") || desc.includes("breakfast")) {
    return { icon: Coffee, color: "bg-gray-100 text-black" }
  }
  if (desc.includes("uber") || desc.includes("ride") || desc.includes("taxi") || desc.includes("car")) {
    return { icon: Car, color: "bg-gray-100 text-black" }
  }
  if (desc.includes("shopping") || desc.includes("store")) {
    return { icon: ShoppingBag, color: "bg-gray-100 text-black" }
  }
  if (desc.includes("home") || desc.includes("house")) {
    return { icon: Home, color: "bg-gray-100 text-black" }
  }
  return { icon: UtensilsCrossed, color: "bg-gray-100 text-black" }
}

export const Dashboard = () => {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data, isLoading, isError } = useDashboard()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.id) return

    const startAggressivePrefetch = async () => {
      try {
        const allGroups = await queryClient.fetchQuery({
          queryKey: ["groups", user.id],
          queryFn: () => fetchGroups(user.id),
          staleTime: 1000 * 60 * 5,
        })
        queryClient.prefetchQuery({
          queryKey: ["friends"],
          queryFn: fetchFriends,
          staleTime: 1000 * 60 * 5,
        })

        allGroups.forEach(async (group: any) => {
          try {
            const details = await queryClient.fetchQuery({
              queryKey: ["group", group.id, user.id],
              queryFn: () => fetchGroupDetails(group.id, user.id),
              staleTime: 1000 * 60 * 5
            })

            details.expenses.forEach((expense: any) => {
              if (expense.type === "expense" || expense.type === "EXPENSE") {
                queryClient.prefetchQuery({
                  queryKey: ["expense", expense.id],
                  queryFn: () => fetchExpenseDetails(expense.id),
                  staleTime: 1000 * 60 * 10
                })
              }
            })
          } catch (err) {
            console.warn(`Failed to prefetch details for group ${group.id}`, err)
          }
        })
      } catch (err) {
        console.warn("Aggressive prefetch failed at group list level", err)
      }
    }

    startAggressivePrefetch()

    if (data?.recent_activity) {
      data.recent_activity.forEach((activity) => {
        if (activity.type === "EXPENSE") {
          queryClient.prefetchQuery({
            queryKey: ["expense", activity.id],
            queryFn: () => fetchExpenseDetails(activity.id),
            staleTime: 1000 * 60 * 10
          })
        }
      })
    }
  }, [user?.id, queryClient, data?.recent_activity])

  const { totalOwe, totalOwed, netBalance } = useMemo(() => {
    const groups = data?.groups || []
    let owe = 0
    let owed = 0
    groups.forEach(g => {
      if (g.my_balance_in_group > 0) owed += g.my_balance_in_group
      else if (g.my_balance_in_group < 0) owe += Math.abs(g.my_balance_in_group)
    })
    return {
      totalOwe: owe,
      totalOwed: owed,
      netBalance: owed - owe
    }
  }, [data?.groups])

  if (authLoading || isLoading) {
    return <DashboardLoading />
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <History className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-black mb-2">Oops! Something went wrong</h2>
        <p className="text-muted-foreground mb-6">We couldn't load your dashboard data. Please try again later.</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-black text-white border-2 border-black rounded-xl font-bold px-8 h-12"
        >
          Retry
        </Button>
      </div>
    )
  }

  const { groups = [], recent_activity = [] } = data || {}

  const getInitials = (name: string) => {
    return (name || "??")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isEverythingEmpty = groups.length === 0 && recent_activity.length === 0

  if (isEverythingEmpty) {
    return (
      <div className="min-h-screen bg-white pb-32">
        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-5 h-5 text-white fill-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-black text-black tracking-tighter uppercase italic">Unwise</h1>
            </div>
            <Avatar className="h-10 w-10 border-2 border-black cursor-pointer" onClick={() => router.push('/profile')}>
              <AvatarImage src={data?.user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar} />
              <AvatarFallback className="bg-orange-100 text-black font-bold">
                {data?.user?.name?.[0] || user?.user_metadata?.full_name?.[0] || user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center py-20 px-6 mt-12">
            <div className="w-24 h-24 bg-white border-4 border-black rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rotate-3">
              <Plus className="h-12 w-12 text-black" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter italic uppercase">Welcome to Unwise</h2>
            <p className="text-lg font-bold text-[#757575] mb-10 max-w-sm mx-auto leading-tight italic uppercase">
              You are all settled up! Create a group or add an expense to get started with the chaos.
            </p>
            <div className="space-y-4 max-w-xs mx-auto">
              <Button
                className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-2xl font-black h-16 text-xl uppercase italic transition-all"
                onClick={() => router.push("/groups/create")}
              >
                Create a Group
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-5 h-5 text-white fill-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-black text-black tracking-tighter uppercase italic">Unwise</h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-black cursor-pointer" onClick={() => router.push('/profile')}>
              <AvatarImage src={data?.user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar} />
              <AvatarFallback className="bg-orange-100 text-black font-bold">
                {data?.user?.name?.[0] || user?.user_metadata?.full_name?.[0] || user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div
          onClick={() => router.push("/groups")}
          className="bg-white border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 transition-all"
        >
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Total Balance</p>
            <p className="text-5xl font-bold text-black mb-6">
              {netBalance >= 0 ? "+" : ""}₹{(Number(netBalance) || 0).toFixed(2)}
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="px-4 py-2 bg-gray-100 border-2 border-black rounded-lg text-xs font-semibold text-black">
                You owe: ₹{(Number(totalOwe) || 0).toFixed(2)}
              </span>
              <span className="px-4 py-2 bg-gray-100 border-2 border-black rounded-lg text-xs font-semibold text-black">
                Owed: ₹{(Number(totalOwed) || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-black">
            <Users className="h-5 w-5" />
            Your Groups
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/groups")}
            className="text-sm text-muted-foreground hover:text-black"
          >
            See all
          </Button>
        </div>

        <div className="w-full overflow-x-auto overscroll-contain -mx-4 px-4">
          <div className="flex gap-3 pb-2">
            {groups.length === 0 ? (
              <div className="w-full bg-gray-50 border-2 border-dashed border-black/10 rounded-2xl py-12 px-6 text-center">
                <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Users className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-lg font-black mb-1">No groups yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Create a group to start splitting expenses with friends!</p>
                <Button
                  onClick={() => router.push("/groups/create")}
                  className="bg-black text-white border-2 border-black rounded-xl font-bold h-10 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Create Group
                </Button>
              </div>
            ) : (
              groups.map((group) => {
                return (
                  <div
                    key={group.id}
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className="min-w-[280px] bg-white border-2 border-black rounded-xl p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer shrink-0"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border-2 border-black shrink-0">
                        {group.avatar_url && <AvatarImage src={group.avatar_url} className="object-cover" />}
                        <AvatarFallback className="bg-black text-white font-bold">
                          {getInitials(group.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base mb-1 truncate text-black">{group.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Last active {getTimeAgo(group.last_activity_at)}
                        </p>
                      </div>

                      <ArrowRight className="h-5 w-5 text-black shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="px-4">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-black">
          <History className="h-5 w-5" />
          Recent Activity
        </h2>

        <div className="space-y-2">
          {recent_activity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            recent_activity.map((activity) => {
              const { icon: Icon, color } = getCategoryIcon(activity.description, activity.type)
              const isExpense = activity.type === "EXPENSE"

              return (
                <div
                  key={activity.id}
                  onClick={() => router.push(isExpense ? `/expenses/${activity.id}` : "/groups")}
                  className="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2 border-black", color)}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base mb-1 truncate text-black">{activity.description}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {(activity?.action_text || "").replace(/\$/g, "₹")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.date && activity.date !== activity.created_at.split('T')[0]
                        ? `For ${format(parseISO(activity.date), "MMM d, yyyy")}`
                        : getTimeAgo(activity.created_at)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg text-black">
                      {isExpense ? "-" : "+"}₹{(Number(activity?.amount) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <Button
        onClick={() => router.push("/expenses/add")}
        className="fixed bottom-28 right-4 h-14 w-14 rounded-full bg-black text-white border-2 border-black shadow-lg z-40 hover:bg-gray-800 transition-colors"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}

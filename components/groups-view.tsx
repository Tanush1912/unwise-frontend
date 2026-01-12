"use client"

import { useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGroups, Group, useDashboard, fetchGroupDetails, useGroupDetails, fetchExpenseDetails } from "@/hooks/use-groups"
import { DashboardLoading } from "./dashboard-loading"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"

const getAccentColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `oklch(0.75 0.15 ${h})`
}

export const GroupsView = () => {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: groupsData = [], isLoading: groupsLoading } = useGroups()
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard()

  useEffect(() => {
    if (groupsData.length > 0 && user?.id) {
      groupsData.forEach(async (group: Group) => {
        try {
          const details = await queryClient.fetchQuery({
            queryKey: ["group", group.id, user.id],
            queryFn: () => fetchGroupDetails(group.id, user.id),
            staleTime: 1000 * 60 * 5,
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
          console.warn(`GroupsView: Failed to prefetch details for group ${group.id}`, err)
        }
      })
    }
  }, [groupsData, user?.id, queryClient])

  const groups = useMemo(() => {
    return groupsData.map((group: Group) => {
      const dashGroup = dashboardData?.groups.find((dg: any) => dg.id === group.id)
      return {
        ...group,
        totalBalance: dashGroup ? dashGroup.my_balance_in_group : group.totalBalance,
        avatar_url: dashGroup?.avatar_url || group.avatar_url
      }
    })
  }, [groupsData, dashboardData])

  const { totalOwe, totalOwed, netBalance } = useMemo(() => {
    let owe = 0
    let owed = 0
    groups.forEach(g => {
      if (g.totalBalance > 0) owed += g.totalBalance
      else if (g.totalBalance < 0) owe += Math.abs(g.totalBalance)
    })
    return {
      totalOwe: owe,
      totalOwed: owed,
      netBalance: owed - owe
    }
  }, [groups])

  if (groupsLoading || dashboardLoading) {
    return <DashboardLoading />
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Global Header */}
      <div className="sticky top-0 z-20 bg-white border-b-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-5 h-5 text-white fill-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-black text-black tracking-tighter uppercase italic">Groups</h1>
            </div>
          </div>
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mb-0.5">Net Balance</p>
              <p className={cn(
                "text-2xl font-black leading-none",
                netBalance > 0 ? "text-green-600" : netBalance < 0 ? "text-orange-600" : "text-black"
              )}>
                {netBalance >= 0 ? "+" : "-"}₹{Math.abs(netBalance).toFixed(2)}
              </p>
            </div>
            <div className="h-8 w-px bg-black opacity-10 shrink-0" />
            <div className="shrink-0">
              <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mb-0.5">Owe</p>
              <p className="text-xl font-bold text-orange-600 leading-none">₹{totalOwe.toFixed(2)}</p>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mb-0.5">Owed</p>
              <p className="text-xl font-bold text-green-600 leading-none">₹{totalOwed.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 bg-gray-50 border-4 border-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Users className="h-10 w-10 text-black" />
            </div>
            <h2 className="text-3xl font-black mb-3 italic uppercase tracking-tighter">No groups yet?</h2>
            <p className="text-lg font-bold text-[#757575] mb-8 max-w-sm mx-auto">
              Split bills, rent, and trips with your friends. Create your first group to get started!
            </p>
            <Button
              onClick={() => router.push("/groups/create")}
              className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl font-bold h-14 px-10 text-xl"
            >
              Create Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {groups.map((group, idx) => (
              <GroupCard
                key={group.id}
                group={group}
                index={idx}
                onClick={() => router.push(`/groups/${group.id}`)}
              />
            ))}
          </div>
        )}

        <Button
          onClick={() => router.push("/groups/create")}
          className="fixed bottom-28 right-6 h-16 w-16 rounded-2xl bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 hover:bg-gray-800 transition-all active:shadow-none active:translate-x-1 active:translate-y-1"
          size="icon"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}

const GroupCard = ({ group, index, onClick }: { group: Group; index: number; onClick: () => void }) => {
  const { user } = useAuth()
  const accentColor = useMemo(() => getAccentColor(group.name), [group.name])
  const rotation = index % 2 === 0 ? "hover:rotate-1" : "hover:-rotate-1"
  const { data: details } = useGroupDetails(group.id)

  const relevantDebts = useMemo(() => {
    if (!details?.group?.debts || !user?.id) return []
    return (details.group.debts as any[]).filter((d: any) =>
      d.from_user.id === user.id || d.to_user.id === user.id
    )
  }, [details, user?.id])

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white border-2 border-black rounded-2xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-none select-none overflow-hidden",
        rotation
      )}
    >
      {/* Brand Stripe (Derived Color) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
        style={{ backgroundColor: accentColor }}
      />

      {/* Halo Effect */}
      <div
        className="absolute left-8 top-1/2 -translate-y-1/2 w-32 h-32 opacity-20 blur-[60px] pointer-events-none transition-all group-hover:opacity-40"
        style={group.avatar_url ? { backgroundImage: `url(${group.avatar_url})`, backgroundSize: 'cover' } : { backgroundColor: accentColor }}
      />

      <div className="flex gap-3 sm:gap-4 items-start relative z-10 pl-2">
        {/* Avatar Area */}
        <div className="relative shrink-0 mt-1">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white transition-transform group-hover:scale-105">
            <AvatarImage src={group.avatar_url} className="object-cover" />
            <AvatarFallback className="flex items-center justify-center font-black" style={{ color: 'black', backgroundColor: 'white' }}>
              {group.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black text-black leading-tight uppercase italic tracking-tighter line-clamp-2">
              {group.name}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md border-2 border-black/5 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0">
                <Users className="h-3 w-3" strokeWidth={3} />
                {group.members.length + 1}
              </div>

              {/* Status Badge */}
              <div className={cn(
                "h-6 flex items-center px-2 rounded-md border-2 border-black text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0",
                group.totalBalance > 0 ? "bg-green-100 text-green-800" :
                  group.totalBalance < 0 ? "bg-orange-100 text-orange-800" :
                    "bg-gray-100 text-gray-400 opacity-60"
              )}>
                {group.totalBalance > 0 ? "Owed to you" :
                  group.totalBalance < 0 ? "You owe" :
                    "Settled"}
              </div>
            </div>

            {/* Breakdown Tree (Pairwise Balances) */}
            {relevantDebts.length > 0 && (
              <div className="mt-3 space-y-2 relative pl-4 pb-1">
                {/* Tree Backbone */}
                <div className="absolute left-0 top-0 bottom-4 w-px bg-black/10" />

                {relevantDebts.map((debt: any) => {
                  const isOwed = debt.to_user.id === user?.id
                  const counterParty = isOwed ? debt.from_user : debt.to_user

                  return (
                    <div key={`${debt.from_user.id}-${debt.to_user.id}`} className="relative pl-3">
                      {/* Branch Connector */}
                      <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-black/10" />

                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-gray-500 leading-none">
                          {isOwed ? (
                            <span>
                              <span className="text-black font-black uppercase italic mr-1">{counterParty.name.split(' ')[0]}</span>
                              owes you
                            </span>
                          ) : (
                            <span>
                              you owe
                              <span className="text-black font-black uppercase italic ml-1">{counterParty.name.split(' ')[0]}</span>
                            </span>
                          )}
                        </p>
                        <span className={cn(
                          "text-[11px] font-black tabular-nums border-b-2 border-black/10 transition-colors group-hover:border-black/30",
                          isOwed ? "text-green-600" : "text-orange-600"
                        )}>
                          ₹{debt.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Balance Area */}
        <div
          className="text-right shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-white min-w-[100px] mt-1"
        >
          <p className={cn(
            "text-[9px] font-black uppercase tracking-[0.1em] mb-1 opacity-50 text-center",
            group.totalBalance > 0 ? "text-green-700" : group.totalBalance < 0 ? "text-orange-700" : "text-gray-500"
          )}>
            Balance
          </p>
          <p className={cn(
            "text-lg sm:text-xl font-black tabular-nums leading-none tracking-tighter text-center",
            group.totalBalance > 0 ? "text-green-600" : group.totalBalance < 0 ? "text-orange-600" : "text-black"
          )}>
            ₹{Math.abs(group.totalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Brand Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-2"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  )
}

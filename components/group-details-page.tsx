"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Settings,
  Loader2,
  List,
  History,
  Wallet,
  PieChart,
  BarChart3,
  Sparkles,
  Search,
  X
} from "lucide-react"
import { ExpenseListView } from "@/components/expense-list-view"
import { ExpenseTimelineView } from "@/components/expense-timeline-view"
import { BalancesView } from "@/components/balances-view"
import { BreakdownView } from "@/components/breakdown-view"
import { SettleUpDialog } from "@/components/settle-up-dialog"
import { GroupChartsView } from "@/components/group-charts-view"
import { ExpenseInsightsView } from "@/components/expense-insights-view"
import { GroupSkeleton } from "@/components/ui/skeleton-loaders"
import { useAuth } from "@/contexts/auth-context"
import { useGroupDetails, Expense, GroupDetails } from "@/hooks/use-groups"
import { PageTransition } from "@/components/page-transition"

export const GroupDetailsPage = ({ groupId }: { groupId?: string }) => {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useGroupDetails(groupId)
  const group = data?.group
  const expenses = data?.expenses || []
  const balancesData = data?.balancesData

  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false)
  const [settleUpPrefill, setSettleUpPrefill] = useState<{
    payerId?: string
    recipientId?: string
    amount?: number
    editingExpenseId?: string
  }>({})
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredExpenses = expenses.filter(expense => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      expense.description.toLowerCase().includes(query) ||
      expense.amount.toString().includes(query) ||
      expense.paidBy.name.toLowerCase().includes(query)
    )
  })

  const filteredTotalSpend = filteredExpenses.reduce((sum, e) => sum + (e.type === 'expense' ? e.amount : 0), 0)
  const currentUserId = user?.id || ""
  const [activeTab, setActiveTab] = useState("list")

  if (!groupId || (isLoading && !group)) {
    return <GroupSkeleton />
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 py-3">
          <h1 className="font-bold text-lg">Not Found</h1>
        </div>
        <div className="p-4">
          <p className="text-center text-muted-foreground">Group not found or error loading data</p>
        </div>
      </div>
    )
  }

  const handleRefresh = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ["group", groupId, user.id] })
      queryClient.invalidateQueries({ queryKey: ["groups", user.id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] })
    }
    queryClient.invalidateQueries({ queryKey: ["group", groupId] })
    queryClient.invalidateQueries({ queryKey: ["groups"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white border-b-4 border-black">
          <div className="flex items-center justify-between px-4 py-2.5">
            {!isSearchOpen ? (
              <>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-9 w-9 rounded-full shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="font-bold text-lg truncate">{group.name}</h1>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-1 shrink-0" />}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black/20 font-bold placeholder:font-medium text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isSearchOpen) {
                    setSearchQuery("")
                    setIsSearchOpen(false)
                  } else {
                    setIsSearchOpen(true)
                  }
                }}
                className="h-9 w-9 rounded-full shrink-0"
              >
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const settingsUrl = `/groups/${groupId}/settings`
                  router.push(settingsUrl)
                }}
                className="h-9 w-9 rounded-full shrink-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[56px] z-30 bg-white border-b-2 border-black h-[48px] flex-shrink-0">
            <TabsList className="h-full overflow-x-auto flex-nowrap">
              <TabsTrigger value="list" className="py-3 shrink-0">
                <List className="h-4 w-4 mr-1.5" />
                List
              </TabsTrigger>
              <TabsTrigger value="timeline" className="py-3 shrink-0">
                <History className="h-4 w-4 mr-1.5" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="balances" className="py-3 shrink-0">
                <Wallet className="h-4 w-4 mr-1.5" />
                Balances
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="py-3 shrink-0">
                <PieChart className="h-4 w-4 mr-1.5" />
                Breakdown
              </TabsTrigger>
              <TabsTrigger value="trends" className="py-3 shrink-0">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="insights" className="py-3 shrink-0">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Insights
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0">
            <ExpenseListView
              expenses={filteredExpenses}
              currentUserId={currentUserId}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <ExpenseTimelineView
              expenses={filteredExpenses}
              currentUserId={currentUserId}
            />
          </TabsContent>

          <TabsContent value="balances" className="mt-0">
            <BalancesView
              members={group.members}
              currentUserId={currentUserId}
              debts={group.debts || []}
              summary={balancesData?.summary}
              isRefreshing={isFetching}
              onSettleUp={(payer, recipient, amount) => {
                setSettleUpPrefill({
                  payerId: payer.id,
                  recipientId: recipient.id,
                  amount,
                })
                setIsSettleUpOpen(true)
              }}
              onRecordPayment={() => {
                setSettleUpPrefill({})
                setIsSettleUpOpen(true)
              }}
            />
          </TabsContent>

          <TabsContent value="breakdown" className="mt-0">
            <BreakdownView
              expenses={filteredExpenses}
              members={group.members}
              totalSpend={filteredTotalSpend}
            />
          </TabsContent>

          <TabsContent value="trends" className="mt-0">
            {activeTab === "trends" && <GroupChartsView expenses={filteredExpenses} />}
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <ExpenseInsightsView expenses={filteredExpenses} members={group.members} />
          </TabsContent>
        </Tabs>

        <div className="h-40" />

        <Button
          onClick={() => router.push(`/expenses/add?groupId=${groupId}`)}
          className="fixed bottom-32 right-6 h-14 w-14 rounded-full bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 hover:bg-gray-800 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        <SettleUpDialog
          groupId={groupId}
          members={group.members}
          isOpen={isSettleUpOpen}
          onClose={() => {
            setIsSettleUpOpen(false)
            setSettleUpPrefill({})
            handleRefresh()
          }}
          prefillPayerId={settleUpPrefill.payerId}
          prefillRecipientId={settleUpPrefill.recipientId}
          prefillAmount={settleUpPrefill.amount}
          editingExpenseId={settleUpPrefill.editingExpenseId}
        />
      </div>
    </PageTransition>
  )
}

export type { Expense, GroupDetails }

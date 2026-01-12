"use client"

import { Expense } from "@/components/group-details-page"
import { format, parseISO } from "date-fns"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Pizza, Beer, Coffee, UtensilsCrossed, Car, ShoppingBag, Banknote, Home, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpenseListViewProps {
  expenses: Expense[]
  currentUserId: string
}
import { VList } from "virtua"

export const ExpenseListView = ({ expenses, currentUserId }: ExpenseListViewProps) => {
  const router = useRouter()
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.full_date || a.date).getTime()
      const dateB = new Date(b.full_date || b.date).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })
  }, [expenses, sortOrder])

  const virtualItems = useMemo(() => {
    const items: Array<{ type: 'month-header' | 'date-header' | 'expense' | 'empty' | 'spacer'; data?: any; id: string }> = []

    if (sortedExpenses.length === 0) {
      items.push({ type: 'empty', id: 'empty' })
      return items
    }

    const groupedByMonth = groupExpensesByMonth(sortedExpenses, sortOrder)

    Object.entries(groupedByMonth).forEach(([monthKey, monthExpenses]) => {
      items.push({ type: 'month-header', data: monthKey, id: `month-${monthKey}` })

      const groupedByDate = groupExpensesByDate(monthExpenses, sortOrder)
      Object.entries(groupedByDate).forEach(([dateKey, dateExpenses]) => {
        const todayKey = format(new Date(), "yyyy-MM-dd")
        items.push({
          type: 'date-header',
          data: { date: dateKey, isToday: dateKey === todayKey },
          id: `date-${dateKey}`
        })

        dateExpenses.forEach(expense => {
          items.push({ type: 'expense', data: expense, id: expense.id })
        })
      })
    })
    items.push({ type: 'spacer', id: 'bottom-spacer' })

    return items
  }, [sortedExpenses, sortOrder])

  return (
    <div className="bg-white h-full relative">
      <VList
        className="h-full"
        style={{ height: 'calc(100vh - 110px)' }}
      >
        {virtualItems.map((item, index) => {
          if (item.type === 'spacer') {
            return <div key={item.id} className="h-48" />
          }
          if (item.type === 'empty') {
            return (
              <div key={item.id} className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-gray-50 border-2 border-black rounded-2xl flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <UtensilsCrossed className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-black mb-2">No expenses here</h3>
                <p className="text-muted-foreground max-w-[240px] font-medium">
                  Add an expense using the button below to start tracking your group's spending!
                </p>
              </div>
            )
          }

          if (item.type === 'month-header') {
            const monthDate = parseISO(item.data + "-01")
            return (
              <div
                key={item.id}
                className="sticky top-0 z-10 px-4 py-2 bg-gray-100 border-b-2 border-black flex items-center justify-between"
              >
                <h2 className="text-xs font-extrabold text-[#757575] uppercase tracking-wider">
                  {format(monthDate, "MMM yyyy")}
                </h2>
                {index === 0 && (
                  <button
                    onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black rounded-full font-bold text-[10px] uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all hover:bg-gray-50"
                  >
                    {sortOrder === "newest" ? (
                      <><ArrowDownWideNarrow className="h-3 w-3" /><span>Newest first</span></>
                    ) : (
                      <><ArrowUpNarrowWide className="h-3 w-3" /><span>Oldest first</span></>
                    )}
                  </button>
                )}
              </div>
            )
          }

          if (item.type === 'date-header') {
            const { date, isToday } = item.data
            return (
              <div key={item.id} className="px-4 py-2 bg-gray-50 border-b border-black">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  {isToday ? "Today" : format(parseISO(date), "EEEE, MMMM d")}
                </h3>
              </div>
            )
          }

          return (
            <ExpenseListItem
              key={item.id}
              expense={item.data}
              currentUserId={currentUserId}
              onClick={() => router.push(`/expenses/${item.data.id}`)}
            />
          )
        })}
      </VList>
    </div>
  )
}


function ExpenseListItem({
  expense,
  currentUserId,
  onClick,
}: {
  expense: Expense
  currentUserId: string
  onClick: () => void
}) {
  const isRepayment = expense.type === "repayment"
  const amount = expense.user_net_amount || 0
  const isOwed = expense.user_is_owed || false
  const isLent = expense.user_is_lent || false
  const isPayer = expense.user_is_payer || false
  const isRecipient = expense.user_is_recipient || false

  const getCategoryIcon = () => {
    const desc = expense.description.toLowerCase()
    if (desc.includes("pizza") || desc.includes("dinner") || desc.includes("restaurant") || desc.includes("food")) {
      return { icon: Pizza, color: "bg-orange-100 text-orange-600" }
    }
    if (desc.includes("beer") || desc.includes("drink") || desc.includes("bar")) {
      return { icon: Beer, color: "bg-amber-100 text-amber-600" }
    }
    if (desc.includes("coffee") || desc.includes("breakfast")) {
      return { icon: Coffee, color: "bg-yellow-100 text-yellow-600" }
    }
    if (desc.includes("uber") || desc.includes("ride") || desc.includes("taxi") || desc.includes("car")) {
      return { icon: Car, color: "bg-blue-100 text-blue-600" }
    }
    if (desc.includes("shopping") || desc.includes("store")) {
      return { icon: ShoppingBag, color: "bg-purple-100 text-purple-600" }
    }
    if (desc.includes("home") || desc.includes("house")) {
      return { icon: Home, color: "bg-green-100 text-green-600" }
    }
    return { icon: UtensilsCrossed, color: "bg-gray-100 text-gray-600" }
  }

  if (isRepayment) {
    const payerName = isPayer ? "You" : expense.paidBy.name
    const recipientName = isRecipient ? "you" : (expense.splits?.[0]?.userName || "someone")
    const paymentAmount = expense.amount || Math.abs(amount)

    return (
      <button
        onClick={onClick}
        className="w-full px-4 py-4 flex items-center gap-4 border-b border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      >
        {/* Cash Icon */}
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 border-2 border-black">
          <Banknote className="h-5 w-5 text-black" />
        </div>

        {/* Payment Description */}
        <div className="flex-1 min-w-0">
          <p className="text-base text-gray-700">
            <span className={cn("font-semibold", isPayer && "text-black")}>
              {payerName}
            </span>
            <span className="text-gray-500"> paid </span>
            <span className={cn("font-semibold", isRecipient && "text-black")}>
              {recipientName}
            </span>
            <span className="text-gray-500"> </span>
            <span className="font-bold text-black">₹{paymentAmount.toFixed(2)}</span>
          </p>
        </div>

        {/* Impact indicator for current user */}
        {(isPayer || isRecipient) && (
          <div className="shrink-0">
            <p className={cn(
              "text-sm font-bold",
              isRecipient ? "text-green-600" : "text-orange-600"
            )}>
              {isRecipient ? `+₹${Math.abs(amount).toFixed(0)}` : `-₹${Math.abs(amount).toFixed(0)}`}
            </p>
          </div>
        )}
      </button>
    )
  }

  const { icon: Icon, color } = getCategoryIcon()

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-4 flex items-center gap-4 border-b border-black hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
    >
      {/* Category Icon */}
      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2 border-black", color)}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Middle Content */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base truncate mb-1">
          {expense.description}
        </p>
        <p className="text-xs text-muted-foreground">
          paid by {expense.paidBy.name}
        </p>
      </div>

      {/* Right Content */}
      <div className="flex flex-col items-end ml-2 shrink-0">
        {amount === 0 ? (
          <p className="text-xs font-medium text-muted-foreground">
            not involved
          </p>
        ) : (
          <>
            <p
              className={cn(
                "text-xs font-semibold mb-1",
                isOwed ? "text-green-600" : "text-orange-600"
              )}
            >
              {isOwed ? "you lent" : "you borrowed"}
            </p>
            <p
              className={cn(
                "font-bold text-lg",
                isOwed ? "text-green-600" : "text-orange-600"
              )}
            >
              {isOwed ? "+" : "-"}₹{Math.abs(amount).toFixed(2)}
            </p>
          </>
        )}
      </div>
    </button>
  )
}

function groupExpensesByMonth(expenses: Expense[], sortOrder: "newest" | "oldest"): Record<string, Expense[]> {
  const grouped = expenses.reduce((acc, expense) => {
    const monthKey = expense.date.substring(0, 7)
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(expense)
    return acc
  }, {} as Record<string, Expense[]>)

  const sortedEntries = Object.entries(grouped).sort((a, b) => {
    return sortOrder === "newest"
      ? b[0].localeCompare(a[0])
      : a[0].localeCompare(b[0])
  })

  return Object.fromEntries(sortedEntries)
}

function groupExpensesByDate(expenses: Expense[], sortOrder: "newest" | "oldest"): Record<string, Expense[]> {
  const grouped = expenses.reduce((acc, expense) => {
    const dateKey = expense.date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(expense)
    return acc
  }, {} as Record<string, Expense[]>)

  const sortedEntries = Object.entries(grouped).sort((a, b) => {
    return sortOrder === "newest"
      ? b[0].localeCompare(a[0])
      : a[0].localeCompare(b[0])
  })

  return Object.fromEntries(sortedEntries)
}

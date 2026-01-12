"use client"

import { Expense } from "@/components/group-details-page"
import { Pizza, Beer, UtensilsCrossed, Banknote, Car, ShoppingBag, Coffee, Home, ArrowDownWideNarrow, ArrowUpNarrowWide, User, Users } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

function formatTime(time: string): string {
  if (!time) return ""
  try {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  } catch (e) {
    return time
  }
}

import { format, parseISO, isSameDay } from "date-fns"

interface ExpenseTimelineViewProps {
  expenses: Expense[]
  currentUserId: string
}

export const ExpenseTimelineView = ({
  expenses,
  currentUserId,
}: ExpenseTimelineViewProps) => {
  const router = useRouter()
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [viewMode, setViewMode] = useState<"personal" | "group">("personal")

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.full_date || a.date).getTime()
      const dateB = new Date(b.full_date || b.date).getTime()

      if (sortOrder === "newest") {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })
  }, [expenses, sortOrder])

  const groupedByDate = useMemo(() => {
    const grouped = sortedExpenses.reduce((acc, expense) => {
      const dateKey = expense.date
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(expense)
      return acc
    }, {} as Record<string, Expense[]>)

    return Object.entries(grouped).sort((a, b) => {
      return sortOrder === "newest"
        ? b[0].localeCompare(a[0])
        : a[0].localeCompare(b[0])
    })
  }, [sortedExpenses, sortOrder])

  return (
    <div className="bg-white py-6">
      <div className="max-w-2xl mx-auto px-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 border-2 border-black rounded-xl p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setViewMode("personal")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all",
                viewMode === "personal"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              )}
            >
              <User className="h-4 w-4" />
              <span>Personal</span>
            </button>
            <button
              onClick={() => setViewMode("group")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all",
                viewMode === "group"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black"
              )}
            >
              <Users className="h-4 w-4" />
              <span>Group</span>
            </button>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-xl font-bold bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            {sortOrder === "newest" ? (
              <>
                <ArrowDownWideNarrow className="h-4 w-4" />
                <span>Newest first</span>
              </>
            ) : (
              <>
                <ArrowUpNarrowWide className="h-4 w-4" />
                <span>Oldest first</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-black z-0" />

          <div className="space-y-8">
            {groupedByDate.map(([dateKey, dateExpenses]) => {
              const todayKey = format(new Date(), "yyyy-MM-dd")
              const isToday = dateKey === todayKey
              const date = parseISO(dateKey)
              return (
                <div key={dateKey} className="relative">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 py-2 mb-4 group/header">
                    {/* Header Background */}
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
                    {/* Line segment */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-black" />

                    <div className="relative ml-16 inline-block bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {isToday ? "Today" : format(date, "EEEE, MMMM d")}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {dateExpenses.map((expense, index) => (
                      <TimelineItem
                        key={expense.id}
                        expense={expense}
                        currentUserId={currentUserId}
                        onClick={() => router.push(`/expenses/${expense.id}`)}
                        isLast={index === dateExpenses.length - 1}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({
  expense,
  currentUserId,
  onClick,
  isLast,
  viewMode,
}: {
  expense: Expense
  currentUserId: string
  onClick: () => void
  isLast: boolean
  viewMode: "personal" | "group"
}) {
  const isRepayment = expense.type === "repayment"
  const amount = expense.user_net_amount || 0
  const isOwed = expense.user_is_owed || false
  const isLent = expense.user_is_lent || false
  const isPayer = expense.user_is_payer || false
  const isRecipient = expense.user_is_recipient || false
  const isGroupView = viewMode === "group"

  const getIcon = () => {
    const desc = expense.description.toLowerCase()

    if (isRepayment) {
      return Banknote
    }
    if (desc.includes("pizza") || desc.includes("dinner") || desc.includes("restaurant") || desc.includes("food")) {
      return Pizza
    }
    if (desc.includes("beer") || desc.includes("drink") || desc.includes("bar")) {
      return Beer
    }
    if (desc.includes("coffee") || desc.includes("breakfast")) {
      return Coffee
    }
    if (desc.includes("uber") || desc.includes("ride") || desc.includes("taxi") || desc.includes("car")) {
      return Car
    }
    if (desc.includes("shopping") || desc.includes("store")) {
      return ShoppingBag
    }
    if (desc.includes("home") || desc.includes("house")) {
      return Home
    }
    return UtensilsCrossed
  }

  const Icon = getIcon()

  return (
    <button
      onClick={onClick}
      className="relative flex items-start gap-4 mb-8 w-full text-left hover:opacity-80 transition-opacity group"
    >
      {/* Timeline dot */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={cn(
            "h-16 w-16 rounded-full border-4 border-black flex items-center justify-center",
            isGroupView
              ? "bg-blue-100"
              : isRepayment
                ? "bg-blue-100"
                : isOwed
                  ? "bg-green-100"
                  : isLent
                    ? "bg-orange-100"
                    : "bg-blue-100"
          )}
        >
          <Icon
            className={cn(
              "h-7 w-7",
              isGroupView
                ? "text-blue-600"
                : isRepayment
                  ? "text-blue-600"
                  : isOwed
                    ? "text-green-600"
                    : isLent
                      ? "text-orange-600"
                      : "text-blue-600"
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        {/* Date and Time */}
        <p className="text-sm font-bold text-muted-foreground/80 mb-2">
          {format(parseISO(expense.date), "MMM d, yyyy")}
          {expense.time && (
            <>
              <span className="mx-1.5">•</span>
              {formatTime(expense.time)}
            </>
          )}
        </p>

        {/* Expense details */}
        <div className="bg-white border-2 border-black rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {isRepayment ? (
                <>
                  <h3 className="font-bold text-lg mb-1">
                    {expense.paidBy.name} paid {isRecipient ? "you" : expense.splits.find((s: { userId: string; userName: string }) => s.userId !== expense.paidBy.id)?.userName || "someone"} ₹{expense.amount.toFixed(2)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Payment recorded
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-lg mb-1">{expense.description}</h3>
                  <p className="text-sm text-muted-foreground">
                    Paid by {expense.paidBy.name}
                  </p>
                </>
              )}
            </div>
            <div className="text-right ml-4">
              {isGroupView ? (
                <p className="font-bold text-xl text-black">
                  ₹{expense.amount.toFixed(2)}
                </p>
              ) : (
                <>
                  {amount === 0 && !isRepayment ? (
                    <p className="font-medium text-sm text-muted-foreground">
                      not involved
                    </p>
                  ) : (
                    <p
                      className={cn(
                        "font-bold text-xl",
                        isRepayment
                          ? isRecipient
                            ? "text-green-600"
                            : "text-gray-600"
                          : isOwed
                            ? "text-green-600"
                            : "text-orange-600"
                      )}
                    >
                      {isRepayment
                        ? isRecipient
                          ? "+"
                          : isPayer
                            ? "-"
                            : ""
                        : isOwed
                          ? "+"
                          : "-"}₹{Math.abs(amount).toFixed(2)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {!isRepayment && (
            <div className="mt-3 pt-3 border-t-2 border-black">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {isGroupView ? "Breakdown" : amount === 0 ? "Breakdown" : isOwed ? "You lent" : "You borrowed"}
              </p>
              <p className="text-sm font-medium">
                {expense.splits
                  .map((s: { userName: string; amount: number }) => `${s.userName}: ₹${s.amount.toFixed(2)}`)
                  .join(", ")}
              </p>
            </div>
          )}

          {isRepayment && (
            <div className="mt-3 pt-3 border-t-2 border-black">
              <p className="text-xs font-semibold text-muted-foreground">
                Payment settled
              </p>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
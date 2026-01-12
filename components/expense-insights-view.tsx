"use client"

import { useState } from "react"
import { Sparkles, Loader2, MessageSquareText, RefreshCcw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { authFetch } from "@/lib/auth-fetch"
import { Expense } from "@/hooks/use-groups"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Member {
    id: string
    name: string
    avatar_url?: string
}

interface ExpenseInsightsViewProps {
    expenses: Expense[]
    members: Member[]
}

export const ExpenseInsightsView = ({ expenses, members }: ExpenseInsightsViewProps) => {
    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <div className="bg-purple-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h2 className="font-black text-lg text-purple-900">AI Debt Narrative</h2>
                    </div>
                    <p className="text-sm font-medium text-purple-900/70">
                        See how each transaction simplified your group's debts and who shifted their balance.
                    </p>
                </div>

                <div className="space-y-4">
                    {expenses.map((expense) => (
                        <InsightCard key={expense.id} expense={expense} members={members} />
                    ))}

                    {expenses.length === 0 && (
                        <div className="text-center py-12 border-4 border-dashed border-gray-200 rounded-3xl">
                            <MessageSquareText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No transactions to analyze yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InsightCard({ expense, members }: { expense: Expense; members: Member[] }) {
    const payer = members.find(m => m.id === expense.paidBy.id)
    const isRepayment = expense.type === "repayment"
    const [isRequested, setIsRequested] = useState(false)

    const recipient = isRepayment
        ? members.find(m => m.id === expense.splits[0]?.userId)
        : null

    const { data: explanation, isLoading: loading, isError: error, refetch } = useQuery({
        queryKey: ["expense-explanation", expense.id],
        queryFn: async () => {
            const response = await authFetch("/api/expenses/explain", {
                method: "POST",
                body: JSON.stringify({ transaction_id: expense.id }),
            })
            if (!response.ok) throw new Error("Failed to fetch explanation")
            const data = await response.json()
            return data.explanation as string
        },
        enabled: false,
        initialData: expense.explanation,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60,
    })

    const handleFetch = () => {
        setIsRequested(true)
        refetch()
    }

    const showExplanation = explanation || (isRequested && loading) || error

    return (
        <div className="border-4 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className={cn(
                        "h-10 w-10 border-2 border-black shrink-0",
                        isRepayment ? "ring-2 ring-blue-400" : ""
                    )}>
                        <AvatarImage src={payer?.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className={cn(
                            "font-black text-xs",
                            isRepayment ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                        )}>
                            {(payer?.name || expense.description || "U")[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base truncate">
                            {isRepayment
                                ? `${payer?.name || "Someone"} paid ${recipient?.name || "someone"}`
                                : expense.description}
                        </h3>
                        <p className="text-xs font-bold text-gray-500">₹{expense.amount.toFixed(2)}</p>
                    </div>
                </div>

                {!explanation && !isRequested && (
                    <button
                        onClick={handleFetch}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-xl border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all whitespace-nowrap"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Magic Explain
                    </button>
                )}

                {isRequested && loading && !explanation && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl border-2 border-black border-dashed">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-[10px] font-black uppercase">Thinking...</span>
                    </div>
                )}
            </div>

            {showExplanation && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-purple-100/50 border-2 border-dashed border-purple-300 p-4 rounded-2xl relative">
                        <div className="absolute -top-3 left-6 bg-purple-600 text-white px-2 py-0.5 rounded-lg border-2 border-black text-[10px] font-black flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI INSIGHT
                        </div>

                        {error ? (
                            <div className="flex flex-col items-center gap-2 py-2">
                                <p className="text-xs font-bold text-red-600">Failed to analyze this transaction.</p>
                                <button
                                    onClick={() => refetch()}
                                    className="text-[10px] font-black underline flex items-center gap-1"
                                >
                                    <RefreshCcw className="h-2 w-2" /> Try again
                                </button>
                            </div>
                        ) : loading && !explanation ? (
                            <div className="space-y-2 pt-1">
                                <div className="h-3 w-full bg-purple-200/50 animate-pulse rounded" />
                                <div className="h-3 w-2/3 bg-purple-200/50 animate-pulse rounded" />
                            </div>
                        ) : (
                            <p className="text-sm font-medium leading-relaxed text-purple-900 italic pt-1">
                                "{explanation}"
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

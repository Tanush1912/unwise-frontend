"use client"

import { useState } from "react"
import { Expense, GroupDetails } from "@/hooks/use-groups"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { PieChart, Wallet } from "lucide-react"

interface BreakdownViewProps {
    expenses: Expense[]
    members: GroupDetails["members"]
    totalSpend: number
}

export const BreakdownView = ({ expenses, members, totalSpend }: BreakdownViewProps) => {
    const [viewMode, setViewMode] = useState<"spending" | "lending">("spending")

    const spendingByMember = expenses
        .filter((e) => e.type === "expense")
        .reduce((acc, expense) => {
            expense.splits.forEach((split) => {
                const userId = split.userId
                acc[userId] = (acc[userId] || 0) + split.amount
            })
            return acc
        }, {} as Record<string, number>)

    const lendingByMember = expenses
        .filter((e) => e.type === "expense")
        .reduce((acc, expense) => {
            if (expense.payers && expense.payers.length > 0) {
                expense.payers.forEach((payer) => {
                    const userId = payer.userId
                    acc[userId] = (acc[userId] || 0) + payer.amount
                })
            } else {
                const userId = expense.paidBy.id
                acc[userId] = (acc[userId] || 0) + expense.amount
            }
            return acc
        }, {} as Record<string, number>)

    const currentData = viewMode === "spending" ? spendingByMember : lendingByMember

    const breakdown = members
        .map((member) => {
            const value = currentData[member.id] || 0
            const percentage = totalSpend > 0 ? (value / totalSpend) * 100 : 0
            return {
                ...member,
                value,
                percentage,
            }
        })
        .sort((a, b) => b.value - a.value)

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="bg-white pb-8">
            {/* Total Group Spend Summary */}
            <div className="px-4 py-10 bg-white border-b-2 border-black text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-[#757575]">
                    Total Group Spending
                </p>
                <p className="text-6xl font-black tracking-tighter text-black italic uppercase">₹{totalSpend.toFixed(2)}</p>
            </div>

            {/* View Mode Control Bar */}
            <div className="px-4 py-4 flex justify-end">
                <div className="flex bg-gray-100 border-2 border-black rounded-xl p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <button
                        onClick={() => setViewMode("spending")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all",
                            viewMode === "spending"
                                ? "bg-black text-white"
                                : "text-gray-600 hover:text-black"
                        )}
                    >
                        <PieChart className="h-4 w-4" />
                        <span>Spending</span>
                    </button>
                    <button
                        onClick={() => setViewMode("lending")}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all",
                            viewMode === "lending"
                                ? "bg-black text-white"
                                : "text-gray-600 hover:text-black"
                        )}
                    >
                        <Wallet className="h-4 w-4" />
                        <span>Lending</span>
                    </button>
                </div>
            </div>

            <div className="px-4 space-y-8">
                <div className="space-y-6">
                    {breakdown.map((item, index) => (
                        <div key={item.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-black text-white text-[10px] font-bold border border-black italic">
                                        #{index + 1}
                                    </div>
                                    <Avatar className="h-10 w-10 border-2 border-black shrink-0">
                                        <AvatarImage src={item.avatar_url || undefined} alt={item.name} className="object-cover" />
                                        <AvatarFallback className="bg-gray-100 font-bold text-xs">
                                            {getInitials(item.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-base truncate max-w-[140px]">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg leading-none">₹{item.value.toFixed(2)}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                        {item.percentage.toFixed(1)}% of total
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="h-6 w-full bg-gray-100 border-2 border-black relative overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full border-r-2 border-black transition-all duration-500",
                                        index === 0 ? "bg-green-400" :
                                            index === 1 ? "bg-blue-400" :
                                                "bg-orange-400"
                                    )}
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {totalSpend === 0 && (
                    <div className="py-12 text-center border-4 border-dashed border-gray-200 rounded-none">
                        <p className="text-muted-foreground font-bold italic">No expenses recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}


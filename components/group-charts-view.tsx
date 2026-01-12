"use client"

import { useMemo } from "react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Expense } from "@/hooks/use-groups"
import { format, parseISO } from "date-fns"

interface GroupChartsViewProps {
    expenses: Expense[]
}

export const GroupChartsView = ({ expenses }: GroupChartsViewProps) => {
    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) =>
            parseISO(a.date).getTime() - parseISO(b.date).getTime()
        )
    }, [expenses])

    const cumulativeData = useMemo(() => {
        let runningTotal = 0
        const dataMap = new Map<string, number>()

        sortedExpenses.forEach((expense) => {
            if (expense.type === "expense") {
                const dateKey = format(parseISO(expense.date), "MMM dd")
                runningTotal += expense.amount
                dataMap.set(dateKey, runningTotal)
            }
        })

        return Array.from(dataMap.entries()).map(([date, total]) => ({
            date,
            total,
        }))
    }, [sortedExpenses])

    const dailyData = useMemo(() => {
        const dataMap = new Map<string, number>()

        sortedExpenses.forEach((expense) => {
            if (expense.type === "expense") {
                const dateKey = format(parseISO(expense.date), "MMM dd")
                dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + expense.amount)
            }
        })

        return Array.from(dataMap.entries()).map(([date, amount]) => ({
            date,
            amount,
        }))
    }, [sortedExpenses])

    const chartConfig = {
        total: {
            label: "Total Spend",
            color: "black",
        },
        amount: {
            label: "Daily Spend",
            color: "#f97316",
        },
    }

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                    <span className="text-2xl"></span>
                </div>
                <h3 className="text-lg font-bold text-black">No data yet</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                    Add some expenses to see your spending trends here.
                </p>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-10">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-black bg-orange-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-1">Total Group Spend</p>
                    <p className="text-2xl font-black text-black">
                        ₹{cumulativeData[cumulativeData.length - 1]?.total.toFixed(2) || "0.00"}
                    </p>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-green-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-wider mb-1">Average / Day</p>
                    <p className="text-2xl font-black text-black">
                        ₹{(cumulativeData[cumulativeData.length - 1]?.total / (dailyData.length || 1)).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Cumulative Spending Area Chart */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-black text-black uppercase tracking-tight">Total Spending</h3>
                    <p className="text-sm text-gray-500 font-medium">How your group spend has grown over time</p>
                </div>

                <div className="rounded-2xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <ChartContainer config={chartConfig} className="h-[250px] w-full aspect-auto">
                        <AreaChart data={cumulativeData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="black" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="black" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={12}
                                fontSize={12}
                                fontWeight={700}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                fontSize={12}
                                fontWeight={700}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                                type="stepAfter"
                                dataKey="total"
                                stroke="black"
                                strokeWidth={3}
                                fill="url(#fillTotal)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ChartContainer>
                </div>
            </section>

            {/* Daily Spending Bar Chart */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-black text-black uppercase tracking-tight">Daily Spending</h3>
                    <p className="text-sm text-gray-500 font-medium">Spending activity per day</p>
                </div>

                <div className="rounded-2xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <ChartContainer config={chartConfig} className="h-[250px] w-full aspect-auto">
                        <BarChart data={dailyData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={12}
                                fontSize={12}
                                fontWeight={700}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                fontSize={12}
                                fontWeight={700}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="amount"
                                fill="#f97316"
                                radius={[4, 4, 0, 0]}
                                stroke="black"
                                strokeWidth={2}
                                animationDuration={1200}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            </section>

        </div>
    )
}

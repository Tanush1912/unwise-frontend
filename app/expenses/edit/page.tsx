import { AddExpenseFlow } from "@/components/add-expense-flow"
import { BottomNav } from "@/components/bottom-nav"

export default async function EditExpensePage({
    searchParams,
}: {
    searchParams: Promise<{ groupId?: string; expenseId?: string }>
}) {
    const params = await searchParams
    return (
        <main className="min-h-screen pb-24">
            <AddExpenseFlow
                groupId={params?.groupId}
                expenseId={params?.expenseId}
            />
            <BottomNav />
        </main>
    )
}

import { AddExpenseFlow } from "@/components/add-expense-flow"
import { BottomNav } from "@/components/bottom-nav"

export default async function AddExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>
}) {
  const params = await searchParams
  return (
    <main className="min-h-screen pb-24">
      <AddExpenseFlow groupId={params?.groupId} />
      <BottomNav />
    </main>
  )
}


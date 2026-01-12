"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { authFetch } from "@/lib/auth-fetch"
import { useQueryClient } from "@tanstack/react-query"
import { useExpenseDetails, useDeleteExpense } from "@/hooks/use-groups"
import { Button } from "@/components/ui/button"
import { ExpenseSkeleton } from "@/components/ui/skeleton-loaders"
import { ExpenseChat } from "@/components/expense-chat"
import { SettleUpDialog } from "@/components/settle-up-dialog"
import { ChevronLeft, MoreVertical, Trash2, Edit, AlertCircle, RefreshCw } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useExpenseStore } from "@/store/expense-store"
import { format, parseISO } from "date-fns"
import { PageTransition } from "@/components/page-transition"

interface GroupMember {
    id: string
    name: string
    balance: number
    avatar_url?: string
}

export default function ExpensePage() {
    const router = useRouter()
    const params = useParams()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const deleteMutation = useDeleteExpense()
    const expenseId = params.expenseId as string
    const { data: expense, isLoading, isError, refetch } = useExpenseDetails(expenseId)
    const [showReceiptLightbox, setShowReceiptLightbox] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showSettleDialog, setShowSettleDialog] = useState(false)
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
    const [groupId, setGroupId] = useState<string>("")
    const { setTotalAmount, setDescription, setExpenseId, setDate: setStoreDate, setPaidBy } = useExpenseStore()

    useEffect(() => {
        if (isError) {
            toast.error("Could not load expense details")
        }
    }, [isError])

    const handleEdit = async () => {
        if (!expense) return

        try {
            const expenseRes = await authFetch(`/api/expenses/${expense.id}`)
            if (!expenseRes.ok) throw new Error("Failed to fetch expense")
            const expenseData = await expenseRes.json()

            const isRepayment = expenseData.type?.toLowerCase() === "repayment" || expenseData.type?.toUpperCase() === "PAYMENT"

            if (isRepayment) {
                const groupRes = await authFetch(`/api/groups/${expenseData.group_id}`)
                if (!groupRes.ok) throw new Error("Failed to fetch group")
                const groupData = await groupRes.json()

                setGroupId(expenseData.group_id)
                setGroupMembers(groupData.members?.map((m: any) => ({
                    id: m.id,
                    name: m.name || m.email,
                    balance: 0,
                    avatar_url: m.avatar_url
                })) || [])
                setShowSettleDialog(true)
                return
            }

            setExpenseId(expense.id)
            setDescription(expense.description)
            setTotalAmount(expense.amount)
            setStoreDate(expense.full_date || expense.date)
            setPaidBy(expense.paidBy.id)
            router.push(`/expenses/edit?expenseId=${expense.id}&groupId=${expenseData.group_id}`)
        } catch (error) {
            console.error("Error preparing edit:", error)
            toast.error("Failed to load expense details")
        }
    }

    const handleDelete = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteMutation.mutateAsync({
                id: expenseId,
                groupId: expense?.group_id
            })
            toast.success("Expense deleted")
            router.back()
        } catch (error) {
            toast.error("Failed to delete expense")
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    if (isLoading) return <ExpenseSkeleton />

    if (isError || (!isLoading && !expense)) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <AlertCircle className="h-10 w-10 text-orange-600" />
                </div>
                <h2 className="text-2xl font-black mb-2 uppercase italic leading-tight">Oops! Something went sideways</h2>
                <p className="text-muted-foreground mb-8 font-medium">We couldn't load this expense. It might have been deleted, or you're momentarily offline.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="border-2 border-black font-bold h-12 rounded-xl flex-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                    >
                        Go Back
                    </Button>
                    <Button
                        onClick={() => refetch()}
                        className="bg-black text-white border-2 border-black rounded-xl font-bold h-12 flex-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry
                    </Button>
                </div>
            </div>
        )
    }

    if (!expense) return null

    return (
        <PageTransition>
            <div className="min-h-screen bg-white pb-20">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-white border-b-2 border-black px-4 py-3 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-10 w-10 rounded-full hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-black uppercase italic tracking-tighter">Expense Details</h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-2 border-black font-bold">
                            <DropdownMenuItem onClick={handleEdit}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl mx-auto">
                    {/* Expense Info Card */}
                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-4">
                                <span className="text-2xl">🧾</span>
                            </div>
                            <h2 className="text-2xl font-bold leading-tight">{expense.description}</h2>
                            <p className="text-4xl font-black">₹{expense.amount.toFixed(2)}</p>
                            <div className="inline-block px-3 py-1 bg-gray-100 border border-black rounded-full text-sm font-medium">
                                Paid by <span className="font-bold">{expense.paidBy.name}</span>
                            </div>
                        </div>

                        {/* Split Details */}
                        <div className="border-2 border-black rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b-2 border-black font-bold text-sm uppercase tracking-wider text-gray-500">
                                Split with
                            </div>
                            <div className="divide-y-2 divide-black">
                                {expense.splits.map((split) => (
                                    <div key={split.userId} className="flex items-center justify-between p-4 bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                                                {split.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold">{split.userName}</span>
                                        </div>
                                        <span className="font-bold">₹{split.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Receipt (if exists) */}
                        {expense.receiptImage && (
                            <div className="space-y-2">
                                <p className="font-bold text-sm text-gray-500 uppercase">Receipt</p>
                                <button
                                    onClick={() => setShowReceiptLightbox(true)}
                                    className="w-full h-48 bg-gray-100 rounded-xl border-2 border-black overflow-hidden relative group"
                                >
                                    <img
                                        src={expense.receiptImage}
                                        className="w-full h-full object-cover"
                                        alt="Receipt"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-bold border-2 border-white px-3 py-1 rounded-full">View Full</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {format(parseISO(expense.date), "MMMM d, yyyy • h:mm a")}
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="mt-4">
                        <div className="px-6 pb-2">
                            <h3 className="font-black text-lg uppercase italic">Discussion</h3>
                        </div>
                        {user && <ExpenseChat expenseId={expense.id} currentUserId={user.id} />}
                    </div>
                </div>

                {/* Simple Lightbox */}
                {showReceiptLightbox && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setShowReceiptLightbox(false)}
                    >
                        <img
                            src={expense.receiptImage || ""}
                            className="max-w-full max-h-full rounded-lg shadow-2xl border-2 border-white"
                            alt="Full Receipt"
                        />
                    </div>
                )}

                {/* Settle Up Dialog for editing repayments */}
                {expense && showSettleDialog && (
                    <SettleUpDialog
                        groupId={groupId}
                        members={groupMembers}
                        isOpen={showSettleDialog}
                        onClose={() => {
                            setShowSettleDialog(false)
                            refetch()
                        }}
                        prefillPayerId={expense.paidBy.id}
                        prefillRecipientId={expense.splits[0]?.userId}
                        prefillAmount={expense.amount}
                        editingExpenseId={expense.id}
                    />
                )}

                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent className="border-2 border-black">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black uppercase italic">Delete Expense?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground font-medium">
                                Are you sure you want to delete <span className="font-bold text-black">"{expense.description}"</span>? This action cannot be undone and will update everyone's balances.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="border-2 border-black font-bold rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    confirmDelete()
                                }}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white border-2 border-black font-bold rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                            >
                                {isDeleting ? "Deleting..." : "Delete Expense"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PageTransition>
    )
}

"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
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
import { Receipt, Tag, Users, X, IndianRupee, Calendar as CalendarIcon, Camera, LayoutList } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ReceiptUpload } from "@/components/receipt-upload"
import { ReceiptVerification } from "@/components/receipt-verification"
import { ExpenseReview } from "@/components/expense-review"
import { PaidByDrawer } from "@/components/paid-by-drawer"
import { SplitMethodDrawer } from "@/components/split-method-drawer"
import { useExpenseStore } from "@/store/expense-store"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { useAuth } from "@/contexts/auth-context"
import { useGroups, useGroupDetails } from "@/hooks/use-groups"

type SplitMethod = "equally" | "exact" | "percentage"

export const AddExpenseFlow = ({ groupId: initialGroupId, expenseId }: { groupId?: string; expenseId?: string }) => {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const descriptionRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState<string | string[]>("You")
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equally")
  const [splits, setSplits] = useState<Record<string, number>>({})
  const [isPaidByOpen, setIsPaidByOpen] = useState(false)
  const [isSplitMethodOpen, setIsSplitMethodOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [receiptStep, setReceiptStep] = useState<"upload" | "verify" | "review">("upload")
  const [internalGroupId, setInternalGroupId] = useState<string | undefined>(initialGroupId)
  const [isSaving, setIsSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())

  const {
    receiptItems,
    resetExpense,
    setReceiptImageUrl,
    setReceiptItems,
    setTaxDetails,
    setTotalAmount,
    expenseId: storeExpenseId,
    description: storeDescription,
    totalAmount: storeTotalAmount,
    date: storeDate,
    paidBy: storePaidById,
    setDate: setStoreDate,
    setDescription: setStoreDescription
  } = useExpenseStore()
  const [fetchedExpense, setFetchedExpense] = useState<any>(null)

  const { data: groups = [] } = useGroups()
  const availableGroups = useMemo(() => groups.map(g => ({ id: g.id, name: g.name })), [groups])

  const { data: detailsData } = useGroupDetails(internalGroupId)

  useEffect(() => {
    return () => {
      resetExpense()
    }
  }, [])
  const groupMembers = useMemo(() => detailsData?.group.members.map(m => ({ id: m.id, name: m.name })) || [], [detailsData])
  const selectedGroup = useMemo(() => detailsData?.group ? { id: detailsData.group.id, name: detailsData.group.name } : null, [detailsData])
  const hasLoadedRef = useRef(false)

  const [currentUserMember, setCurrentUserMember] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (internalGroupId) {
      descriptionRef.current?.focus()
    }
  }, [internalGroupId])

  useEffect(() => {
    if (groupMembers.length > 0 && user?.id) {
      const currentUser = groupMembers.find((m: { id: string }) => m.id === user.id)
      if (currentUser && currentUser.id !== currentUserMember?.id) {
        setCurrentUserMember(currentUser)
      }
    }
  }, [groupMembers, user?.id, currentUserMember?.id])

  useEffect(() => {
    if (expenseId && storeExpenseId === expenseId) {
      if (storeDescription) setDescription(storeDescription)
      if (storeTotalAmount > 0) setAmount(storeTotalAmount.toString())
      if (storeDate) setExpenseDate(parseISO(storeDate))
      if (storePaidById && groupMembers.length > 0) {
        const member = groupMembers.find(m => m.id === storePaidById)
        if (member) {
          const displayName = member.id === user?.id ? "You" : member.name
          setPaidBy(displayName)
        }
      }

      if (receiptItems.length > 0) {
        setIsReceiptOpen(true)
        setReceiptStep("verify")
      }
    }
  }, [expenseId, storeExpenseId, groupMembers, user?.id, storeDescription, storeTotalAmount, storeDate, storePaidById])

  useEffect(() => {
    if (expenseId && (storeExpenseId !== expenseId || !storeDescription)) {
      authFetch(`/api/expenses/${expenseId}`)
        .then(res => res.json())
        .then(data => {
          setFetchedExpense(data)
          if (storeExpenseId !== expenseId) {
            setDescription(data.description)
            setAmount(data.total_amount.toString())
            if (data.date) {
              setExpenseDate(parseISO(data.date))
            }
          }
        })
        .catch(err => console.error('Error fetching expense:', err))
    }
  }, [expenseId, storeExpenseId, storeDescription])

  useEffect(() => {
    if (fetchedExpense && groupMembers.length > 0 && !hasLoadedRef.current) {
      const data = fetchedExpense
      hasLoadedRef.current = true

      if (data.payers && data.payers.length > 0) {
        const payerNames = data.payers.map((p: any) => {
          const member = groupMembers.find(m => m.id === p.user_id)
          return member ? member.name : "Unknown"
        })
        setPaidBy(payerNames.length === 1 ? payerNames[0] : payerNames)
      }

      const methodMap: Record<string, SplitMethod> = {
        'EQUAL': 'equally',
        'EXACT_AMOUNT': 'exact',
        'PERCENTAGE': 'percentage',
        'ITEMIZED': 'exact'
      }
      const mappedMethod = methodMap[data.split_method] || 'equally'
      setSplitMethod(mappedMethod)

      if (data.splits && data.splits.length > 0) {
        const splitMap: Record<string, number> = {}
        data.splits.forEach((s: any) => {
          const member = groupMembers.find(m => m.id === s.user_id)
          if (member) {
            splitMap[member.name] = s.amount
          }
        })
        setSplits(splitMap)
      }

      if (data.split_method === 'ITEMIZED') {
        const currentReceiptUrl = useExpenseStore.getState().receiptImageUrl
        if (data.receipt_image_url) {
          setReceiptImageUrl(data.receipt_image_url)
        } else if (!currentReceiptUrl) {
          setReceiptImageUrl(null)
          setReceiptImageUrl(null)
        }
        setTotalAmount(data.total_amount)

        const itemsSum = (data.receipt_items || []).reduce((sum: number, item: any) => sum + (item.price || 0), 0)
        const totalAmount = data.total_amount || 0
        const tax = data.tax || 0
        const cgst = data.cgst || 0
        const sgst = data.sgst || 0
        const serviceCharge = data.service_charge || 0
        const calculatedSubtotal = totalAmount - ((cgst + sgst + serviceCharge) || tax)
        const diffToTotal = Math.abs(itemsSum - totalAmount)
        const diffToSubtotal = Math.abs(itemsSum - calculatedSubtotal)
        const detectedPricesIncludeTax = diffToTotal < diffToSubtotal

        setTaxDetails({
          subtotal: calculatedSubtotal,
          tax: tax,
          cgst: cgst,
          sgst: sgst,
          serviceCharge: serviceCharge,
          pricesIncludeTax: detectedPricesIncludeTax
        })
        if (data.receipt_items && data.receipt_items.length > 0) {
          const items = data.receipt_items.map((item: any) => ({
            id: item.id || Math.random().toString(),
            name: item.name,
            price: item.price,
            assignedUsers: (item.assignments || []).map((a: any) => a.user_id)
          }))
          setReceiptItems(items)
        } else if (!data.items || data.items.length === 0) {
          const pseudoItems = data.splits.filter((s: any) => s.amount > 0).map((s: any) => {
            const member = groupMembers.find(m => m.id === s.user_id)
            return {
              id: `pseudo-${s.user_id}`,
              name: `Split for ${member?.name || 'User'}`,
              price: s.amount,
              assignedUsers: [s.user_id]
            }
          })
          setReceiptItems(pseudoItems)
        } else {
          setReceiptItems(data.items.map((item: any) => ({
            id: item.id || Math.random().toString(),
            name: item.name,
            price: item.price,
            assignedUsers: item.assigned_users || []
          })))
        }

        setIsReceiptOpen(true)
        setReceiptStep("verify")
      }
    }
  }, [fetchedExpense, groupMembers])

  useEffect(() => {
    if (currentUserMember) {
      if (paidBy === "You") {
        setPaidBy(currentUserMember.name)
      } else if (Array.isArray(paidBy) && paidBy.length === 1 && paidBy[0] === "You") {
        setPaidBy([currentUserMember.name])
      }
    }
  }, [currentUserMember])

  const mockMembers = useMemo(() => groupMembers.length > 0
    ? groupMembers.map(m => m.name)
    : ["You"], [groupMembers])

  const replaceYouWithUserName = (name: string): string => {
    if (name === "You" && currentUserMember) {
      return currentUserMember.name
    }
    return name
  }

  const getSplitMethodLabel = () => {
    if (splitMethod === "equally") return "Equally"
    if (splitMethod === "exact") return "Exact Amount"
    if (splitMethod === "percentage") return "Percentage"
    return "Equally"
  }

  const getPaidByLabel = () => {
    if (Array.isArray(paidBy)) {
      if (paidBy.length === 0) return "Select"
      if (paidBy.length === 1) return paidBy[0]
      return `${paidBy.length} people`
    }
    return paidBy
  }

  const handleReceiptUploaded = () => {
    if (description.trim()) {
      setStoreDescription(description.trim())
    }
    setReceiptStep("verify")
  }

  const handleReceiptVerified = () => {
    setReceiptStep("review")
  }

  const handleReceiptReviewed = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const {
        receiptItems,
        description: receiptDescription,
        paidBy: receiptPaidBy,
        tax,
        cgst,
        sgst,
        serviceCharge,
        totalAmount,
        receiptImageUrl,
        pricesIncludeTax
      } = useExpenseStore.getState()

      const userSplits: Record<string, number> = {}
      receiptItems.forEach(item => {
        if (item.assignedUsers && item.assignedUsers.length > 0) {
          const count = item.assignedUsers.length
          const perPersonBase = Math.floor((item.price / count) * 100) / 100
          const baseTotal = perPersonBase * count
          const residueCents = Math.round((item.price - baseTotal) * 100)

          item.assignedUsers.forEach((userId, index) => {
            const amount = index < residueCents ? perPersonBase + 0.01 : perPersonBase
            userSplits[userId] = (userSplits[userId] || 0) + amount
          })
        }
      })

      const participants = Object.keys(userSplits)

      if (participants.length === 0) {
        toast.error("Please assign items to users before submitting")
        return
      }

      const extraCharges = pricesIncludeTax ? 0 : ((cgst + sgst + serviceCharge) || tax)
      if (participants.length > 0 && extraCharges > 0) {
        const extraPerPersonBase = Math.floor((extraCharges / participants.length) * 100) / 100
        const extraBaseTotal = extraPerPersonBase * participants.length
        const extraResidueCents = Math.round((extraCharges - extraBaseTotal) * 100)

        participants.forEach((userId, index) => {
          const extraAmount = index < extraResidueCents ? extraPerPersonBase + 0.01 : extraPerPersonBase
          userSplits[userId] = (userSplits[userId] || 0) + extraAmount
        })
      }

      const MAX_AMOUNT = 10000000
      if (totalAmount > MAX_AMOUNT) {
        toast.error(`Amount exceeds maximum limit of ₹${MAX_AMOUNT.toLocaleString()}`)
        return
      }

      const expenseSplits = Object.entries(userSplits).map(([userId, amount]) => ({
        user_id: userId,
        amount: Number(amount.toFixed(2)),
      }))

      const splitTotal = expenseSplits.reduce((sum, s) => sum + s.amount, 0)
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        const diff = totalAmount - splitTotal
        expenseSplits[0].amount = Number((expenseSplits[0].amount + diff).toFixed(2))
      }

      const payerId = receiptPaidBy || user?.id
      if (!payerId) {
        toast.error("Payer not specified")
        return
      }

      const receiptItemsPayload = receiptItems.map(item => ({
        name: item.name,
        price: item.price,
        assigned_to: item.assignedUsers
      }))

      const expenseData = {
        group_id: internalGroupId,
        total_amount: totalAmount,
        description: receiptDescription || "Scanned receipt",
        date: format(expenseDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        split_method: "ITEMIZED",
        type: "EXPENSE",
        tax,
        cgst,
        sgst,
        service_charge: serviceCharge,
        receipt_image_url: receiptImageUrl,
        payers: [{
          user_id: payerId,
          amount_paid: totalAmount,
        }],
        splits: expenseSplits,
        receipt_items: receiptItemsPayload,
      }

      const url = expenseId ? `/api/expenses/${expenseId}` : "/api/expenses"
      const method = expenseId ? "PUT" : "POST"

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      })

      if (response.ok) {
        toast.success(expenseId ? "Expense updated successfully!" : "Expense added successfully!")

        const invalidationPromises = [
          queryClient.invalidateQueries({ queryKey: ["groups"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["friends"] })
        ]

        if (internalGroupId) {
          invalidationPromises.push(
            queryClient.invalidateQueries({ queryKey: ["group", internalGroupId] })
          )
        }

        if (user?.id) {
          invalidationPromises.push(
            queryClient.invalidateQueries({ queryKey: ["groups", user.id] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] })
          )
          if (internalGroupId) {
            invalidationPromises.push(
              queryClient.invalidateQueries({ queryKey: ["group", internalGroupId, user.id] })
            )
          }
        }

        await Promise.all(invalidationPromises)
        setIsReceiptOpen(false)
        setReceiptStep("upload")
        resetExpense()
        router.push(`/groups/${internalGroupId}`)
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to add expense' }))
        toast.error(error.error || "Failed to add expense")
      }
    } catch (error) {
      console.error("Error saving receipt expense:", error)
      toast.error("Failed to add expense")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (isSaving) return

    const MAX_AMOUNT = 10000000
    const numAmount = parseFloat(amount)

    if (!description.trim() || !amount || numAmount <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    if (numAmount > MAX_AMOUNT) {
      toast.error(`Amount exceeds maximum limit of ₹${MAX_AMOUNT.toLocaleString()}`)
      return
    }

    setIsSaving(true)
    try {

      const totalAmount = parseFloat(amount)
      const paidByArray = Array.isArray(paidBy) ? paidBy : [paidBy]
      const payers = paidByArray.map((payerName: string) => {
        const actualName = replaceYouWithUserName(payerName)
        const member = groupMembers.find(m => m.name === actualName)
        if (!member) throw new Error(`Member "${actualName}" not found in group`)
        return {
          user_id: member.id,
          amount_paid: totalAmount / paidByArray.length,
        }
      })

      let expenseSplits: Array<{ user_id: string; amount: number; percentage?: number }> = []

      if (splitMethod === "equally") {
        const involvedMemberNames = Object.keys(splits).length > 0
          ? Object.keys(splits)
          : mockMembers;

        const count = involvedMemberNames.length
        const perPersonBase = Math.floor((totalAmount / count) * 100) / 100
        const baseTotal = perPersonBase * count
        const residueCents = Math.round((totalAmount - baseTotal) * 100)

        expenseSplits = involvedMemberNames.map((memberName: string, index: number) => {
          const actualName = replaceYouWithUserName(memberName)
          const member = groupMembers.find(m => m.name === actualName)
          if (!member) throw new Error(`Member "${actualName}" not found in group`)
          const amount = index < residueCents ? perPersonBase + 0.01 : perPersonBase
          return {
            user_id: member.id,
            amount: Number(amount.toFixed(2)),
          }
        })
      } else if (splitMethod === "exact" || splitMethod === "percentage") {
        expenseSplits = Object.entries(splits).map(([memberName, amount]) => {
          const actualName = replaceYouWithUserName(memberName)
          const member = groupMembers.find(m => m.name === actualName)
          if (!member) throw new Error(`Member "${actualName}" not found in group`)
          return {
            user_id: member.id,
            amount: amount as number,
            ...(splitMethod === "percentage" && { percentage: ((amount as number) / totalAmount) * 100 }),
          }
        })
      }

      const { receiptImageUrl } = useExpenseStore.getState()
      const expenseData = {
        group_id: internalGroupId,
        total_amount: totalAmount,
        description: description.trim(),
        date: format(expenseDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        split_method: splitMethod === "equally" ? "EQUAL" : splitMethod === "exact" ? "EXACT_AMOUNT" : splitMethod === "percentage" ? "PERCENTAGE" : "EQUAL",
        type: "EXPENSE",
        receipt_image_url: receiptImageUrl,
        payers,
        splits: expenseSplits,
      }

      const url = expenseId ? `/api/expenses/${expenseId}` : "/api/expenses"
      const method = expenseId ? "PUT" : "POST"

      const saveAction = async () => {
        const response = await authFetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseData),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: `Failed to ${expenseId ? 'update' : 'add'} expense` }))
          throw new Error(error.error || `Failed to ${expenseId ? 'update' : 'add'} expense`)
        }

        const invalidationPromises = [
          queryClient.invalidateQueries({ queryKey: ["groups"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["friends"] })
        ]

        if (internalGroupId) {
          invalidationPromises.push(
            queryClient.invalidateQueries({ queryKey: ["group", internalGroupId] })
          )
        }

        if (user?.id) {
          invalidationPromises.push(
            queryClient.invalidateQueries({ queryKey: ["groups", user.id] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] })
          )
          if (internalGroupId) {
            invalidationPromises.push(
              queryClient.invalidateQueries({ queryKey: ["group", internalGroupId, user.id] })
            )
          }
        }

        await Promise.all(invalidationPromises)

        router.back()
        return response
      }

      toast.promise(saveAction(), {
        loading: expenseId ? "Updating expense..." : "Adding expense...",
        success: expenseId ? "Expense updated!" : "Expense added!",
        error: (err) => err.message
      })

    } catch (error: any) {
      console.error("Error saving expense:", error)
    } finally {
      setIsSaving(false)
    }
  }


  const isValid = description.trim() && amount && parseFloat(amount) > 0

  if (!internalGroupId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-white"
      >
        <header className="sticky top-0 z-40 bg-white border-b-2 border-black">
          <div className="flex items-center px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-full"
            >
              <span className="text-2xl">×</span>
            </Button>
            <div className="flex items-center gap-3 ml-2">
              <div className="w-8 h-8 bg-black border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-4 h-4 text-white fill-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-black text-black tracking-tighter uppercase italic">Add Expense</h1>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <p className="text-muted-foreground font-medium">Choose a group</p>
          <div className="space-y-2">
            {availableGroups.length === 0 ? (
              <p>No groups found. Create one first!</p>
            ) : (
              availableGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setInternalGroupId(group.id)}
                  className="w-full flex items-center gap-3 p-3 border-2 border-black rounded-xl hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-black/10">
                    <Users className="h-5 w-5 text-black" />
                  </div>
                  <span className="font-bold text-lg">{group.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white flex flex-col"
    >
      <header className="sticky top-0 z-40 bg-white border-b-2 border-black">
        <div className="flex flex-col px-4 py-3 gap-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-full"
            >
              <span className="text-2xl">×</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-4 h-4 text-white fill-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-black text-black tracking-tighter uppercase italic">{expenseId ? "Edit Expense" : "Add Expense"}</h1>
            </div>
            <div className="w-10" />
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 border-2 border-black rounded-full bg-white text-sm font-medium">
              <span className="text-muted-foreground">With you and:</span>
              <button
                onClick={() => setInternalGroupId(undefined)}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <div className="h-5 w-5 rounded-md bg-green-900 flex items-center justify-center">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <span className="font-bold">{selectedGroup?.name || "..."}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 space-y-8 max-w-md mx-auto w-full pb-32">
        {/* Description Field */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <Tag className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1 border-b-2 border-black pb-1 group focus-within:border-green-600 transition-colors">
            <input
              ref={descriptionRef}
              type="text"
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xl font-bold placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Amount Field */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 border-2 border-black rounded-xl flex items-center justify-center bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <IndianRupee className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1 border-b-2 border-black pb-1 group focus-within:border-green-600 transition-colors">
            <input
              ref={amountRef}
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-2xl font-black placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Paid By & Split Info */}
        <div className="py-2 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-base font-bold text-gray-700">
            <span>Paid by</span>
            <button
              onClick={() => setIsPaidByOpen(true)}
              className="px-3 py-1.5 border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              {getPaidByLabel()}
            </button>
            <span>and split</span>
            <button
              onClick={() => setIsSplitMethodOpen(true)}
              className="px-3 py-1.5 border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              {getSplitMethodLabel()}
            </button>
          </div>
        </div>
      </div>

      {/* Date & Toolbar Row (Splitwise Style) */}
      <div className="fixed bottom-[184px] left-0 right-0 px-4 py-2 bg-white flex items-center justify-between border-t border-gray-100 z-20">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent hover:border-black/10 hover:bg-gray-50 transition-all active:scale-95">
              <CalendarIcon className="h-5 w-5 text-black" />
              <span className="text-sm font-bold text-black">
                {format(expenseDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  ? "Today"
                  : format(expenseDate, "MMM d, yyyy")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" align="start">
            <Calendar
              mode="single"
              selected={expenseDate}
              onSelect={(d) => {
                if (d) {
                  setExpenseDate(d)
                  setStoreDate(d.toISOString())
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (description.trim()) {
                setStoreDescription(description.trim())
              }
              setIsReceiptOpen(true)
            }}
            className="p-2.5 rounded-full text-black hover:bg-gray-100 transition-all active:scale-90"
          >
            <Camera className="h-6 w-6" />
          </button>
          <button
            className="p-2.5 rounded-full text-black hover:bg-gray-100 transition-all active:scale-90"
            onClick={() => setIsSplitMethodOpen(true)}
          >
            <LayoutList className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 pb-4 space-y-3 z-30">
        <Button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="w-full h-14 text-lg font-semibold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {mockMembers.length > 0 && (
        <>
          <PaidByDrawer
            isOpen={isPaidByOpen}
            onClose={() => setIsPaidByOpen(false)}
            members={mockMembers}
            selectedPayer={paidBy}
            onPayerChange={setPaidBy}
          />

          <SplitMethodDrawer
            isOpen={isSplitMethodOpen}
            onClose={() => setIsSplitMethodOpen(false)}
            totalAmount={parseFloat(amount) || 0}
            members={mockMembers}
            selectedMethod={splitMethod}
            onMethodChange={setSplitMethod}
            onSplitChange={setSplits}
            initialSplits={splits}
          />
        </>
      )}

      <Drawer
        open={isReceiptOpen}
        onOpenChange={(open) => {
          setIsReceiptOpen(open)
        }}
      >
        <DrawerContent className="border-2 border-black max-h-[90vh]">
          <DrawerHeader className="relative">
            <DrawerTitle className="text-2xl font-bold">Scan Receipt</DrawerTitle>
            {receiptStep !== "upload" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCloseConfirm(true)}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </DrawerHeader>
          <div className="overflow-y-auto p-4">
            {receiptStep === "upload" && (
              <ReceiptUpload onUploaded={handleReceiptUploaded} />
            )}
            {receiptStep === "verify" && (
              <ReceiptVerification
                onComplete={handleReceiptVerified}
                groupMembers={groupMembers}
              />
            )}
            {receiptStep === "review" && (
              <ExpenseReview
                onSubmit={handleReceiptReviewed}
                onBack={() => setReceiptStep("verify")}
                groupMembers={groupMembers}
                currentUserId={user?.id}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Close confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard receipt scan?</AlertDialogTitle>
            <AlertDialogDescription>
              If you close now, your scanned receipt and all item assignments will be lost. You'll need to scan the receipt again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black">Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCloseConfirm(false)
                setIsReceiptOpen(false)
                setReceiptStep("upload")
                resetExpense()
              }}
              className="bg-red-600 hover:bg-red-700 border-2 border-black"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useExpenseStore } from "@/store/expense-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ChevronLeft } from "lucide-react"

interface ExpenseReviewProps {
  onSubmit: () => void
  onBack?: () => void
  groupMembers?: Array<{ id: string; name: string }>
  currentUserId?: string
}

export const ExpenseReview = ({ onSubmit, onBack, groupMembers = [], currentUserId }: ExpenseReviewProps) => {
  const {
    receiptItems,
    totalAmount,
    description,
    setDescription,
    setPaidBy,
    paidBy,
    tax,
    cgst,
    sgst,
    serviceCharge,
    pricesIncludeTax
  } = useExpenseStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!paidBy && currentUserId) {
      setPaidBy(currentUserId)
    }
  }, [currentUserId, paidBy, setPaidBy])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      onSubmit()
    } catch (error) {
      console.error("Error submitting expense:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserName = (userId: string) => {
    return groupMembers.find((u) => u.id === userId)?.name || userId
  }

  const calculateUserTotals = () => {
    const totals: Record<string, number> = {}

    receiptItems.forEach((item) => {
      if (item.assignedUsers.length > 0) {
        const count = item.assignedUsers.length
        const perPersonBase = Math.floor((item.price / count) * 100) / 100
        const baseTotal = perPersonBase * count
        const residueCents = Math.round((item.price - baseTotal) * 100)

        item.assignedUsers.forEach((userId, index) => {
          const amount = index < residueCents ? perPersonBase + 0.01 : perPersonBase
          totals[userId] = (totals[userId] || 0) + amount
        })
      }
    })

    const participants = Object.keys(totals)
    const extraCharges = pricesIncludeTax ? 0 : ((cgst + sgst + serviceCharge) || tax)
    if (participants.length > 0 && extraCharges > 0) {
      const extraPerPersonBase = Math.floor((extraCharges / participants.length) * 100) / 100
      const extraBaseTotal = extraPerPersonBase * participants.length
      const extraResidueCents = Math.round((extraCharges - extraBaseTotal) * 100)

      participants.forEach((userId, index) => {
        const extraAmount = index < extraResidueCents ? extraPerPersonBase + 0.01 : extraPerPersonBase
        totals[userId] = (totals[userId] || 0) + extraAmount
      })
    }

    return totals
  }

  const userTotals = calculateUserTotals()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Dinner at Restaurant"
        />
      </div>

      <div className="space-y-2">
        <Label>Paid By</Label>
        <div className="grid grid-cols-2 gap-2">
          {groupMembers.map((user) => (
            <Button
              key={user.id}
              variant={paidBy === user.id ? "default" : "outline"}
              onClick={() => setPaidBy(user.id)}
              className="h-12"
            >
              {user.name}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Expense Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {receiptItems.map((item) => {
            const splitAmount = item.price / (item.assignedUsers.length || 1)
            return (
              <div key={item.id} className="border-b-2 border-black pb-3 last:border-0">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-semibold">₹{item.price.toFixed(2)}</span>
                </div>
                {item.assignedUsers.length > 0 && (
                  <div className="text-sm text-muted-foreground pl-2">
                    {item.assignedUsers.map((userId) => (
                      <div key={userId} className="flex justify-between">
                        <span>{getUserName(userId)}:</span>
                        <span>₹{splitAmount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="bg-muted border-2 border-black">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-lg">₹{totalAmount.toFixed(2)}</span>
            </div>
            {Object.keys(userTotals).length > 0 && (
              <div className="pt-2 border-t-2 border-black space-y-1">
                <p className="text-sm font-semibold mb-2">Per Person:</p>
                {Object.entries(userTotals).map(([userId, amount]) => (
                  <div key={userId} className="flex justify-between text-sm">
                    <span>{getUserName(userId)}:</span>
                    <span className="font-semibold">₹{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="h-12 px-4 border-2 border-black"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          className="flex-1 h-12 text-lg"
          disabled={isSubmitting || !paidBy}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Submit Expense
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

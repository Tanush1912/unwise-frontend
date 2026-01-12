"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { useAuth } from "@/contexts/auth-context"

interface Member {
  id: string
  name: string
  balance: number
  avatar_url?: string
}

interface SettleUpDialogProps {
  groupId: string
  members: Member[]
  isOpen: boolean
  onClose: () => void
  prefillPayerId?: string
  prefillRecipientId?: string
  prefillAmount?: number
  editingExpenseId?: string
}

export const SettleUpDialog = ({
  groupId,
  members,
  isOpen,
  onClose,
  prefillPayerId,
  prefillRecipientId,
  prefillAmount,
  editingExpenseId,
}: SettleUpDialogProps) => {
  const [payerId, setPayerId] = useState<string>("")
  const [recipientId, setRecipientId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const owesMost = members
    .filter((m) => m.balance < 0 && m.id !== (user?.id || ""))
    .sort((a, b) => a.balance - b.balance)[0]

  useEffect(() => {
    if (isOpen) {
      if (prefillPayerId && prefillRecipientId && prefillAmount) {
        setPayerId(prefillPayerId)
        setRecipientId(prefillRecipientId)
        setAmount(prefillAmount.toFixed(2))
      } else {
        if (!payerId) setPayerId(user?.id || members[0]?.id || "")
        if (!recipientId && owesMost) {
          setRecipientId(owesMost.id)
          setAmount(Math.abs(owesMost.balance).toFixed(2))
        }
      }
    }
  }, [isOpen, prefillPayerId, prefillRecipientId, prefillAmount, user?.id, owesMost, members])

  const handleSubmit = async () => {
    const MAX_AMOUNT = 10000000
    const numAmount = parseFloat(amount)

    if (!payerId || !recipientId || !amount || numAmount <= 0) {
      toast.error("Please fill in all fields")
      return
    }

    if (numAmount > MAX_AMOUNT) {
      toast.error(`Amount exceeds maximum limit of ₹${MAX_AMOUNT.toLocaleString()}`)
      return
    }


    setIsSubmitting(true)
    try {
      let response
      if (editingExpenseId) {
        const payload = {
          type: "PAYMENT",
          payer_id: payerId,
          receiver_id: recipientId,
          total_amount: parseFloat(amount),
        }
        response = await authFetch(`/api/expenses/${editingExpenseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      } else {
        const payload = {
          payer_id: payerId,
          receiver_id: recipientId,
          amount: parseFloat(amount),
        }
        response = await authFetch(`/api/groups/${groupId}/settle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        toast.success(editingExpenseId ? "Payment updated successfully!" : "Payment recorded successfully!")

        const invalidationPromises = [
          queryClient.invalidateQueries({ queryKey: ["groups"] }),
          queryClient.invalidateQueries({ queryKey: ["group", groupId] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        ]

        if (user?.id) {
          invalidationPromises.push(
            queryClient.invalidateQueries({ queryKey: ["groups", user.id] }),
            queryClient.invalidateQueries({ queryKey: ["group", groupId, user.id] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] })
          )
        }

        await Promise.all(invalidationPromises)

        if (editingExpenseId) {
          await queryClient.invalidateQueries({ queryKey: ["expense", editingExpenseId] })
        }

        onClose()
        setPayerId("")
        setRecipientId("")
        setAmount("")
      } else {
        const errorData = await response.text()
        console.error('Payment API Error:', response.status, errorData)
        toast.error(editingExpenseId ? "Failed to update payment" : "Failed to record payment")
      }
    } catch (error) {
      console.error("Error with payment:", error)
      toast.error(editingExpenseId ? "Failed to update payment" : "Failed to record payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const payer = members.find((m) => m.id === payerId)
  const recipient = members.find((m) => m.id === recipientId)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-2 border-black sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingExpenseId ? "Edit Payment" : "Record a Payment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Visual: Two Avatars with Arrow */}
          {payer && recipient && (
            <div className="flex items-center justify-center gap-4 py-3">
              <div className="flex flex-col items-center gap-1.5">
                <Avatar className="h-14 w-14 border-4 border-black">
                  {payer.avatar_url && <AvatarImage src={payer.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {getInitials(payer.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold">{payer.name}</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1.5">
                <Avatar className="h-14 w-14 border-4 border-black">
                  {recipient.avatar_url && <AvatarImage src={recipient.avatar_url} />}
                  <AvatarFallback className="bg-green-100 text-green-700 font-bold text-lg">
                    {getInitials(recipient.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold">{recipient.name}</p>
              </div>
            </div>
          )}

          {/* Payer Select */}
          <div className="space-y-2">
            <Label htmlFor="payer" className="text-base font-semibold">Payer</Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger id="payer" className="border-2 border-black h-12">
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Select */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-base font-semibold">Recipient</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger id="recipient" className="border-2 border-black h-12">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => m.id !== payerId)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-bold">Amount</Label>
            <div className="relative text-center">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-black">₹</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="pl-10 pr-4 py-4 text-2xl font-black text-center border-2 border-black h-auto"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-2 border-black h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!payerId || !recipientId || !amount || parseFloat(amount) <= 0 || isSubmitting}
            className="flex-1 h-12 text-base font-semibold"
          >
            {isSubmitting ? "Saving..." : editingExpenseId ? "Update Payment" : "Save Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
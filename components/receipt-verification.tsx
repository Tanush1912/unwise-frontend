"use client"

import { useState } from "react"
import { useExpenseStore } from "@/store/expense-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DrawerNested, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Users, Edit2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ReceiptVerificationProps {
  onComplete: () => void
  groupMembers?: Array<{ id: string; name: string }>
}

export const ReceiptVerification = ({ onComplete, groupMembers = [] }: ReceiptVerificationProps) => {
  const {
    receiptItems,
    updateReceiptItem,
    assignUserToItem,
    unassignUserFromItem,
    tax,
    cgst,
    sgst,
    serviceCharge,
    totalAmount,
    pricesIncludeTax
  } = useExpenseStore()

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null)
  const [unassignedItemIds, setUnassignedItemIds] = useState<Set<string>>(new Set())

  const handleEditStart = (itemId: string) => {
    const item = receiptItems.find((i) => i.id === itemId)
    if (item) {
      setEditingItemId(itemId)
      setEditName(item.name)
      setEditPrice(item.price.toString())
    }
  }

  const handleEditSave = (itemId: string) => {
    const price = parseFloat(editPrice)
    const MAX_AMOUNT = 10000000
    if (!isNaN(price) && price > 0 && editName.trim()) {
      if (price > MAX_AMOUNT) {
        toast.error(`Amount exceeds maximum limit of ₹${MAX_AMOUNT.toLocaleString()}`)
        return
      }
      updateReceiptItem(itemId, {
        name: editName.trim(),
        price: price,
      })
      setEditingItemId(null)
      setEditName("")
      setEditPrice("")
    }
  }

  const handleUserToggle = (itemId: string, userId: string) => {
    const item = receiptItems.find((i) => i.id === itemId)
    if (item?.assignedUsers.includes(userId)) {
      unassignUserFromItem(itemId, userId)
    } else {
      assignUserToItem(itemId, userId)
      if (unassignedItemIds.has(itemId)) {
        const newSet = new Set(unassignedItemIds)
        newSet.delete(itemId)
        setUnassignedItemIds(newSet)
      }
    }
  }

  const calculateSplit = (item: typeof receiptItems[0]) => {
    if (item.assignedUsers.length === 0) return 0
    return item.price / item.assignedUsers.length
  }

  const totalAssigned = receiptItems.reduce((sum, item) => {
    return sum + (item.assignedUsers.length > 0 ? item.price : 0)
  }, 0)

  const allParticipants = Array.from(new Set(receiptItems.flatMap(i => i.assignedUsers)))
  const extraCharges = pricesIncludeTax ? 0 : ((cgst + sgst + serviceCharge) || tax)
  const extraPerPerson = allParticipants.length > 0 ? extraCharges / allParticipants.length : 0

  const assigningItem = receiptItems.find(i => i.id === assigningItemId)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {receiptItems.map((item) => {
          const isEditing = editingItemId === item.id
          const splitAmount = calculateSplit(item)
          const isAssigned = item.assignedUsers.length > 0
          const hasError = unassignedItemIds.has(item.id)

          return (
            <Card key={item.id} className={cn(
              "overflow-hidden border-2",
              hasError ? "border-red-500" : "border-black"
            )}>
              <CardContent className="p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Item name"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleEditSave(item.id)}
                        disabled={!editName.trim() || isNaN(parseFloat(editPrice)) || parseFloat(editPrice) <= 0}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-2xl font-bold">₹{item.price.toFixed(2)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStart(item.id)}
                        className="h-10 w-10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setAssigningItemId(item.id)}
                      className={cn(
                        "w-full justify-start gap-2 h-12",
                        isAssigned && "border-primary bg-primary/5"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      {item.assignedUsers.length === 0 ? (
                        <span>Tap to assign users</span>
                      ) : (
                        <span>
                          {item.assignedUsers.length} user{item.assignedUsers.length > 1 ? "s" : ""} assigned
                        </span>
                      )}
                    </Button>

                    {isAssigned && (
                      <div className="pt-3 border-t-2 border-black">
                        <p className="text-sm font-medium text-muted-foreground">
                          ₹{splitAmount.toFixed(2)} per person ({item.assignedUsers.length} {item.assignedUsers.length === 1 ? "person" : "people"})
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DrawerNested
        open={!!assigningItemId}
        onOpenChange={(open) => !open && setAssigningItemId(null)}
      >
        <DrawerContent className="border-2 border-black max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Assign {assigningItem?.name || "Item"} to Users</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-3 overflow-y-auto">
            {groupMembers.map((user) => {
              const isAssigned = assigningItem?.assignedUsers.includes(user.id) ?? false
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-black bg-card hover:bg-muted/50 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  onClick={() => assigningItemId && handleUserToggle(assigningItemId, user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={isAssigned}
                      onCheckedChange={() => assigningItemId && handleUserToggle(assigningItemId, user.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="font-medium cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {user.name}
                    </label>
                  </div>
                  {isAssigned && assigningItem && (
                    <span className="text-sm font-semibold text-primary">
                      ₹{calculateSplit(assigningItem).toFixed(2)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="p-4 pt-0">
            <Button onClick={() => setAssigningItemId(null)} className="w-full h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
              Done
            </Button>
          </div>
        </DrawerContent>
      </DrawerNested>

      <Card className="bg-muted/30 border-2 border-black">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items Base Total:</span>
            <span className="font-semibold">₹{totalAssigned.toFixed(2)}</span>
          </div>

          {(cgst > 0 || sgst > 0 || serviceCharge > 0 || tax > 0) && (
            <div className="space-y-1 py-2 border-y border-black/10">
              {/* Tax-inclusive indicator */}
              {pricesIncludeTax ? (
                <div className="flex justify-center mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200">
                    Tax Included in Prices
                  </span>
                </div>
              ) : (
                <div className="flex justify-center mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold border border-orange-200">
                    + Tax Added Proportionally
                  </span>
                </div>
              )}
              {cgst > 0 && (
                <div className="flex justify-between text-xs">
                  <span>CGST:</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
              )}
              {sgst > 0 && (
                <div className="flex justify-between text-xs">
                  <span>SGST:</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
              )}
              {serviceCharge > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Service Charge:</span>
                  <span>₹{serviceCharge.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && cgst === 0 && sgst === 0 && (
                <div className="flex justify-between text-xs">
                  <span>Tax:</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              )}
              {allParticipants.length > 0 && !pricesIncludeTax && (
                <div className="pt-1 text-[10px] text-muted-foreground text-center italic">
                  +₹{extraPerPerson.toFixed(2)} tax/service burden added per participant
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-lg">Total Amount:</span>
            <span className="text-2xl font-black">₹{totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => {
          const itemsWithoutUsers = receiptItems.filter(item => item.assignedUsers.length === 0)
          if (itemsWithoutUsers.length > 0) {
            setUnassignedItemIds(new Set(itemsWithoutUsers.map(item => item.id)))
            toast.error(`Please assign users to all ${itemsWithoutUsers.length} item${itemsWithoutUsers.length > 1 ? 's' : ''} before continuing`)
            return
          }
          onComplete()
        }}
        className="w-full h-12 text-lg flex justify-center items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        disabled={totalAssigned === 0}
      >
        Continue to Review
      </Button>
    </div>
  )
}
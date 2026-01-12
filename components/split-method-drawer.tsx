"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SplitMethodDrawerProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  members: string[]
  selectedMethod: "equally" | "exact" | "percentage"
  onMethodChange: (method: "equally" | "exact" | "percentage") => void
  onSplitChange: (splits: Record<string, number>) => void
  initialSplits?: Record<string, number>
}

export const SplitMethodDrawer = ({
  isOpen,
  onClose,
  totalAmount,
  members,
  selectedMethod,
  onMethodChange,
  onSplitChange,
  initialSplits,
}: SplitMethodDrawerProps) => {
  const [equalSelected, setEqualSelected] = useState<string[]>(members)
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({})
  const [percentages, setPercentages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialSplits && Object.keys(initialSplits).length > 0) {
      if (selectedMethod === "equally") {
        setEqualSelected(Object.keys(initialSplits))
      } else if (selectedMethod === "exact") {
        const amounts: Record<string, string> = {}
        Object.entries(initialSplits).forEach(([member, amount]) => {
          amounts[member] = amount.toFixed(2)
        })
        setExactAmounts(amounts)
      } else if (selectedMethod === "percentage") {
        const percents: Record<string, string> = {}
        Object.entries(initialSplits).forEach(([member, amount]) => {
          percents[member] = ((amount / totalAmount) * 100).toFixed(2)
        })
        setPercentages(percents)
      }
    } else if (selectedMethod === "equally") {
      setEqualSelected(members)
    }
  }, [initialSplits, selectedMethod, totalAmount, members])

  const calculateExactTotal = () => {
    return Object.values(exactAmounts).reduce((sum, val) => {
      const num = parseFloat(val) || 0
      return sum + num
    }, 0)
  }

  const calculatePercentageTotal = () => {
    return Object.values(percentages).reduce((sum, val) => {
      const num = parseFloat(val) || 0
      return sum + num
    }, 0)
  }

  const exactTotal = calculateExactTotal()
  const exactRemaining = totalAmount - exactTotal
  const percentageTotal = calculatePercentageTotal()
  const percentageRemaining = 100 - percentageTotal

  const handleEqualChange = (member: string, checked: boolean) => {
    if (checked) {
      setEqualSelected([...equalSelected, member])
    } else {
      setEqualSelected(equalSelected.filter((m) => m !== member))
    }
  }

  const handleExactAmountChange = (member: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "")
    const parts = sanitized.split(".")
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return

    setExactAmounts({ ...exactAmounts, [member]: sanitized })
  }

  const handlePercentageChange = (member: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "")
    const num = parseFloat(sanitized) || 0
    if (num > 100) return

    const parts = sanitized.split(".")
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return

    setPercentages({ ...percentages, [member]: sanitized })
  }

  const handleReset = () => {
    setEqualSelected(members)
    setExactAmounts({})
    setPercentages({})
  }

  const handleSave = () => {
    const splits: Record<string, number> = {}

    if (selectedMethod === "equally") {
      const count = equalSelected.length
      const perPersonRaw = totalAmount / count
      const perPersonBase = Math.floor(perPersonRaw * 100) / 100
      const baseTotal = perPersonBase * count
      const residue = Math.round((totalAmount - baseTotal) * 100)

      equalSelected.forEach((member, index) => {
        if (index < residue) {
          splits[member] = perPersonBase + 0.01
        } else {
          splits[member] = perPersonBase
        }
      })
    } else if (selectedMethod === "exact") {
      Object.entries(exactAmounts).forEach(([member, amount]) => {
        const num = parseFloat(amount) || 0
        if (num > 0) {
          splits[member] = num
        }
      })
    } else if (selectedMethod === "percentage") {
      Object.entries(percentages).forEach(([member, percent]) => {
        const num = parseFloat(percent) || 0
        if (num > 0) {
          splits[member] = (totalAmount * num) / 100
        }
      })
    }

    onSplitChange(splits)
    onClose()
  }

  const canSave =
    selectedMethod === "equally"
      ? equalSelected.length > 0
      : selectedMethod === "exact"
        ? Math.abs(exactRemaining) < 0.01
        : Math.abs(percentageRemaining) < 0.01

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white border-t-4 border-black rounded-t-2xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black shrink-0">
          <h2 className="text-xl font-bold">How to split?</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex border-b-2 border-black bg-white z-10 shrink-0">
          <button
            onClick={() => onMethodChange("equally")}
            className={cn(
              "flex-1 py-3 font-black text-xl border-r-2 border-black transition-all",
              selectedMethod === "equally" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
            )}
          >
            =
          </button>
          <button
            onClick={() => onMethodChange("exact")}
            className={cn(
              "flex-1 py-3 font-black text-xl border-r-2 border-black transition-all",
              selectedMethod === "exact" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
            )}
          >
            1.23
          </button>
          <button
            onClick={() => onMethodChange("percentage")}
            className={cn(
              "flex-1 py-3 font-black text-xl transition-all",
              selectedMethod === "percentage" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
            )}
          >
            %
          </button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {selectedMethod === "equally" && (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member}
                    onClick={() => handleEqualChange(member, !equalSelected.includes(member))}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 border-black cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                      equalSelected.includes(member) ? "bg-gray-50" : "bg-white"
                    )}
                  >
                    <Checkbox
                      id={`equal-${member}`}
                      checked={equalSelected.includes(member)}
                      onCheckedChange={(checked) => handleEqualChange(member, checked as boolean)}
                      className="h-6 w-6 border-2 border-black data-[state=checked]:bg-black"
                    />
                    <label htmlFor={`equal-${member}`} className="flex-1 font-bold text-lg cursor-pointer">
                      {member}
                    </label>
                    {equalSelected.includes(member) && equalSelected.length > 0 && (() => {
                      const count = equalSelected.length
                      const memberIndex = equalSelected.indexOf(member)
                      const perPersonBase = Math.floor((totalAmount / count) * 100) / 100
                      const baseTotal = perPersonBase * count
                      const residue = Math.round((totalAmount - baseTotal) * 100)
                      const amount = memberIndex < residue ? perPersonBase + 0.01 : perPersonBase
                      return <span className="font-black text-black">₹{amount.toFixed(2)}</span>
                    })()}
                  </div>
                ))}
              </div>
            )}

            {selectedMethod === "exact" && (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center gap-4 p-3 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <label className="font-bold text-lg flex-1 truncate">{member}</label>
                    <div className="relative w-48 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-black">
                        ₹
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={exactAmounts[member] || ""}
                        onChange={(e) => handleExactAmountChange(member, e.target.value)}
                        placeholder="0.00"
                        className="pl-8 py-3 border-2 border-black text-lg font-bold rounded-lg focus-visible:ring-black w-full h-12"
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-8 p-6 bg-black text-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold opacity-80">Total split:</span>
                    <span className="font-black text-2xl">
                      ₹{exactTotal.toFixed(2)} / ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-80">Remaining:</span>
                    <span
                      className={cn(
                        "font-black text-2xl",
                        Math.abs(exactRemaining) < 0.01 ? "text-green-400" : "text-orange-400"
                      )}
                    >
                      ₹{exactRemaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === "percentage" && (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <label className="font-bold text-base flex-1 truncate min-w-0">{member}</label>
                    <div className="relative w-24 shrink-0">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={percentages[member] || ""}
                        onChange={(e) => handlePercentageChange(member, e.target.value)}
                        placeholder="0"
                        className="pr-8 py-2 border-2 border-black text-base font-bold rounded-lg focus-visible:ring-black text-right w-full h-10"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-base font-black text-black">
                        %
                      </span>
                    </div>
                    <div className="w-20 shrink-0 text-right">
                      <span className="font-black text-black text-sm">
                        ₹{((totalAmount * (parseFloat(percentages[member]) || 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-8 p-6 bg-black text-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold opacity-80">Total split:</span>
                    <span className="font-black text-2xl">{percentageTotal.toFixed(2)}% / 100%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-80">Remaining:</span>
                    <span
                      className={cn(
                        "font-black text-2xl",
                        Math.abs(percentageRemaining) < 0.01 ? "text-green-400" : "text-orange-400"
                      )}
                    >
                      {percentageRemaining.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 pb-8 border-t-2 border-black flex gap-2 bg-white shrink-0">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 border-2 border-black text-lg h-14 font-black"
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="flex-1 text-lg h-14 font-black">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}


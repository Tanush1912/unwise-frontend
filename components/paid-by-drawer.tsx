"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaidByDrawerProps {
  isOpen: boolean
  onClose: () => void
  members: string[]
  selectedPayer: string | string[]
  onPayerChange: (payer: string | string[]) => void
}

export const PaidByDrawer = ({
  isOpen,
  onClose,
  members,
  selectedPayer,
  onPayerChange,
}: PaidByDrawerProps) => {
  const [mode, setMode] = useState<"single" | "multiple">(
    Array.isArray(selectedPayer) ? "multiple" : "single"
  )
  const [multiplePayers, setMultiplePayers] = useState<Record<string, string>>(
    Array.isArray(selectedPayer)
      ? selectedPayer.reduce((acc, payer) => ({ ...acc, [payer]: "" }), {})
      : {}
  )

  const handleSingleSelect = (payer: string) => {
    onPayerChange(payer)
    onClose()
  }

  const handleMultipleAmountChange = (payer: string, amount: string) => {
    const sanitized = amount.replace(/[^0-9.]/g, "")
    const parts = sanitized.split(".")
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return

    setMultiplePayers({ ...multiplePayers, [payer]: sanitized })
  }

  const handleMultipleSave = () => {
    const payers = Object.keys(multiplePayers).filter(
      (payer) => multiplePayers[payer] && parseFloat(multiplePayers[payer]) > 0
    )
    onPayerChange(payers)
    onClose()
  }

  const handleModeChange = (newMode: "single" | "multiple") => {
    setMode(newMode)
    if (newMode === "single" && Array.isArray(selectedPayer)) {
      onPayerChange(selectedPayer[0] || members[0] || "")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white border-t-4 border-black rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            {mode === "single" && selectedPayer && !Array.isArray(selectedPayer) && (
              <Check className="h-5 w-5 text-green-600" />
            )}
            {mode === "multiple" && Object.keys(multiplePayers).some((payer) => multiplePayers[payer] && parseFloat(multiplePayers[payer]) > 0) && (
              <Check className="h-5 w-5 text-green-600" />
            )}
            <h2 className="text-xl font-bold">Who paid?</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Selection */}
        <div className="flex border-b-2 border-black">
          <button
            onClick={() => handleModeChange("single")}
            className={cn(
              "flex-1 py-3 font-semibold border-r-2 border-black transition-colors",
              mode === "single" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
            )}
          >
            Single Person
          </button>
          <button
            onClick={() => handleModeChange("multiple")}
            className={cn(
              "flex-1 py-3 font-semibold transition-colors",
              mode === "multiple" ? "bg-black text-white" : "bg-white hover:bg-gray-100"
            )}
          >
            Multiple People
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 pb-24">
            {mode === "single" ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <button
                    key={member}
                    onClick={() => handleSingleSelect(member)}
                    className={cn(
                      "w-full text-left px-4 py-4 rounded-xl border-2 border-black transition-colors",
                      selectedPayer === member && !Array.isArray(selectedPayer)
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-100"
                    )}
                  >
                    <span className="font-semibold text-base">{member}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Enter the amount each person paid
                </p>
                {members
                  .filter((m) => m !== "You")
                  .map((member) => (
                    <div
                      key={member}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <label className="font-bold text-lg flex-1 truncate">{member}</label>
                      <div className="relative w-48 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-black">₹</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={multiplePayers[member] || ""}
                          onChange={(e) => handleMultipleAmountChange(member, e.target.value)}
                          placeholder="0.00"
                          className="pl-8 py-3 border-2 border-black text-lg font-bold rounded-lg focus-visible:ring-black w-full h-12"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {mode === "multiple" && (
          <div className="p-4 pb-24 border-t-2 border-black bg-white">
            <Button onClick={handleMultipleSave} className="w-full text-lg h-14 font-black">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


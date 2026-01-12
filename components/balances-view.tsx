"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  balance: number
  avatar_url?: string
}

interface Debt {
  from_user: { id: string; name: string }
  to_user: { id: string; name: string }
  amount: number
}

interface BalanceSummary {
  total_owed_to_user: number
  total_user_owes: number
  count_owed_to_user: number
  count_user_owes: number
  total_net: number
  state: string
}

interface BalancesViewProps {
  members: Member[]
  currentUserId: string
  debts?: Debt[]
  summary?: BalanceSummary
  onSettleUp: (payer: { id: string; name: string }, recipient: { id: string; name: string }, amount: number) => void
  onRecordPayment?: () => void
  isRefreshing?: boolean
}

export const BalancesView = ({
  members,
  currentUserId,
  debts: pairwiseDebts = [],
  onSettleUp,
  onRecordPayment,
  isRefreshing = false,
}: BalancesViewProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return Math.abs(b.balance) - Math.abs(a.balance)
  })

  return (
    <div>
      {/* Record Payment Button */}
      {onRecordPayment && (
        <div className="px-4 py-4 border-b-2 border-black">
          <Button
            onClick={onRecordPayment}
            disabled={isRefreshing}
            className="w-full h-12 border-2 border-black font-bold text-sm bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            <Plus className="h-5 w-5 mr-2" />
            {isRefreshing ? "Updating balances..." : "Record external payment"}
          </Button>
        </div>
      )}

      {/* Hierarchical Balance List */}
      <div className="divide-y-2 divide-black">
        {sortedMembers.map((member) => {
          const incomingDebts = pairwiseDebts.filter(d => d.to_user.id === member.id)
          const outgoingDebts = pairwiseDebts.filter(d => d.from_user.id === member.id)
          const isMe = member.id === currentUserId
          return (
            <div key={member.id} className="bg-white">
              {/* Parent Row */}
              <div className="px-4 py-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <AvatarImage src={member.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-gray-100 font-bold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate">
                    {isMe ? "You" : member.name}
                    {member.balance > 0 ? (
                      <>
                        <span className="font-medium text-muted-foreground px-1"> {isMe ? "get back" : "gets back"} </span>
                        <span className="text-green-600 font-black tracking-tight">₹{member.balance.toFixed(2)}</span>
                        <span className="font-medium text-muted-foreground px-1"> in total </span>
                      </>
                    ) : member.balance < 0 ? (
                      <>
                        <span className="font-medium text-muted-foreground px-1"> {isMe ? "owe" : "owes"} </span>
                        <span className="text-orange-600 font-black tracking-tight">₹{Math.abs(member.balance).toFixed(2)}</span>
                        <span className="font-medium text-muted-foreground px-1"> in total </span>
                      </>
                    ) : (
                      <span className="font-medium text-muted-foreground px-1"> {isMe ? "are settled up" : "is settled up"} </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Child Branches for members getting back money */}
              {member.balance > 0 && incomingDebts.length > 0 && (
                <div className="pb-4">
                  {incomingDebts.map((debt, idx) => (
                    <div key={`${debt.from_user.id}-${idx}`} className="flex ml-10 relative">
                      {/* Branching Line */}
                      <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gray-200" />
                      <div className="absolute -left-4 top-1/2 w-4 h-[2px] bg-gray-200" />
                      {idx === incomingDebts.length - 1 && (
                        <div className="absolute -left-4 top-1/2 bottom-0 w-[2px] bg-white z-10" />
                      )}

                      <div className="flex-1 flex items-center gap-3 p-2 bg-gray-50/50 rounded-lg mr-4 border border-transparent hover:border-gray-200 transition-all mb-1">
                        <Avatar className="h-8 w-8 border border-black shrink-0">
                          <AvatarImage src={members.find(m => m.id === debt.from_user.id)?.avatar_url} className="object-cover" />
                          <AvatarFallback className="text-[10px] font-bold">
                            {getInitials(debt.from_user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-bold">{debt.from_user.id === currentUserId ? "You" : debt.from_user.name}</span>
                            <span className="text-muted-foreground">{debt.from_user.id === currentUserId ? " owe " : " owes "}</span>
                            <span className="text-green-600 font-bold">₹{debt.amount.toFixed(2)}</span>
                            <span className="text-muted-foreground"> to </span>
                            <span className="font-semibold">{member.id === currentUserId ? "you" : member.name}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRefreshing}
                          onClick={() => onSettleUp(
                            { id: debt.from_user.id, name: debt.from_user.name },
                            { id: debt.to_user.id, name: debt.to_user.name },
                            debt.amount
                          )}
                          className="h-8 border-2 border-black font-bold text-[10px] uppercase tracking-tight bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0 disabled:opacity-50"
                        >
                          {isRefreshing ? "..." : "Settle"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Child Branches for members who owe money */}
              {member.balance < 0 && outgoingDebts.length > 0 && (
                <div className="pb-4">
                  {outgoingDebts.map((debt, idx) => (
                    <div key={`${debt.to_user.id}-${idx}`} className="flex ml-10 relative">
                      {/* Branching Line */}
                      <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gray-200" />
                      <div className="absolute -left-4 top-1/2 w-4 h-[2px] bg-gray-200" />
                      {idx === outgoingDebts.length - 1 && (
                        <div className="absolute -left-4 top-1/2 bottom-0 w-[2px] bg-white z-10" />
                      )}

                      <div className="flex-1 flex items-center gap-3 p-2 bg-gray-50/50 rounded-lg mr-4 border border-transparent hover:border-gray-200 transition-all mb-1">
                        <Avatar className="h-8 w-8 border border-black shrink-0">
                          <AvatarImage src={members.find(m => m.id === debt.to_user.id)?.avatar_url} className="object-cover" />
                          <AvatarFallback className="text-[10px] font-bold">
                            {getInitials(debt.to_user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-bold">{member.id === currentUserId ? "You" : member.name}</span>
                            <span className="text-muted-foreground">{member.id === currentUserId ? " owe " : " owes "}</span>
                            <span className="text-orange-600 font-bold">₹{debt.amount.toFixed(2)}</span>
                            <span className="text-muted-foreground"> to </span>
                            <span className="font-semibold">{debt.to_user.id === currentUserId ? "you" : debt.to_user.name}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSettleUp(
                            { id: debt.from_user.id, name: debt.from_user.name },
                            { id: debt.to_user.id, name: debt.to_user.name },
                            debt.amount
                          )}
                          className="h-8 border-2 border-black font-bold text-[10px] uppercase tracking-tight bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
                        >
                          Settle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {members.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground font-medium italic">No members yet</p>
        </div>
      )}
    </div>
  )
}



"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useFriends, useRemoveFriend, Friend } from "@/hooks/use-friends"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Trash2, Smile, Users, Plus, Loader2 } from "lucide-react"
import { DashboardLoading } from "./dashboard-loading"
import { AddFriendDialog } from "./add-friend-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"

const getAccentColor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = Math.abs(hash) % 360
    return `oklch(0.75 0.15 ${h})`
}

export const FriendsView = () => {
    const router = useRouter()
    const { data: friends, isLoading } = useFriends()
    const { mutate: removeFriend } = useRemoveFriend()

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null)
    const [isRemoveMode, setIsRemoveMode] = useState(false)
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const summary = useMemo(() => {
        if (!friends) return { owedToYou: 0, youOwe: 0, net: 0 }
        let owedToYou = 0
        let youOwe = 0
        friends.forEach(f => {
            if (f.net_balance > 0) owedToYou += f.net_balance
            if (f.net_balance < 0) youOwe += Math.abs(f.net_balance)
        })

        return { owedToYou, youOwe, net: owedToYou - youOwe }
    }, [friends])

    const handleDelete = () => {
        if (!friendToDelete) return
        removeFriend(friendToDelete.id, {
            onSuccess: () => {
                toast.success("Friend removed")
                setFriendToDelete(null)
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    }

    const handleBulkDelete = async () => {
        setIsRemoving(true)
        try {
            await Promise.all(
                selectedFriendIds.map((id) =>
                    new Promise<void>((resolve, reject) => {
                        removeFriend(id, {
                            onSuccess: () => resolve(),
                            onError: (err) => reject(err),
                        })
                    })
                )
            )
            toast.success("Selected friends removed")
            setIsRemoveMode(false)
            setSelectedFriendIds([])
            setIsBulkDeleteOpen(false)
        } catch (error) {
            toast.error("Failed to remove some friends")
        } finally {
            setIsRemoving(false)
        }
    }

    const toggleSelection = (id: string) => {
        if (selectedFriendIds.includes(id)) {
            setSelectedFriendIds(selectedFriendIds.filter(prevId => prevId !== id))
        } else {
            setSelectedFriendIds([...selectedFriendIds, id])
        }
    }

    if (isLoading) return <DashboardLoading />

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Global Header */}
            <div className="sticky top-0 z-20 bg-white border-b-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-black border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                <div className="w-5 h-5 text-white fill-white">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-3xl font-black text-black tracking-tighter uppercase italic">Friends</h1>
                        </div>
                        {isRemoveMode ? (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 font-bold hover:text-black border-2 border-black rounded-lg px-3 h-9 text-sm"
                                    onClick={() => {
                                        setIsRemoveMode(false)
                                        setSelectedFriendIds([])
                                    }}
                                >
                                    Cancel
                                </Button>
                                {selectedFriendIds.length > 0 && (
                                    <Button
                                        size="sm"
                                        className="bg-red-600 text-white hover:bg-red-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-lg font-bold px-3 h-9 text-sm"
                                        onClick={() => setIsBulkDeleteOpen(true)}
                                    >
                                        Remove ({selectedFriendIds.length})
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="font-bold border-2 border-black rounded-xl px-4 hover:bg-gray-100 h-9 text-sm shrink-0"
                                onClick={() => setIsRemoveMode(true)}
                            >
                                Manage
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-6 overflow-hidden">
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mb-0.5">Net Balance</p>
                            <p className={cn(
                                "text-2xl font-black leading-none",
                                summary.net > 0 ? "text-green-600" : summary.net < 0 ? "text-orange-600" : "text-black"
                            )}>
                                {summary.net >= 0 ? "+" : "-"}₹{Math.abs(summary.net).toFixed(2)}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-black opacity-10 shrink-0" />
                        <div className="shrink-0">
                            <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mb-0.5">Owe</p>
                            <p className="text-xl font-bold text-orange-600 leading-none">₹{summary.youOwe.toFixed(2)}</p>
                        </div>
                        <div className="shrink-0">
                            <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mb-0.5">Owed</p>
                            <p className="text-xl font-bold text-green-600 leading-none">₹{summary.owedToYou.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-4">

                {friends?.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-20 h-20 bg-gray-50 border-4 border-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <Smile className="h-10 w-10 text-black" />
                        </div>
                        <h2 className="text-3xl font-black mb-3 italic uppercase tracking-tighter">Loneliness detected!</h2>
                        <p className="text-lg font-bold text-[#757575] mb-8 max-w-sm mx-auto">
                            Unwise is better with friends. Add your buddies to start tracking shared expenses.
                        </p>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-xl font-bold h-14 px-10 text-xl"
                            onClick={() => setIsAddDialogOpen(true)}
                        >
                            Add a Friend
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {friends?.map((friend, idx) => (
                            <FriendCard
                                key={friend.id}
                                friend={friend}
                                index={idx}
                                isRemoveMode={isRemoveMode}
                                isSelected={selectedFriendIds.includes(friend.id)}
                                onSelect={() => toggleSelection(friend.id)}
                                onDelete={() => setFriendToDelete(friend)}
                            />
                        ))}
                    </div>
                )}

                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="fixed bottom-28 right-6 h-16 w-16 rounded-2xl bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40 hover:bg-gray-800 transition-all active:shadow-none active:translate-x-1 active:translate-y-1"
                    size="icon"
                >
                    <Plus className="h-8 w-8" />
                </Button>
            </div>

            <AddFriendDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} />

            <Dialog open={!!friendToDelete} onOpenChange={(open) => !open && setFriendToDelete(null)}>
                <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Remove friend?</DialogTitle>
                        <DialogDescription className="font-medium text-black/70">
                            This will remove {friendToDelete?.name} from your friends list.
                            Any outstanding debts or group memberships will strictly remain.
                            This only affects your personal contacts list.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            className="border-2 border-black font-bold h-12 rounded-xl"
                            onClick={() => setFriendToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-600 text-white border-2 border-black font-bold hover:bg-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] h-12 rounded-xl"
                        >
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Remove selected friends?</DialogTitle>
                        <DialogDescription className="font-medium text-black/70">
                            Are you sure you want to remove {selectedFriendIds.length} friends?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            className="border-2 border-black font-bold h-12 rounded-xl"
                            onClick={() => setIsBulkDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkDelete}
                            disabled={isRemoving}
                            className="bg-red-600 text-white border-2 border-black font-bold hover:bg-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] h-12 rounded-xl"
                        >
                            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const FriendCard = ({
    friend,
    index,
    isRemoveMode,
    isSelected,
    onSelect,
    onDelete
}: {
    friend: Friend
    index: number
    isRemoveMode?: boolean
    isSelected?: boolean
    onSelect?: () => void
    onDelete?: () => void
}) => {
    const router = useRouter()
    const [isExpanded, setIsExpanded] = useState(false)
    const accentColor = useMemo(() => getAccentColor(friend.name), [friend.name])
    const rotation = index % 2 === 0 ? "hover:rotate-1" : "hover:-rotate-1"

    return (
        <div
            className={cn(
                "group relative bg-white border-2 border-black rounded-2xl p-3 sm:p-4 transition-all select-none overflow-hidden",
                isRemoveMode ? "cursor-pointer" : "cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-none",
                rotation,
                isSelected && isRemoveMode && "ring-4 ring-orange-400 ring-offset-2"
            )}
            onClick={() => {
                if (isRemoveMode && onSelect) {
                    onSelect()
                } else if (friend.groups && friend.groups.length > 0) {
                    setIsExpanded(!isExpanded)
                }
            }}
        >
            {/* Brand Stripe (Derived Color) */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
                style={{ backgroundColor: accentColor }}
            />

            {/* Halo Effect */}
            <div
                className="absolute left-8 top-1/2 -translate-y-1/2 w-32 h-32 opacity-20 blur-[60px] pointer-events-none transition-all group-hover:opacity-40"
                style={friend.avatar_url || friend.avatar ? { backgroundImage: `url(${friend.avatar_url || friend.avatar})`, backgroundSize: 'cover' } : { backgroundColor: accentColor }}
            />

            <div className="flex items-start relative z-10 pl-2 gap-3 sm:gap-4">
                {/* Checkbox for Remove Mode */}
                {isRemoveMode && (
                    <div className="flex items-center justify-center self-center shrink-0 w-6 h-6">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onSelect && onSelect()}
                            className="h-6 w-6 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white rounded-md"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {/* Avatar Area */}
                <div className="relative shrink-0 mt-1">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white transition-transform group-hover:scale-105 overflow-hidden">
                        <AvatarImage src={friend.avatar_url || friend.avatar || undefined} className="object-cover rounded-xl" />
                        <AvatarFallback className="flex items-center justify-center font-black bg-blue-100 text-blue-700 rounded-xl">
                            {friend.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Info Area */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-black text-black leading-tight uppercase italic tracking-tighter line-clamp-2">
                            {friend.name}
                        </h2>

                        <div className="flex flex-wrap items-center gap-2">
                            {friend.groups && friend.groups.length > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md border-2 border-black/5 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0">
                                    <Users className="h-3 w-3" strokeWidth={3} />
                                    {friend.groups.length}
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className={cn(
                                "h-6 flex items-center px-2 rounded-md border-2 border-black text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0",
                                friend.net_balance > 0 ? "bg-green-100 text-green-800" :
                                    friend.net_balance < 0 ? "bg-orange-100 text-orange-800" :
                                        "bg-gray-100 text-gray-400 opacity-60"
                            )}>
                                {friend.net_balance > 0 ? "Owed to you" :
                                    friend.net_balance < 0 ? "You owe" :
                                        "Settled"}
                            </div>
                        </div>

                        {/* Shared Groups & Breakdown Tree - Collapsible */}
                        {friend.groups && friend.groups.length > 0 && (
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 space-y-2 relative pl-4 pb-1">
                                            {/* Tree Backbone */}
                                            <div className="absolute left-0 top-0 bottom-4 w-0.5 bg-black/20" />

                                            {friend.groups.map((group, idx) => {
                                                const balance = (friend.group_balances || []).find(b => b.group_id === group.id)
                                                const amount = balance?.amount || 0

                                                return (
                                                    <div
                                                        key={`${group.id}-${idx}`}
                                                        className="relative pl-3"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/groups/${group.id}`)
                                                        }}
                                                    >
                                                        {/* Branch Connector */}
                                                        <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-black/20" />

                                                        <div className="flex items-center justify-between gap-3 min-w-0">
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <Avatar className="h-5 w-5 border border-black bg-white shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                                    <AvatarImage src={group.avatar_url || undefined} className="object-cover" />
                                                                    <AvatarFallback className="bg-gray-100 text-[8px] font-black">
                                                                        {(group.name || "??").slice(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col min-w-0">
                                                                    <p className="text-[9px] font-black uppercase text-black/40 leading-none mb-0.5 truncate">
                                                                        {group.name}
                                                                    </p>
                                                                    <p className="text-[11px] font-bold text-gray-500 leading-none truncate">
                                                                        {amount > 0 ? "owes you" : amount < 0 ? "you owe" : "settled up"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {amount !== 0 && (
                                                                <span className={cn(
                                                                    "text-[11px] font-black tabular-nums shrink-0 border-b-2 border-black/5 transition-colors group-hover:border-black/30",
                                                                    amount > 0 ? "text-green-600" : "text-orange-600"
                                                                )}>
                                                                    ₹{Math.abs(amount).toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Balance Area - Right Section */}
                <div
                    className="ml-auto text-right shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-white min-w-[100px] mt-1 self-start"
                >
                    <p className={cn(
                        "text-[9px] font-black uppercase tracking-[0.1em] mb-1 opacity-50 text-center",
                        friend.net_balance > 0 ? "text-green-700" : friend.net_balance < 0 ? "text-orange-700" : "text-gray-500"
                    )}>
                        Balance
                    </p>
                    <p className={cn(
                        "text-lg sm:text-xl font-black tabular-nums leading-none tracking-tighter text-center",
                        friend.net_balance > 0 ? "text-green-600" : friend.net_balance < 0 ? "text-orange-600" : "text-black"
                    )}>
                        ₹{Math.abs(friend.net_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                {/* Delete Button (when not in remove mode) */}
                {!isRemoveMode && (
                    <button
                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-20"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete && onDelete()
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Brand Bar */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-2"
                style={{ backgroundColor: accentColor }}
            />
        </div>
    )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, Loader2, Check, Users } from "lucide-react"
import { useSearchUsers, useFriends, useAddFriend } from "@/hooks/use-friends"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AddFriendDialog } from "./add-friend-dialog"

interface GroupMember {
    id: string
    name: string
    avatar_url?: string
}

interface AddGroupMemberDialogProps {
    isOpen: boolean
    onClose: () => void
    onAddMember: (email: string) => Promise<void>
    existingMembers: GroupMember[]
    isAdding?: boolean
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export const AddGroupMemberDialog = ({
    isOpen,
    onClose,
    onAddMember,
    existingMembers,
    isAdding = false,
}: AddGroupMemberDialogProps) => {
    const [searchQuery, setSearchQuery] = useState("")
    const [addingUserId, setAddingUserId] = useState<string | null>(null)
    const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false)
    const debouncedQuery = useDebounce(searchQuery, 300)

    const { data: friends, isLoading: isFriendsLoading } = useFriends()
    const { data: searchResults, isLoading: isSearching } = useSearchUsers(debouncedQuery)

    const existingMemberIds = useMemo(() => {
        return new Set(existingMembers.map(m => m.id))
    }, [existingMembers])
    const friendsNotInGroup = useMemo(() => {
        if (!friends) return []
        return friends.filter(f => !existingMemberIds.has(f.id))
    }, [friends, existingMemberIds])
    const friendsInGroup = useMemo(() => {
        if (!friends) return []
        return friends.filter(f => existingMemberIds.has(f.id))
    }, [friends, existingMemberIds])
    const displayResults = useMemo(() => {
        if (searchQuery.length >= 2 && searchResults) {
            return searchResults.map(user => ({
                ...user,
                isInGroup: existingMemberIds.has(user.id),
                isFriend: friends?.some(f => f.id === user.id) || false,
            }))
        }
        return null
    }, [searchQuery, searchResults, existingMemberIds, friends])

    const handleAddMember = async (user: { id: string; email: string; name: string }) => {
        if (existingMemberIds.has(user.id)) {
            toast.info(`${user.name} is already in this group`)
            return
        }

        if (addingUserId === user.id) return

        setAddingUserId(user.id)
        try {
            await onAddMember(user.email)
            toast.success(`${user.name} added to group!`)
        } catch (error) {
        } finally {
            setAddingUserId(null)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("")
            setAddingUserId(null)
        }
    }, [isOpen])

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md max-h-[85vh] flex flex-col p-0">
                    {/* Header */}
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                className="text-green-700 font-bold hover:text-green-800 hover:bg-green-50 px-0 -ml-2"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <DialogTitle className="text-lg font-black">Add group members</DialogTitle>
                            <div className="w-16" /> {/* Spacer for centering */}
                        </div>
                    </DialogHeader>

                    {/* Search Input */}
                    <div className="px-6 pt-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email"
                                className="pl-12 h-12 text-base border-2 border-black rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 font-medium"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-4">
                        {/* Add new contact option */}
                        <button
                            className="w-full flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors text-left rounded-xl -mx-2 px-2"
                            onClick={() => setIsAddFriendDialogOpen(true)}
                        >
                            <div className="h-10 w-10 rounded-full border-2 border-black flex items-center justify-center bg-white">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-base">Add a new friend</span>
                        </button>

                        {/* Loading State */}
                        {(isFriendsLoading || isSearching) && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        )}

                        {/* Search Results */}
                        {displayResults && !isSearching && (
                            <div className="space-y-1">
                                {displayResults.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 font-medium">
                                        No users found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    displayResults.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            isInGroup={user.isInGroup}
                                            isAdding={addingUserId === user.id}
                                            onAdd={() => handleAddMember(user)}
                                            getInitials={getInitials}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Friends List (when not searching) */}
                        {!displayResults && !isFriendsLoading && (
                            <>
                                {/* Friends already in group */}
                                {friendsInGroup.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-2">
                                            Recent
                                        </p>
                                        {friendsInGroup.map((friend) => (
                                            <UserRow
                                                key={friend.id}
                                                user={{
                                                    id: friend.id,
                                                    name: friend.name,
                                                    email: friend.email,
                                                    avatar_url: friend.avatar || undefined,
                                                }}
                                                isInGroup={true}
                                                isAdding={false}
                                                onAdd={() => { }}
                                                getInitials={getInitials}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Friends not in group */}
                                {friendsNotInGroup.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-2">
                                            Friends on Unwise
                                        </p>
                                        {friendsNotInGroup.map((friend) => (
                                            <UserRow
                                                key={friend.id}
                                                user={{
                                                    id: friend.id,
                                                    name: friend.name,
                                                    email: friend.email,
                                                    avatar_url: friend.avatar || undefined,
                                                }}
                                                isInGroup={false}
                                                isAdding={addingUserId === friend.id}
                                                onAdd={() => handleAddMember({ id: friend.id, email: friend.email, name: friend.name })}
                                                getInitials={getInitials}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Empty state */}
                                {friends?.length === 0 && (
                                    <div className="text-center py-12 space-y-3">
                                        <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-2xl flex items-center justify-center mx-auto">
                                            <Users className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">
                                            No friends yet. Search for users above to add them.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AddFriendDialog
                isOpen={isAddFriendDialogOpen}
                onClose={() => setIsAddFriendDialogOpen(false)}
            />
        </>
    )
}

interface UserRowProps {
    user: {
        id: string
        name: string
        email: string
        avatar_url?: string
    }
    isInGroup: boolean
    isAdding: boolean
    onAdd: () => void
    getInitials: (name: string) => string
}

const UserRow = ({ user, isInGroup, isAdding, onAdd, getInitials }: UserRowProps) => {
    return (
        <div
            className={cn(
                "flex items-center justify-between py-3 rounded-xl transition-colors -mx-2 px-2",
                !isInGroup && "hover:bg-gray-50 cursor-pointer"
            )}
            onClick={() => !isInGroup && !isAdding && onAdd()}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-10 w-10 border-2 border-black">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-sm">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{user.name}</p>
                    {isInGroup && (
                        <p className="text-xs text-gray-400 font-medium">Already in group</p>
                    )}
                </div>
            </div>

            <div className="shrink-0">
                {isInGroup ? (
                    <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-black flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                    </div>
                ) : isAdding ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                )}
            </div>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, Loader2 } from "lucide-react"
import { useSearchUsers, useAddFriend } from "@/hooks/use-friends"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface AddFriendDialogProps {
    isOpen: boolean
    onClose: () => void
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

export const AddFriendDialog = ({ isOpen, onClose }: AddFriendDialogProps) => {
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedQuery = useDebounce(searchQuery, 300)
    const { data: searchResults, isLoading: isSearching } = useSearchUsers(debouncedQuery)
    const { mutate: addFriend, isPending: isAdding } = useAddFriend()

    const handleAddFriend = (email: string) => {
        addFriend(email, {
            onSuccess: () => {
                toast.success("Friend added successfully")
                setSearchQuery("")
                onClose()
            },
            onError: (error) => {
                toast.error(error.message)
            },
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic">Add a Friend</DialogTitle>
                    <DialogDescription className="font-medium text-black/60">
                        Search for people by name or email to add them to your friends list.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Name or email address"
                            className="pl-12 h-14 text-lg border-2 border-black rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 font-medium"
                        />
                    </div>

                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-2">
                        {isSearching ? (
                            <div className="flex items-center justify-center h-20">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : searchResults?.length === 0 && debouncedQuery.length >= 2 ? (
                            <div className="text-center py-8 text-gray-500 font-medium">
                                No users found.
                            </div>
                        ) : searchResults && searchResults.length > 0 ? (
                            searchResults.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 border-2 border-black/10 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Avatar className="h-10 w-10 border-2 border-black">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                                                {user.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAddFriend(user.email)}
                                        disabled={isAdding}
                                        className="h-9 w-9 p-0 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none hover:bg-blue-50"
                                    >
                                        {isAdding ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserPlus className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm font-medium">
                                Start typing to search...
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

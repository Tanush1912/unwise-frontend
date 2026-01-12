import React, { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/auth-fetch"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import data from '@emoji-mart/data'

const Picker = dynamic(() => import("@emoji-mart/react"), {
    loading: () => <div className="h-[435px] w-[352px] bg-white border-2 border-black rounded-2xl flex items-center justify-center animate-pulse">
        <Smile className="h-8 w-8 text-gray-300 animate-bounce" />
    </div>,
    ssr: false
})
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

interface Reaction {
    emoji: string
    user: {
        id: string
        name: string
        avatar_url?: string
    }
}

interface Comment {
    id: string
    text: string
    created_at: string
    user_id: string
    user: {
        id: string
        name: string
        avatar_url?: string
    }
    reactions: Reaction[]
}

interface ExpenseChatProps {
    expenseId: string
    currentUserId: string
}

export const ExpenseChat = ({ expenseId, currentUserId }: ExpenseChatProps) => {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [newMessage, setNewMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ["comments", expenseId],
        queryFn: async () => {
            const res = await authFetch(`/api/expenses/${expenseId}/comments`)
            if (!res.ok) throw new Error("Failed to fetch comments")
            return res.json() as Promise<Comment[]>
        },
    })

    useEffect(() => {
        const channel = supabase
            .channel(`expense-${expenseId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "comments",
                    filter: `expense_id=eq.${expenseId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["comments", expenseId] })
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "comment_reactions",
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["comments", expenseId] })
                }
            )
            .on("broadcast", { event: "typing" }, ({ payload }) => {
                if (payload.userId !== currentUserId) {
                    setTypingUsers((prev) => {
                        const newSet = new Set(prev)
                        newSet.add(payload.userName)
                        return newSet
                    })

                    setTimeout(() => {
                        setTypingUsers((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(payload.userName)
                            return newSet
                        })
                    }, 3000)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [expenseId, queryClient, currentUserId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [comments])
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await authFetch(`/api/expenses/${expenseId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: content }),
            })
            if (!res.ok) throw new Error("Failed to send message")
            return res.json()
        },
        onMutate: async (newText) => {
            await queryClient.cancelQueries({ queryKey: ["comments", expenseId] })

            const previousComments = queryClient.getQueryData<Comment[]>(["comments", expenseId])

            queryClient.setQueryData<Comment[]>(["comments", expenseId], (old) => {
                const newComment: Comment = {
                    id: Math.random().toString(),
                    text: newText,
                    created_at: new Date().toISOString(),
                    user_id: currentUserId,
                    user: {
                        id: currentUserId,
                        name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Me",
                        avatar_url: user?.user_metadata?.avatar_url
                    },
                    reactions: []
                }
                return [...(old || []), newComment]
            })

            setNewMessage("")

            return { previousComments }
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["comments", expenseId], context?.previousComments)
            toast.error("Failed to send message")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", expenseId] })
        },
    })

    const deleteMessageMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const res = await authFetch(`/api/expenses/${expenseId}/comments/${commentId}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete message")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", expenseId] })
            toast.success("Message deleted")
        },
    })

    const addReactionMutation = useMutation({
        mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
            const res = await authFetch(`/api/expenses/${expenseId}/comments/${commentId}/reactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emoji }),
            })
            if (!res.ok) throw new Error("Failed to add reaction")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", expenseId] })
        },
    })

    const removeReactionMutation = useMutation({
        mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
            const res = await authFetch(`/api/expenses/${expenseId}/comments/${commentId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to remove reaction")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", expenseId] })
        },
    })

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value)

        if (!isTyping) {
            setIsTyping(true)
            supabase.channel(`expense-${expenseId}`).send({
                type: "broadcast",
                event: "typing",
                payload: { userId: currentUserId, userName: user?.email?.split("@")[0] || "Someone" },
            })
        }

        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000)
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (newMessage.trim()) {
            sendMessageMutation.mutate(newMessage.trim())
        }
    }

    const groupReactions = (reactions: Reaction[]) => {
        const grouped: Record<string, { count: number, hasReacted: boolean, users: string[] }> = {}
        reactions?.forEach(r => {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { count: 0, hasReacted: false, users: [] }
            }
            grouped[r.emoji].count++
            grouped[r.emoji].users.push(r.user.name)
            if (r.user.id === currentUserId) grouped[r.emoji].hasReacted = true
        })
        return Object.entries(grouped)
    }

    return (
        <div className="flex flex-col h-[500px] border-t-2 border-black bg-gray-50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <Smile className="h-12 w-12 mb-2" />
                        <p className="font-bold">No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                    </div>
                ) : (
                    comments.map((comment: Comment) => {
                        const isMe = comment.user_id === currentUserId
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={comment.id}
                                className={cn("flex w-full gap-2", isMe ? "flex-row-reverse" : "flex-row")}
                            >
                                <Avatar className="h-8 w-8 border-2 border-black shrink-0">
                                    <AvatarImage src={comment.user.avatar_url} />
                                    <AvatarFallback className="bg-white text-xs font-bold">
                                        {comment.user.name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                                    {/* Name & Time */}
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-gray-500">
                                            {isMe ? "You" : comment.user.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {/* Bubble */}
                                    <div className="group relative">
                                        <div
                                            onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
                                            className={cn(
                                                "px-4 py-2 rounded-2xl border-2 border-black relative text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all active:scale-95",
                                                isMe ? "bg-black text-white rounded-tr-none" : "bg-white text-black rounded-tl-none",
                                                activeCommentId === comment.id ? "ring-2 ring-offset-2 ring-black" : ""
                                            )}
                                        >
                                            {comment.text}
                                        </div>

                                        {/* Actions */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn(
                                                "absolute top-0 transition-all duration-200 flex items-center gap-1 bg-white border border-black rounded-full px-1 shadow-sm -mt-3 z-10",
                                                isMe ? "right-full mr-2" : "left-full ml-2",
                                                activeCommentId === comment.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
                                            )}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-gray-100">
                                                        <Smile className="h-3 w-3" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent">
                                                    <Picker
                                                        data={data}
                                                        onEmojiSelect={(emoji: any) => addReactionMutation.mutate({ commentId: comment.id, emoji: emoji.native })}
                                                        theme="light"
                                                        previewPosition="none"
                                                        skinTonePosition="none"
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            {isMe && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600"
                                                    onClick={() => deleteMessageMutation.mutate(comment.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Reactions */}
                                        {comment.reactions && comment.reactions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1 justify-end items-center">
                                                {groupReactions(comment.reactions).map(([emoji, { count, hasReacted }]) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => hasReacted
                                                            ? removeReactionMutation.mutate({ commentId: comment.id, emoji })
                                                            : addReactionMutation.mutate({ commentId: comment.id, emoji })
                                                        }
                                                        className={cn(
                                                            "flex items-center justify-center px-2 rounded-full border border-black shadow-none transition-all h-[18px] w-fit min-w-[24px]",
                                                            hasReacted ? "bg-blue-100" : "bg-white"
                                                        )}
                                                    >
                                                        <span className="text-[13px] leading-none">{emoji}</span>
                                                        {count > 1 && <span className="text-[10px] ml-1 font-bold leading-none">{count}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-xs font-bold text-gray-500 italic animate-pulse">
                    {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t-2 border-black">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Say something..."
                        className="flex-1 bg-gray-50 border-2 border-black focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] w-12 px-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    )
}
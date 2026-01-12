"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowRight, Loader2, UserCheck, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"

interface Member {
    id: string
    name: string
    email?: string
    avatar_url?: string
    is_placeholder?: boolean
    claimed_by?: string | null
}

interface AssignPlaceholdersDialogProps {
    groupId: string
    members: Member[]
    isOpen: boolean
    onClose: () => void
}

export const AssignPlaceholdersDialog = ({
    groupId,
    members,
    isOpen,
    onClose,
}: AssignPlaceholdersDialogProps) => {
    const queryClient = useQueryClient()
    const [assignments, setAssignments] = useState<Record<string, string>>({})
    const [isSaving, setIsSaving] = useState(false)

    const placeholders = members.filter(m => m.is_placeholder && !m.claimed_by)
    const realMembers = members.filter(m => !m.is_placeholder)

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const updateAssignment = (placeholderId: string, realMemberId: string | null) => {
        setAssignments(prev => {
            if (realMemberId === null || realMemberId === "unassigned") {
                const newAssignments = { ...prev }
                delete newAssignments[placeholderId]
                return newAssignments
            }
            return {
                ...prev,
                [placeholderId]: realMemberId
            }
        })
    }

    const handleSave = async () => {
        const assignmentsToMake = Object.entries(assignments).filter(([, realMemberId]) => realMemberId)

        if (assignmentsToMake.length === 0) {
            toast.error("No assignments to save")
            return
        }

        setIsSaving(true)
        let successCount = 0
        let errorCount = 0

        for (const [placeholderId, realMemberId] of assignmentsToMake) {
            try {
                const response = await authFetch(`/api/user/placeholders/${placeholderId}/assign`, {
                    method: "POST",
                    body: JSON.stringify({ user_id: realMemberId }),
                })

                if (!response.ok) {
                    const error = await response.json() as { error?: string }
                    console.error(`Failed to assign placeholder ${placeholderId}:`, error)
                    errorCount++
                } else {
                    successCount++
                }
            } catch (error) {
                console.error(`Error assigning placeholder ${placeholderId}:`, error)
                errorCount++
            }
        }

        setIsSaving(false)

        if (successCount > 0) {
            toast.success(`Successfully assigned ${successCount} placeholder${successCount > 1 ? 's' : ''}`)
            queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            setAssignments({})
            onClose()
        }

        if (errorCount > 0) {
            toast.error(`Failed to assign ${errorCount} placeholder${errorCount > 1 ? 's' : ''}`)
        }
    }

    const handleClose = () => {
        setAssignments({})
        onClose()
    }

    const assignedRealMemberIds = new Set(Object.values(assignments))
    const pendingAssignmentsCount = Object.keys(assignments).length

    if (placeholders.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="border-4 border-black rounded-3xl sm:max-w-md max-w-[90vw] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Assign Placeholders</DialogTitle>
                        <DialogDescription className="font-medium">
                            Link virtual users to real accounts
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-8 text-center">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                            <UserCheck className="h-8 w-8 text-black" />
                        </div>
                        <p className="font-bold text-lg">No placeholders to assign</p>
                        <p className="text-muted-foreground mt-2">
                            All virtual users have been claimed or there are none in this group.
                        </p>
                    </div>

                    <Button onClick={handleClose} className="w-full h-12 font-bold">
                        Done
                    </Button>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="border-4 border-black rounded-3xl sm:max-w-md max-w-[90vw] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Assign Placeholders</DialogTitle>
                    <DialogDescription className="font-medium">
                        Link virtual users to real group members. This transfers all their expenses.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* Placeholder Mappings */}
                    <div className="space-y-1">
                        <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                            {placeholders.length} placeholder{placeholders.length > 1 ? 's' : ''} to assign
                        </p>

                        <div className="border-2 border-black rounded-lg overflow-hidden divide-y divide-gray-200 max-h-56 overflow-y-auto">
                            {placeholders.map((placeholder) => (
                                <div key={placeholder.id} className="flex items-center gap-2 p-2 bg-white">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{placeholder.name}</p>
                                        <p className="text-[10px] text-muted-foreground">Virtual user</p>
                                    </div>

                                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

                                    <Select
                                        value={assignments[placeholder.id] || "unassigned"}
                                        onValueChange={(value) =>
                                            updateAssignment(placeholder.id, value === "unassigned" ? null : value)
                                        }
                                    >
                                        <SelectTrigger className="w-[120px] h-8 text-xs border border-gray-300 rounded-md">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">
                                                <span className="text-muted-foreground text-xs">Not assigned</span>
                                            </SelectItem>
                                            {realMembers.map((member) => {
                                                const isAlreadyAssigned = assignedRealMemberIds.has(member.id) && assignments[placeholder.id] !== member.id
                                                return (
                                                    <SelectItem
                                                        key={member.id}
                                                        value={member.id}
                                                        disabled={isAlreadyAssigned}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <Avatar className="h-4 w-4">
                                                                <AvatarImage src={member.avatar_url} />
                                                                <AvatarFallback className="text-[6px] font-bold">
                                                                    {getInitials(member.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs truncate max-w-[70px]">{member.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                        <p className="text-[11px] font-medium text-yellow-800">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            Assigning a placeholder transfers all their expenses to the selected user. This cannot be undone.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 h-10 border-2 border-black font-bold text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || pendingAssignmentsCount === 0}
                            className="flex-1 h-10 font-bold text-sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Assign {pendingAssignmentsCount > 0 ? `(${pendingAssignmentsCount})` : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

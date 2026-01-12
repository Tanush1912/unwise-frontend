"use client"

import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useGroupDetails, useAddMember, useRemoveMember, useDeleteGroup, useUpdateGroup, useAddPlaceholderMember } from "@/hooks/use-groups"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    ArrowLeft,
    UserPlus,
    LogOut,
    Trash2,
    Camera,
    Loader2,
    VenetianMask,
    FileDown,
    FileUp,
    UserCheck,
    Users,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useRef } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { authFetch } from "@/lib/auth-fetch"
import { AddGroupMemberDialog } from "@/components/add-group-member-dialog"
import { useApiErrorHandler } from "@/hooks/use-api-error"
import { useAvatarUpload } from "@/hooks/use-avatar-upload"
import { SplitwiseImportDialog } from "@/components/splitwise-import-dialog"
import { AssignPlaceholdersDialog } from "@/components/assign-placeholders-dialog"

export default function GroupSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const groupId = params.id as string

    const { data, isLoading } = useGroupDetails(groupId)
    const group = data?.group
    const { user } = useAuth()
    const addMemberAction = useAddMember(groupId)
    const removeMemberAction = useRemoveMember(groupId)
    const deleteGroupAction = useDeleteGroup()
    const updateGroupAction = useUpdateGroup(groupId)
    const handleError = useApiErrorHandler()
    const { uploadAvatar, isUploading: isUploadingAvatar } = useAvatarUpload()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isAddPlaceholderDialogOpen, setIsAddPlaceholderDialogOpen] = useState(false)
    const [placeholderName, setPlaceholderName] = useState("")
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editedGroupName, setEditedGroupName] = useState("")
    const [memberToDelete, setMemberToDelete] = useState<{ id: string, name: string } | null>(null)
    const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [claimingId, setClaimingId] = useState<string | null>(null)
    const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false)
    const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false)
    const [isAssignPlaceholdersDialogOpen, setIsAssignPlaceholdersDialogOpen] = useState(false)

    const addPlaceholderAction = useAddPlaceholderMember(groupId)

    if (isLoading || !group) {
        return (
            <div className="min-h-screen bg-white">
                <header className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 py-4 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                </header>
                <div className="p-6 space-y-8 max-w-xl mx-auto">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            await uploadAvatar(file, { type: 'group', groupId })
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleAddMember = async (email: string) => {
        if (!email.trim()) return

        try {
            await addMemberAction.mutateAsync(email.trim())
            toast.success("Member added successfully")
        } catch (error) {
            handleError(error)
            throw error
        }
    }

    const handleAddPlaceholder = async () => {
        if (!placeholderName.trim()) return

        try {
            await addPlaceholderAction.mutateAsync(placeholderName.trim())
            toast.success("Placeholder added successfully")
            setPlaceholderName("")
            setIsAddPlaceholderDialogOpen(false)
        } catch (error) {
            handleError(error)
        }
    }


    const handleRemovePlaceholder = async () => {
        if (!memberToDelete) return

        try {
            await removeMemberAction.mutateAsync(memberToDelete.id)
            toast.success("Placeholder removed")
            setMemberToDelete(null)
            setIsConfirmRemoveOpen(false)
        } catch (error) {
            handleError(error)
            setIsConfirmRemoveOpen(false)
        }
    }

    const handleClaimPlaceholder = async (placeholderId: string) => {
        setClaimingId(placeholderId)
        try {
            const response = await authFetch(`/api/user/placeholders/${placeholderId}/claim`, {
                method: "POST",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to claim account")
            }

            toast.success("Account claimed successfully! All expenses have been transferred.")

            await queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            await queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        } catch (error) {
            console.error("Error claiming placeholder:", error)
            toast.error(error instanceof Error ? error.message : "Failed to claim account")
        } finally {
            setClaimingId(null)
        }
    }

    const currentUserMember = group.members.find(m => m.id === user?.id)
    const currentUserName = currentUserMember?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || ""

    const fuzzyMatch = (name1: string, name2: string) => {
        if (!name1 || !name2) return false
        const n1 = name1.toLowerCase().trim()
        const n2 = name2.toLowerCase().trim()

        if (n1 === n2) return true

        if ((n1.includes(n2) || n2.includes(n1)) && Math.min(n1.length, n2.length) >= 3) return true

        const parts1 = n1.split(/\s+/)
        const parts2 = n2.split(/\s+/)

        for (const p1 of parts1) {
            if (p1.length < 3) continue
            for (const p2 of parts2) {
                if (p2.length < 3) continue
                if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) return true
            }
        }

        return false
    }

    const handleExportCSV = async () => {
        setIsExporting(true)
        try {
            const response = await authFetch(`/api/groups/${groupId}/export`)
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `group-${groupId}-export.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success("Export started")
        } catch (error) {
            console.error(error)
            toast.error("Failed to export CSV")
        } finally {
            setIsExporting(false)
        }
    }

    const handleLeaveGroupClick = () => {
        if (!user) {
            toast.error("You must be logged in to leave a group.")
            return
        }

        const currentUserMember = group.members.find(member => member.id === user.id)
        if (currentUserMember && currentUserMember.balance !== 0) {
            toast.error("You cannot leave the group with an outstanding balance. Settle up first!")
            return
        }

        setIsLeaveGroupDialogOpen(true)
    }

    const handleConfirmLeaveGroup = async () => {
        if (!user) return

        try {
            await removeMemberAction.mutateAsync(user.id)
            toast.success("You have left the group.")
            router.push("/groups")
        } catch (error) {
            handleError(error)
        }
    }

    const handleDeleteGroupClick = () => {
        setIsDeleteGroupDialogOpen(true)
    }

    const handleConfirmDeleteGroup = async () => {
        try {
            await deleteGroupAction.mutateAsync(groupId)
            toast.success("Group deleted successfully.")
            router.push("/groups")
        } catch (error) {
            handleError(error)
        }
    }

    const handleUpdateGroupName = async () => {
        if (!editedGroupName.trim() || editedGroupName === group?.name) {
            setIsEditDialogOpen(false)
            return
        }

        try {
            await updateGroupAction.mutateAsync(editedGroupName.trim())
            toast.success("Group name updated")
            setIsEditDialogOpen(false)
        } catch (error) {
            handleError(error)
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

    return (
        <div className="h-[100dvh] overflow-y-auto bg-[#F8F9FA] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-8 w-8 rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold">Group settings</h1>
                </div>
            </header>

            <div className="max-w-xl mx-auto p-4 space-y-8">
                {/* Group Info Card */}
                <div className="bg-white border-4 border-black rounded-2xl p-6 flex items-center gap-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="relative group/avatar">
                        <Avatar className="h-20 w-20 rounded-2xl border-4 border-black shrink-0">
                            <AvatarImage src={group.avatar_url || undefined} className="object-cover" />
                            <AvatarFallback className="bg-[#2D4A53] rounded-none">
                                <div className="grid grid-cols-2 gap-0.5 p-3 w-full h-full">
                                    <div className="w-full h-full border border-white/20"></div>
                                    <div className="w-full h-full border border-white/20"></div>
                                    <div className="w-full h-full border border-white/30"></div>
                                    <div className="w-full h-full border border-white/20"></div>
                                </div>
                            </AvatarFallback>
                        </Avatar>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={handleFileChange}
                        />

                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-black shadow-none bg-white hover:bg-gray-100 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                            ) : (
                                <Camera className="h-3.5 w-3.5 text-black" />
                            )}
                        </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black truncate">{group.name}</h2>
                    </div>
                    <Button
                        variant="link"
                        className="text-[#3E7C61] font-bold p-0 text-lg"
                        onClick={() => {
                            setEditedGroupName(group.name)
                            setIsEditDialogOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                </div>

                {/* Group Members Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-[#424242]">Group members</h3>

                    <div className="bg-white border-4 border-black rounded-3xl overflow-hidden divide-y-4 divide-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {/* Add Member Action */}
                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center bg-white">
                                <UserPlus className="h-6 w-6" />
                            </div>
                            <span className="text-lg font-bold">Add people to group</span>
                        </button>

                        {/* Add Placeholder Action */}
                        <button
                            onClick={() => setIsAddPlaceholderDialogOpen(true)}
                            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-black border-dashed flex items-center justify-center bg-white">
                                <VenetianMask className="h-6 w-6" />
                            </div>
                            <span className="text-lg font-bold">Add placeholder</span>
                        </button>

                        {/* Members List */}
                        {group.members.map((member) => {
                            const owes = member.balance < 0
                            const owed = member.balance > 0
                            return (
                                <div key={member.id} className="flex items-center gap-4 p-5">
                                    <Avatar className="h-14 w-14 border-4 border-black shrink-0">
                                        <AvatarImage src={member.avatar_url || undefined} alt={member.name} className="object-cover" />
                                        <AvatarFallback className="bg-black text-white font-bold text-lg">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-lg truncate leading-tight">{member.name}</p>
                                            {member.is_placeholder && (
                                                <span className="px-2 py-0.5 rounded-md border-2 border-black bg-gray-100 text-[10px] font-black uppercase tracking-wider shrink-0">
                                                    Guest
                                                </span>
                                            )}
                                        </div>
                                        {member.is_placeholder ? (
                                            <p className="text-[#a0a0a0] font-bold text-sm truncate italic">
                                                Virtual user
                                            </p>
                                        ) : (
                                            <p className="text-[#757575] font-bold text-sm truncate">
                                                {member.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                        <div>
                                            <p className={cn(
                                                "text-xs font-black uppercase tracking-wider",
                                                owed ? "text-[#3E7C61]" : owes ? "text-[#E53935]" : "text-[#757575]"
                                            )}>
                                                {owed ? "gets back" : owes ? "owes" : "owes"}
                                            </p>
                                            <p className={cn(
                                                "text-xl font-black",
                                                owed ? "text-[#3E7C61]" : owes ? "text-[#E53935]" : "text-black"
                                            )}>
                                                ₹{Math.abs(member.balance).toFixed(2)}
                                            </p>
                                        </div>
                                        {member.is_placeholder && (
                                            <div className="flex flex-col items-end gap-1">
                                                {member.claimed_by ? (
                                                    <span className="px-2 py-1 rounded-md border-2 border-black bg-green-100 text-[10px] font-black uppercase tracking-wider mb-1">
                                                        Claimed by {group.members.find(m => m.id === member.claimed_by)?.name || "Unknown"}
                                                    </span>
                                                ) : (
                                                    user && fuzzyMatch(member.name, currentUserName) && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-black uppercase tracking-tighter text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all mb-1"
                                                            onClick={() => handleClaimPlaceholder(member.id)}
                                                            disabled={claimingId === member.id}
                                                        >
                                                            {claimingId === member.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                            ) : (
                                                                <UserCheck className="h-3 w-3 mr-1" />
                                                            )}
                                                            Is this you? Claim
                                                        </Button>
                                                    )
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2"
                                                    onClick={() => {
                                                        setMemberToDelete({ id: member.id, name: member.name })
                                                        setIsConfirmRemoveOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    <span className="text-xs font-bold">Remove</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Advanced Settings Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-[#424242]">Advanced settings</h3>

                    <div className="bg-white border-4 border-black rounded-3xl overflow-hidden divide-y-4 divide-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {/* Export CSV Action */}
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center bg-white">
                                {isExporting ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <FileDown className="h-6 w-6" />
                                )}
                            </div>
                            <span className="text-lg font-bold">Export data as CSV</span>
                        </button>

                        {/* Import from Splitwise Action */}
                        <button
                            onClick={() => setIsImportDialogOpen(true)}
                            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center bg-gray-100">
                                <FileUp className="h-6 w-6 text-black" />
                            </div>
                            <div className="flex-1">
                                <span className="text-lg font-bold block">Import from Splitwise</span>
                                <span className="text-sm text-muted-foreground">Migrate your expense history</span>
                            </div>
                        </button>

                        {/* Assign Placeholders Action */}
                        {group.members.some(m => m.is_placeholder && !m.claimed_by) && (
                            <button
                                onClick={() => setIsAssignPlaceholdersDialogOpen(true)}
                                className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="h-12 w-12 rounded-full border-2 border-black border-dashed flex items-center justify-center bg-black-50">
                                    <Users className="h-6 w-6 text-black" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-lg font-bold block">Assign placeholders</span>
                                    <span className="text-sm text-muted-foreground">Link virtual users to real accounts</span>
                                </div>
                            </button>
                        )}

                        {/* Leave Group Action */}
                        <button
                            onClick={handleLeaveGroupClick}
                            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center bg-white">
                                <LogOut className="h-6 w-6 text-red-500" />
                            </div>
                            <span className="text-lg font-bold text-red-500">Leave group</span>
                        </button>

                        {/* Delete Group Action */}
                        <button
                            onClick={handleDeleteGroupClick}
                            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center bg-white">
                                <Trash2 className="h-6 w-6 text-red-500" />
                            </div>
                            <span className="text-lg font-bold text-red-500">Delete group</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Member Dialog */}
            <AddGroupMemberDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAddMember={handleAddMember}
                existingMembers={group.members}
                isAdding={addMemberAction.isPending}
            />

            {/* Edit Group Name Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="border-4 border-black rounded-3xl sm:max-w-md p-0 overflow-hidden">
                    <div className="p-6 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Edit group name</DialogTitle>
                            <DialogDescription className="text-[#757575] font-bold">
                                Change the name of your group.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Input
                                placeholder="Group name"
                                value={editedGroupName}
                                onChange={(e) => setEditedGroupName(e.target.value)}
                                className="h-14 border-4 border-black rounded-2xl text-lg font-bold placeholder:text-[#bdbdbd] focus:ring-0 focus:ring-offset-0"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateGroupName()
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="h-14 px-8 border-4 border-black rounded-2xl text-lg font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateGroupName}
                                disabled={!editedGroupName.trim() || updateGroupAction.isPending}
                                className="h-14 px-8 bg-black text-white hover:bg-gray-800 rounded-2xl text-lg font-bold disabled:opacity-50"
                            >
                                {updateGroupAction.isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Placeholder Dialog */}
            <Dialog open={isAddPlaceholderDialogOpen} onOpenChange={setIsAddPlaceholderDialogOpen}>
                <DialogContent className="border-4 border-black rounded-3xl sm:max-w-md p-0 overflow-hidden">
                    <div className="p-6 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Add placeholder</DialogTitle>
                            <DialogDescription className="text-[#757575] font-bold">
                                Create a virtual member for someone without an account. Only available in this group.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Input
                                placeholder="Name (e.g. Grandma)"
                                value={placeholderName}
                                onChange={(e) => setPlaceholderName(e.target.value)}
                                className="h-14 border-4 border-black rounded-2xl text-lg font-bold placeholder:text-[#bdbdbd] focus:ring-0 focus:ring-offset-0"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddPlaceholder()
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddPlaceholderDialogOpen(false)}
                                className="h-14 px-8 border-4 border-black rounded-2xl text-lg font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddPlaceholder}
                                disabled={!placeholderName.trim() || addPlaceholderAction.isPending}
                                className="h-14 px-8 bg-black text-white hover:bg-gray-800 rounded-2xl text-lg font-bold disabled:opacity-50"
                            >
                                {addPlaceholderAction.isPending ? "Adding..." : "Add"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Remove Placeholder Dialog */}
            <AlertDialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
                <AlertDialogContent className="border-4 border-black rounded-3xl sm:max-w-md p-0 overflow-hidden gap-0">
                    <div className="p-6 space-y-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-red-600">Remove placeholder?</AlertDialogTitle>
                            <AlertDialogDescription className="text-black font-bold text-base">
                                Are you sure you want to remove <span className="underline decoration-2 decoration-red-500">{memberToDelete?.name}</span> from the group? This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter className="pt-4">
                            <AlertDialogCancel className="h-12 px-6 border-2 border-black rounded-xl font-bold hover:bg-gray-100">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRemovePlaceholder}
                                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                {removeMemberAction.isPending ? "Removing..." : "Yes, Remove"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm Leave Group Dialog */}
            <AlertDialog open={isLeaveGroupDialogOpen} onOpenChange={setIsLeaveGroupDialogOpen}>
                <AlertDialogContent className="border-4 border-black rounded-3xl sm:max-w-md p-0 overflow-hidden gap-0">
                    <div className="p-6 space-y-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-red-600">Leave group?</AlertDialogTitle>
                            <AlertDialogDescription className="text-black font-bold text-base">
                                Are you sure you want to leave <span className="underline decoration-2 decoration-red-500">{group.name}</span>? You will lose access to all expenses and history.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter className="pt-4">
                            <AlertDialogCancel className="h-12 px-6 border-2 border-black rounded-xl font-bold hover:bg-gray-100">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmLeaveGroup}
                                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                {removeMemberAction.isPending ? "Leaving..." : "Yes, Leave Group"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm Delete Group Dialog */}
            <AlertDialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
                <AlertDialogContent className="border-4 border-black rounded-3xl sm:max-w-md p-0 overflow-hidden gap-0">
                    <div className="p-6 space-y-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-red-600">Delete group?</AlertDialogTitle>
                            <AlertDialogDescription className="text-black font-bold text-base">
                                Are you sure you want to delete <span className="underline decoration-2 decoration-red-500">{group.name}</span>? This action cannot be undone. All expenses, balances, and group data will be permanently deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter className="pt-4">
                            <AlertDialogCancel className="h-12 px-6 border-2 border-black rounded-xl font-bold hover:bg-gray-100">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDeleteGroup}
                                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                {deleteGroupAction.isPending ? "Deleting..." : "Yes, Delete Group"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Splitwise Import Dialog */}
            <SplitwiseImportDialog
                groupId={groupId}
                members={group.members}
                isOpen={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
            />

            {/* Assign Placeholders Dialog */}
            <AssignPlaceholdersDialog
                groupId={groupId}
                members={group.members}
                isOpen={isAssignPlaceholdersDialogOpen}
                onClose={() => setIsAssignPlaceholdersDialogOpen(false)}
            />
        </div>
    )
}

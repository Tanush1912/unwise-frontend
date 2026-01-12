"use client"

export const dynamic = "force-dynamic"

import { useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Trash2, AlertTriangle, Loader2, Camera, KeyRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNav } from "@/components/bottom-nav"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { authFetch } from "@/lib/auth-fetch"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAvatarUpload } from "@/hooks/use-avatar-upload"
import { useDashboard } from "@/hooks/use-groups"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function ProfilePage() {
    const { user, loading, signOut } = useAuth()
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const queryClient = useQueryClient()
    const { uploadAvatar, isUploading: isUploadingAvatar } = useAvatarUpload()
    const { data } = useDashboard()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isResettingPassword, setIsResettingPassword] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            await uploadAvatar(file, { type: 'user' })
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleResetPassword = async () => {
        if (!email) {
            toast.error("No email associated with this account")
            return
        }

        setIsResettingPassword(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                throw error
            }

            toast.success("Password reset email sent! Check your inbox.")
        } catch (error: any) {
            console.error("Error sending reset email:", error)
            toast.error(error.message || "Failed to send reset email")
        } finally {
            setIsResettingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            const response = await authFetch("/api/user/me", {
                method: "DELETE",
            })

            const data = await response.json().catch(() => ({}))

            if (response.ok) {
                toast.success(data.message || "Account deleted successfully")
                await signOut()
                router.push("/")
            } else if (response.status === 403) {
                toast.error(data.error || "Cannot delete account: outstanding balances.")
            } else if (response.status === 401) {
                toast.error("Session expired. Please log in again.")
                await signOut()
            } else {
                toast.error(data.error || "Something went wrong. Please try again later.")
            }
        } catch (error) {
            console.error("Error deleting account:", error)
            toast.error("Failed to delete account. Please check your connection.")
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen pb-24 bg-white text-black">
                <div className="p-6 space-y-6">
                    <Skeleton className="h-8 w-48 bg-gray-200" />
                    <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-full bg-gray-200" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-32 bg-gray-200" />
                            <Skeleton className="h-4 w-48 bg-gray-200" />
                        </div>
                    </div>
                    <Skeleton className="h-16 w-full rounded-2xl bg-gray-200" />
                    <Skeleton className="h-16 w-full rounded-2xl bg-gray-200" />
                </div>
            </main>
        )
    }

    if (!user) return null

    const displayName = data?.user?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User"
    const email = user?.email || ""
    const avatarUrl = data?.user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar

    return (
        <main className="min-h-screen pb-24 bg-white">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-black border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div className="w-5 h-5 text-white fill-white">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-black tracking-tighter uppercase italic">Account</h1>
                </div>

                <div className="flex items-center gap-4 mb-12">
                    <div className="relative group">
                        <Avatar className="h-20 w-20 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <AvatarImage src={avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-orange-100 text-orange-600 font-black text-2xl">
                                {displayName.slice(0, 2).toUpperCase()}
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
                            className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full border-2 border-black shadow-none bg-white hover:bg-gray-100"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? (
                                <Loader2 className="h-4 w-4 animate-spin text-black" />
                            ) : (
                                <Camera className="h-4 w-4 text-black" />
                            )}
                        </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-black truncate">{displayName}</h2>
                        <p className="text-sm font-medium text-[#757575] truncate">{email}</p>
                    </div>
                </div>

                <div className="space-y-4 pt-4">

                    <Button
                        onClick={handleResetPassword}
                        disabled={isResettingPassword}
                        variant="outline"
                        className="w-full bg-white hover:bg-gray-50 text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black py-7 text-lg rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        {isResettingPassword ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <KeyRound className="mr-2 h-6 w-6" />
                                Reset Password
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={() => signOut()}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black py-7 text-lg rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        <LogOut className="mr-2 h-6 w-6" />
                        Sign Out
                    </Button>

                    <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="outline"
                        className="w-full bg-white hover:bg-red-50 text-red-600 border-4 border-black shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] font-black py-7 text-lg rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        <Trash2 className="mr-2 h-6 w-6" />
                        Delete Account
                    </Button>
                </div>
            </div>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="border-4 border-black sm:max-w-[425px] p-6">
                    <DialogHeader className="gap-2">
                        <div className="mx-auto bg-red-100 p-3 rounded-full border-2 border-black w-fit">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center">Are you sure?</DialogTitle>
                        <DialogDescription className="text-center text-gray-700 font-medium">
                            This action is permanent and cannot be undone. All your data will be cleared from <strong>Unwise</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col gap-3 mt-4">
                        <Button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black h-14 rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Deleting Account...
                                </>
                            ) : (
                                "Yes, delete my account"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="border-4 border-black font-black h-14 rounded-xl hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <BottomNav />
        </main>
    )
}


import { useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export const useAvatarUpload = () => {
    const [isUploading, setIsUploading] = useState(false)
    const queryClient = useQueryClient()
    const { refreshUser } = useAuth()

    const uploadAvatar = async (
        file: File,
        target: { type: 'user' } | { type: 'group', groupId: string }
    ) => {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('avatar', file)

        const url = target.type === 'user'
            ? '/api/user/avatar'
            : `/api/groups/${target.groupId}/avatar`

        try {
            const response = await authFetch(url, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || errorData.message || 'Upload failed')
            }

            const data = await response.json()

            if (target.type === 'user') {
                const { error } = await supabase.auth.refreshSession()
                if (error) {
                    console.error("Error refreshing session:", error)
                }
                await refreshUser()
                queryClient.invalidateQueries({ queryKey: ["dashboard"] })
                queryClient.invalidateQueries({ queryKey: ["groups"] })
                queryClient.invalidateQueries({ queryKey: ["friends"] })
                queryClient.invalidateQueries({ queryKey: ["group"] })
            } else {
                queryClient.invalidateQueries({ queryKey: ["group", target.groupId] })
                queryClient.invalidateQueries({ queryKey: ["groups"] })
                queryClient.invalidateQueries({ queryKey: ["dashboard"] })
            }

            toast.success("Avatar updated successfully!")
            return data.avatar_url
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.message || "Failed to upload avatar")
            throw error
        } finally {
            setIsUploading(false)
        }
    }

    return { uploadAvatar, isUploading }
}

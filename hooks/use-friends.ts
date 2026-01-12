import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authFetch } from "@/lib/auth-fetch"
import { parseApiError } from "@/lib/api-error"

export interface Friend {
    id: string
    name: string
    email: string
    avatar?: string | null
    avatar_url?: string | null
    net_balance: number
    groups: {
        id: string
        name: string
        avatar_url: string | null
    }[]
    group_balances: {
        group_id: string
        group_name: string
        amount: number
    }[]
}

export interface SearchUser {
    id: string
    name: string
    email: string
    avatar_url?: string
}

export const fetchFriends = async () => {
    const res = await authFetch("/api/friends")
    if (!res.ok) {
        throw await parseApiError(res)
    }
    const data = await res.json() as Friend[]
    return data
}


export const useFriends = () => {
    return useQuery({
        queryKey: ["friends"],
        queryFn: fetchFriends,
        staleTime: 1000 * 30,
    })
}

export const useSearchUsers = (query: string) => {
    return useQuery({
        queryKey: ["users", "search", query],
        queryFn: async () => {
            if (!query || query.length < 2) return []
            const res = await authFetch(`/api/friends/search?q=${encodeURIComponent(query)}`)
            if (!res.ok) {
                throw await parseApiError(res)
            }
            return res.json() as Promise<SearchUser[]>

        },
        enabled: !!query && query.length >= 2,
        staleTime: 1000 * 60,
    })
}

export const useAddFriend = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (email: string) => {
            const res = await authFetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            if (!res.ok) {
                throw await parseApiError(res)
            }
            return res.json()

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friends"] })
        },
    })
}

export const useRemoveFriend = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (friendId: string) => {
            const res = await authFetch(`/api/friends/${friendId}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                throw await parseApiError(res)
            }
            return res.json()

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friends"] })
        },
    })
}

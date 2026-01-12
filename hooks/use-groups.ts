import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"
import { authFetch } from "@/lib/auth-fetch"
import { parseApiError } from "@/lib/api-error"
import { useAuth } from "@/contexts/auth-context"

interface BackendMember {
    id: string
    name?: string
    email?: string
    balance?: number
    avatar_url?: string
    avatar?: string
    is_placeholder?: boolean
}

interface BackendGroup {
    id: string
    name: string
    members?: BackendMember[]
    total_balance?: number
    total_spend?: number
    has_debts?: boolean
    avatar_url?: string
    avatar?: string
}

interface BackendTransaction {
    id: string
    description: string
    total_amount: number
    paid_by_user: {
        id: string
        name?: string
        email?: string
    }
    date: string
    time?: string
    type?: string
    user_share?: number
    user_net_amount?: number
    user_is_owed?: boolean
    user_is_lent?: boolean
    user_is_payer?: boolean
    user_is_recipient?: boolean
    explanation?: string
    splits?: Array<{
        user_id: string
        user_name?: string
        user_email?: string
        amount: number
    }>
    payers?: Array<{
        user_id: string
        user_name?: string
        user_email?: string
        amount_paid: number
    }>
    receipt_image_url?: string
    receipt_url?: string
    receipt_image?: string
    tax?: number
    cgst?: number
    sgst?: number
    service_charge?: number
    created_at: string
    date_iso?: string
    group_id?: string
    category?: string
    user_id?: string // for payers/splits sometimes
}

interface BalancesResponse {
    debts: Array<{
        from_user: { id: string; name: string }
        to_user: { id: string; name: string }
        amount: number
    }>
    summary: {
        total_owed_to_user: number
        total_user_owes: number
        count_owed_to_user: number
        count_user_owes: number
        total_net: number
        state: string
    }
}

export interface Member {
    id: string
    name: string
    email: string
    balance: number
    avatar_url?: string
    is_placeholder?: boolean
    claimed_by?: string | null
    claimed_at?: string | null
}

export interface Group {
    id: string
    name: string
    members: Member[]
    totalBalance: number
    avatar_url?: string
}

export interface GroupDetails extends Group {
    total_spend: number
    has_debts: boolean
    debts: Array<{
        from_user: { id: string; name: string }
        to_user: { id: string; name: string }
        amount: number
    }>
}

export interface Expense {
    id: string
    description: string
    amount: number
    paidBy: {
        id: string
        name: string
    }
    date: string
    time?: string
    type: "expense" | "repayment"
    user_share: number
    user_net_amount: number
    user_is_owed: boolean
    user_is_lent: boolean
    user_is_payer: boolean
    user_is_recipient: boolean
    splits: Array<{
        userId: string
        userName: string
        amount: number
    }>
    category?: string
    receiptImage?: string
    tax?: number
    cgst?: number
    sgst?: number
    service_charge?: number
    explanation?: string
    payers: Array<{
        userId: string
        userName: string
        amount: number
    }>
    created_at: string
    full_date: string
    group_id?: string
}

export const fetchGroups = async (userId?: string) => {
    const response = await authFetch("/api/groups")
    if (!response.ok) {
        throw await parseApiError(response)
    }
    const backendGroups = await response.json() as BackendGroup[]

    return backendGroups.map((group) => ({
        id: group.id,
        name: group.name,
        members: (group.members || [])
            .filter((member) => member.id !== userId && member.balance !== 0)
            .map((member) => ({
                id: member.id,
                name: member.name || member.email,
                email: member.email || "",
                balance: member.balance || 0,
                avatar_url: member.avatar_url,
            })),
        totalBalance: group.total_balance || 0,
        avatar_url: group.avatar_url || group.avatar,
    })) as Group[]
}

export const useGroups = () => {
    const { user } = useAuth()

    return useQuery({
        queryKey: ["groups", user?.id],
        queryFn: () => fetchGroups(user?.id),
        enabled: !!user?.id,
    })
}

export const fetchGroupDetails = async (groupId: string, userId?: string) => {
    const [groupRes, balancesRes, transactionsRes] = await Promise.all([
        authFetch(`/api/groups/${groupId}`),
        authFetch(`/api/groups/${groupId}/balances`),
        authFetch(`/api/groups/${groupId}/transactions`),
    ])

    if (!groupRes.ok) {
        throw await parseApiError(groupRes)
    }

    const groupData = await groupRes.json() as BackendGroup
    const balancesData = balancesRes.ok
        ? await balancesRes.json() as BalancesResponse
        : {
            debts: [],
            summary: {
                total_owed_to_user: 0,
                total_user_owes: 0,
                count_owed_to_user: 0,
                count_user_owes: 0,
                total_net: 0,
                state: 'neutral'
            }
        } as BalancesResponse
    const transactionsData = transactionsRes.ok ? await transactionsRes.json() as BackendTransaction[] : []

    const members = (groupData.members || []).map((m) => ({
        id: m.id,
        name: m.name || m.email,
        email: m.email || "",
        balance: m.balance || 0,
        avatar_url: m.avatar_url,
        is_placeholder: m.is_placeholder,
    }))

    const expenses: Expense[] = transactionsData.map((tx) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.total_amount,
        paidBy: {
            id: tx.paid_by_user.id,
            name: tx.paid_by_user.name || tx.paid_by_user.email || "Unknown",
        },
        date: tx.date,
        time: tx.time,
        type: (tx.type?.toLowerCase() === "repayment" || tx.type?.toUpperCase() === "PAYMENT") ? "repayment" : "expense",
        user_share: Math.abs(tx.user_share || 0),
        user_net_amount: tx.user_net_amount ?? tx.user_share ?? 0,
        user_is_owed: tx.user_is_owed || false,
        user_is_lent: tx.user_is_lent || false,
        user_is_payer: tx.user_is_payer || false,
        user_is_recipient: tx.user_is_recipient || false,
        explanation: tx.explanation,
        splits: (tx.splits || []).map((split) => ({
            userId: split.user_id,
            userName: split.user_name || split.user_email || "Unknown",
            amount: split.amount,
        })),
        receiptImage: (() => {
            const url = tx.receipt_image_url || tx.receipt_url || tx.receipt_image;
            return url;
        })(),
        tax: tx.tax,
        cgst: tx.cgst,
        sgst: tx.sgst,
        service_charge: tx.service_charge,
        payers: (tx.payers || []).map((p) => ({
            userId: p.user_id,
            userName: p.user_name || p.user_email || "Unknown",
            amount: p.amount_paid,
        })),
        created_at: tx.created_at,
        full_date: tx.date_iso || tx.date,
        group_id: groupId,
    }))

    return {
        group: {
            id: groupData.id,
            name: groupData.name,
            total_spend: groupData.total_spend || 0,
            has_debts: groupData.has_debts || false,
            members,
            debts: balancesData.debts || [],
            totalBalance: 0,
            avatar_url: groupData.avatar_url || groupData.avatar,
        } as GroupDetails,
        expenses,
        balancesData,
    }
}

export const useGroupDetails = (groupId?: string) => {
    const { user } = useAuth()

    return useQuery({
        queryKey: ["group", groupId, user?.id],
        queryFn: async () => {
            if (!groupId) return null
            return fetchGroupDetails(groupId, user?.id)
        },
        enabled: !!groupId && !!user?.id,
    })
}

export interface DashboardResponse {
    user: {
        id: string
        name: string
        avatar_url?: string
    }
    metrics: {
        total_net_balance: number
        total_you_owe: number
        total_you_are_owed: number
    }
    groups: Array<{
        id: string
        name: string
        my_balance_in_group: number
        last_activity_at: string
        avatar_url?: string
    }>
    recent_activity: Array<{
        id: string
        description: string
        amount: number
        type: "EXPENSE" | "PAYMENT" | "REPAYMENT"
        action_text: string
        created_at: string
        date?: string
        receipt_image_url?: string
    }>
}

export const useDashboard = () => {
    const { user } = useAuth()

    return useQuery({
        queryKey: ["dashboard", user?.id],
        queryFn: async () => {
            const response = await authFetch("/api/dashboard")
            if (!response.ok) {
                throw await parseApiError(response)
            }
            return (await response.json()) as DashboardResponse
        },
        enabled: !!user?.id,
    })

}

export const useAddMember = (groupId: string) => {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    return useMutation({
        mutationFn: async (email: string) => {
            const res = await authFetch(`/api/groups/${groupId}/members`, {
                method: "POST",
                body: JSON.stringify({ email }),
            })
            if (!res.ok) throw await parseApiError(res)
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        },
    })
}

export const useAddPlaceholderMember = (groupId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (name: string) => {
            const res = await authFetch(`/api/groups/${groupId}/placeholders`, {
                method: "POST",
                body: JSON.stringify({ name }),
            })
            if (!res.ok) throw await parseApiError(res)
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        },
    })
}

export const useRemoveMember = (groupId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await authFetch(`/api/groups/${groupId}/members/${userId}`, {
                method: "DELETE",
            })
            if (!response.ok) {
                throw await parseApiError(response)
            }
            return response.json()
        },
        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: ["group", groupId] })
            const previousGroupDetails = queryClient.getQueryData<{ group: GroupDetails; expenses: Expense[]; balancesData: BalancesResponse }>(["group", groupId])
            if (previousGroupDetails) {
                queryClient.setQueryData(["group", groupId], {
                    ...previousGroupDetails,
                    group: {
                        ...previousGroupDetails.group,
                        members: previousGroupDetails.group.members.filter((m) => m.id !== userId)
                    }
                })
            }
            return { previousGroupDetails }
        },
        onError: (err, userId, context) => {
            if (context?.previousGroupDetails) {
                queryClient.setQueryData(["group", groupId], context.previousGroupDetails)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        },
    })
}

export const useDeleteGroup = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (groupId: string) => {
            const response = await authFetch(`/api/groups/${groupId}`, {
                method: "DELETE",
            })
            if (!response.ok) {
                throw await parseApiError(response)
            }
            return response.json()

        },
        onMutate: async (groupId) => {
            await queryClient.cancelQueries({ queryKey: ["groups"] })
            await queryClient.cancelQueries({ queryKey: ["dashboard"] })

            const previousGroups = queryClient.getQueryData<Group[]>(["groups"])
            const previousDashboard = queryClient.getQueryData<DashboardResponse>(["dashboard"])

            if (previousGroups) {
                queryClient.setQueryData(["groups"], previousGroups.filter(g => g.id !== groupId))
            }
            if (previousDashboard) {
                queryClient.setQueryData(["dashboard"], {
                    ...previousDashboard,
                    groups: previousDashboard.groups.filter((g) => g.id !== groupId)
                })
            }

            return { previousGroups, previousDashboard }
        },
        onError: (err, groupId, context) => {
            if (context?.previousGroups) {
                queryClient.setQueryData(["groups"], context.previousGroups)
            }
            if (context?.previousDashboard) {
                queryClient.setQueryData(["dashboard"], context.previousDashboard)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        },
    })
}

export const useUpdateGroup = (groupId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (name: string) => {
            const response = await authFetch(`/api/groups/${groupId}`, {
                method: "PUT",
                body: JSON.stringify({ name }),
            })
            if (!response.ok) {
                throw await parseApiError(response)
            }
            return response.json()
        },
        onMutate: async (newName) => {
            await queryClient.cancelQueries({ queryKey: ["group", groupId] })
            await queryClient.cancelQueries({ queryKey: ["groups"] })
            await queryClient.cancelQueries({ queryKey: ["dashboard"] })

            const previousGroupDetails = queryClient.getQueryData<{ group: GroupDetails; expenses: Expense[]; balancesData: BalancesResponse }>(["group", groupId])
            const previousGroups = queryClient.getQueryData<Group[]>(["groups"]) || []
            const previousDashboard = queryClient.getQueryData<DashboardResponse>(["dashboard"])

            if (previousGroupDetails) {
                queryClient.setQueryData(["group", groupId], {
                    ...previousGroupDetails,
                    group: { ...previousGroupDetails.group, name: newName }
                })
            }

            queryClient.setQueryData(["groups"], (old: Group[] | undefined) =>
                old?.map(g => g.id === groupId ? { ...g, name: newName } : g)
            )

            if (previousDashboard) {
                queryClient.setQueryData(["dashboard"], {
                    ...previousDashboard,
                    groups: previousDashboard.groups.map((g) => g.id === groupId ? { ...g, name: newName } : g)
                })
            }

            return { previousGroupDetails, previousGroups, previousDashboard }
        },
        onError: (err, newName, context) => {
            if (context?.previousGroupDetails) queryClient.setQueryData(["group", groupId], context.previousGroupDetails)
            if (context?.previousGroups) queryClient.setQueryData(["groups"], context.previousGroups)
            if (context?.previousDashboard) queryClient.setQueryData(["dashboard"], context.previousDashboard)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        },
    })
}

export const fetchExpenseDetails = async (expenseId: string) => {
    const res = await authFetch(`/api/expenses/${expenseId}`)
    if (!res.ok) {
        throw await parseApiError(res)
    }
    const data = await res.json() as BackendTransaction
    const memberMap = new Map<string, string>()
    if (data.group_id) {
        try {
            const groupRes = await authFetch(`/api/groups/${data.group_id}`)
            if (groupRes.ok) {
                const groupData = await groupRes.json() as BackendGroup
                if (groupData.members) {
                    groupData.members.forEach((m) => {
                        memberMap.set(m.id, m.name || m.email || "Unknown Member")
                    })
                }
            }
        } catch (err) {
            console.warn("Failed to fetch group details for name resolution", err)
        }
    }

    const getName = (userId: string, fallbackUserObj?: { name?: string; email?: string; user_name?: string; user_email?: string }) => {
        if (memberMap.has(userId)) return memberMap.get(userId)!
        if (fallbackUserObj) {
            return fallbackUserObj.name || fallbackUserObj.user_name || fallbackUserObj.email || fallbackUserObj.user_email || "Unknown"
        }
        return "Unknown"
    }

    const mappedExpense: Expense = {
        id: data.id,
        description: data.description,
        amount: data.total_amount,
        date: data.date,
        full_date: data.date,
        paidBy: {
            id: data.payers?.[0]?.user_id || "unknown",
            name: getName(data.payers?.[0]?.user_id || "unknown", data.payers?.[0]),
        },
        type: (data.type?.toLowerCase() === "repayment" || data.type?.toUpperCase() === "PAYMENT") ? "repayment" : "expense",
        user_share: 0,
        user_net_amount: 0,
        user_is_owed: false,
        user_is_lent: false,
        user_is_payer: false,
        user_is_recipient: false,
        created_at: data.created_at,
        payers: (data.payers || []).map((p) => ({
            userId: p.user_id,
            userName: getName(p.user_id, p),
            amount: p.amount_paid
        })),
        splits: (data.splits || []).map((s) => ({
            userId: s.user_id,
            userName: getName(s.user_id, s),
            amount: s.amount
        })),
        receiptImage: data.receipt_image_url,
        cgst: data.cgst,
        sgst: data.sgst,
        service_charge: data.service_charge,
        tax: data.tax,
        category: data.category,
        group_id: data.group_id
    }

    return mappedExpense
}

export const useExpenseDetails = (expenseId?: string) => {
    return useQuery({
        queryKey: ["expense", expenseId],
        queryFn: async () => {
            if (!expenseId) return null
            return fetchExpenseDetails(expenseId as string)
        },
        enabled: !!expenseId,
        staleTime: 1000 * 60 * 5,
    })
}

export const useDeleteExpense = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id }: { id: string; groupId?: string }) => {
            const response = await authFetch(`/api/expenses/${id}`, {
                method: "DELETE",
            })
            if (!response.ok) {
                throw await parseApiError(response)
            }
            return response.json()
        },
        onSuccess: (data, { groupId }) => {
            if (groupId) {
                queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            }
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        },
        onSettled: (data, error, { groupId }) => {
            if (groupId) {
                queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            }
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        }
    })
}

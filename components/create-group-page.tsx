"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Plane, Home, Heart, List, X, UserPlus, Plus, Search, Loader2, Check, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { authFetch } from "@/lib/auth-fetch"
import { useSearchUsers, useFriends } from "@/hooks/use-friends"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type GroupType = "home" | "trip" | "couple" | "other"

const groupTypes = [
  { value: "trip", label: "Trip", icon: Plane },
  { value: "home", label: "Home", icon: Home },
  { value: "couple", label: "Couple", icon: Heart },
  { value: "other", label: "Other", icon: List },
]

export const CreateGroupPage = () => {
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const [groupName, setGroupName] = useState("")
  const [groupType, setGroupType] = useState<GroupType>("home")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: friends, isLoading: isFriendsLoading } = useFriends()
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(debouncedQuery)

  const handleAddMember = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return
    if (memberEmails.includes(normalizedEmail)) {
      toast.error("Member already added")
      return
    }
    setMemberEmails([...memberEmails, normalizedEmail])
    setSearchQuery("")
  }

  const removeEmail = (email: string) => {
    setMemberEmails(memberEmails.filter(e => e !== email))
  }

  const isSelected = (email: string) => memberEmails.includes(email.toLowerCase())
  const displayUsers = searchQuery && searchResults ? searchResults : friends || []
  
  const addEmail = () => {
    const email = searchQuery.trim().toLowerCase()
    if (!email) return
    if (!email.includes("@")) {
      toast.error("Please enter a valid email")
      return
    }
    handleAddMember(email)
  }

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName.trim(),
          type: groupType.toUpperCase(),
          member_emails: memberEmails,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to create group" }))
        throw new Error(error.error || "Failed to create group")
      }

      const data = await response.json()
      toast.success("Group created successfully!")
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      router.push(`/groups/${data.id}`)
    } catch (error: any) {
      console.error("Error creating group:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create group")
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="min-h-screen bg-white text-[#4a4a4a]">
      {/* Custom Header */}
      <header className="sticky top-0 z-40 bg-white px-4 py-4">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-black font-bold text-lg hover:opacity-70 transition-opacity"
          >
            Cancel
          </button>
          <h1 className="text-xl font-bold text-[#2d3748]">Create a group</h1>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || isSubmitting}
            className={cn(
              "text-black font-bold text-lg transition-opacity",
              (!groupName.trim() || isSubmitting) ? "opacity-30 cursor-not-allowed" : "hover:opacity-70"
            )}
          >
            {isSubmitting ? "Wait..." : "Done"}
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-4 space-y-12">
        {/* Group Name Section */}
        <div className="space-y-1">
          <label htmlFor="groupName" className="text-sm font-bold text-gray-600 block">
            Group name
          </label>
          <input
            ref={nameRef}
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
            className="w-full bg-transparent border-b-2 border-black py-2 text-xl focus:outline-none placeholder-gray-300"
          />
        </div>

        {/* Group Type Section */}
        <div className="space-y-6">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block">
            Type
          </label>
          <div className="grid grid-cols-4 gap-4">
            {groupTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setGroupType(type.value as GroupType)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all space-y-2",
                    groupType === type.value
                      ? "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
                      : "border-gray-200 bg-white hover:border-gray-300 text-gray-400"
                  )}
                >
                  <Icon className={cn(
                    "h-8 w-8",
                    groupType === type.value ? "text-black" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "text-xs font-bold",
                    groupType === type.value ? "text-black" : "text-gray-500"
                  )}>
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Invite Members Section */}
        <div className="space-y-6">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block">
            Invite Members
          </label>

          {/* Search Input */}
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or email"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addEmail()
                }
              }}
              className="w-full bg-transparent border-b-2 border-black py-2 pl-8 text-lg focus:outline-none placeholder-gray-300"
            />
            {searchQuery && (
              <button
                onClick={addEmail}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-black hover:bg-gray-100 rounded-md"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Selected Members Chips */}
          {memberEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {memberEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-xl text-sm font-bold border-2 border-black"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions List */}
          <div className="space-y-1 max-h-60 overflow-y-auto -mx-2 px-2">
            {(isFriendsLoading || isSearching) && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            {!isFriendsLoading && !isSearching && displayUsers.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {searchQuery ? "Search Results" : "Suggestions"}
                </p>
                {displayUsers.map(user => {
                  const selected = isSelected(user.email)
                  return (
                    <div
                      key={user.id}
                      onClick={() => !selected && handleAddMember(user.email)}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 rounded-xl transition-colors",
                        selected ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="h-10 w-10 border-2 border-black">
                          <AvatarImage src={user.avatar_url || (user as any).avatar} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-sm">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      {selected && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                  )
                })}
              </>
            )}

            {!isFriendsLoading && !isSearching && displayUsers.length === 0 && searchQuery && (
              <div className="text-center py-4 text-gray-500 font-medium">
                No users found. Press Enter to invite by email.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
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

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

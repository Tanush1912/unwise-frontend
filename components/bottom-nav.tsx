"use client"

import { usePathname } from "next/navigation"
import { Home, Plus, Users, Smile } from "lucide-react"
import { FloatingDock } from "@/components/ui/floating-dock"
import { useAuth } from "@/contexts/auth-context"
import { useDashboard } from "@/hooks/use-groups"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const UserAvatar = () => {
  const { user } = useAuth()
  const { data, isError } = useDashboard()

  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center scale-[1.8]">
        <Avatar className="h-full w-full border-0">
          <AvatarFallback className="bg-gray-100 text-black font-black text-[0.5em]">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  const avatarUrl = data?.user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar

  const getInitials = () => {
    const name = data?.user?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "U"
    return name?.charAt(0)?.toUpperCase() || "U"
  }

  return (
    <div className="h-full w-full flex items-center justify-center scale-[1.8]">
      <Avatar className="h-full w-full border-0">
        <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white font-black text-[0.5em]">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

export const BottomNav = () => {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      icon: <Home className="h-full w-full" />,
      href: "/",
    },
    {
      title: "Add Expense",
      icon: <Plus className="h-full w-full" />,
      href: "/expenses/add",
    },
    {
      title: "Groups",
      icon: <Users className="h-full w-full" />,
      href: "/groups",
    },
    {
      title: "Friends",
      icon: <Smile className="h-full w-full" />,
      href: "/friends",
    },
    {
      title: "Account",
      icon: <UserAvatar />,
      href: "/profile",
    },
  ]

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <FloatingDock
          items={navItems}
          activePath={pathname}
          desktopClassName="shadow-lg"
          mobileClassName="shadow-lg"
        />
      </div>
    </div>
  )
}


import { GroupDetailsPage } from "@/components/group-details-page"
import { BottomNav } from "@/components/bottom-nav"
import React from "react"

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(Promise.resolve(params))

  return (
    <main className="min-h-screen pb-24">
      <GroupDetailsPage groupId={resolvedParams?.id} />
      <BottomNav />
    </main>
  )
}


import { Skeleton } from "@/components/ui/skeleton"

export const ExpenseSkeleton = () => {
    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-0 z-20 bg-white border-b-2 border-black px-4 py-3 flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="max-w-2xl mx-auto p-6 space-y-8">
                <div className="text-center space-y-4">
                    <Skeleton className="w-16 h-16 rounded-2xl mx-auto" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-12 w-32 mx-auto" />
                    <Skeleton className="h-6 w-40 mx-auto rounded-full" />
                </div>
                <div className="border-2 border-black rounded-xl overflow-hidden">
                    <div className="h-10 bg-gray-50 border-b-2 border-black px-4 flex items-center">
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="divide-y-2 divide-black">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export const GroupSkeleton = () => {
    return (
        <div className="min-h-screen bg-white">
            <header className="sticky top-0 z-40 bg-white border-b-4 border-black">
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </div>
            </header>
            <div className="sticky top-[60px] z-30 border-b-2 border-black bg-white flex overflow-x-auto px-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="py-4 px-2 shrink-0">
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
            <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-2 border-black rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                ))}
            </div>
        </div>
    )
}

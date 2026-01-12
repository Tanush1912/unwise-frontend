"use client"

import { Loader2, Zap } from "lucide-react"

export const DashboardLoading = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 pb-20">
            <div className="relative">
                {/* Neobrutalist Logo Box */}
                <div className="w-24 h-24 bg-black border-4 border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                    <Zap className="w-12 h-12 text-white fill-white" />
                </div>

                {/* Secondary Decorative Box */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-400 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-10 animate-pulse" />
            </div>

            <div className="mt-12 text-center space-y-4">
                <h1 className="text-4xl font-black text-black tracking-tighter uppercase italic">
                    Unwise
                </h1>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-black rounded-xl font-bold text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating Debts...
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Hold tight, simplifying the math
                    </p>
                </div>
            </div>

            {/* Chunks/Bar decoration at the bottom */}
            <div className="fixed bottom-0 left-0 w-full h-2 bg-gray-100 border-t-2 border-black">
                <div className="h-full bg-black animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
            </div>

            <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
        </div>
    )
}

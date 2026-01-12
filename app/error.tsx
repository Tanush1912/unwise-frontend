'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('App Error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
                <div className="w-24 h-24 bg-red-50 border-4 border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">!</span>
                </div>
            </div>

            <h1 className="text-4xl font-black text-black tracking-tighter uppercase italic mb-4">
                Something went wrong
            </h1>

            <p className="text-lg font-medium text-gray-600 mb-10 max-w-md mx-auto leading-tight italic uppercase">
                {error.message || "A client-side exception has occurred. We're working on fixing it!"}
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                <Button
                    onClick={() => reset()}
                    className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] rounded-xl font-black h-14 text-lg uppercase italic transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw className="h-5 w-5" />
                    Try Again
                </Button>

                <Link href="/" className="w-full">
                    <Button
                        variant="outline"
                        className="w-full h-14 border-2 border-black rounded-xl font-black text-lg uppercase italic hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <Home className="h-5 w-5" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            <div className="mt-12 p-4 bg-gray-50 border-2 border-dashed border-black/10 rounded-xl max-w-sm w-full">
                <p className="text-[10px] font-mono text-gray-400 break-all">
                    Error ID: {error.digest || 'no-digest'}
                </p>
            </div>
        </div>
    )
}

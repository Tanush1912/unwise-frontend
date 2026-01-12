"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setIsValidSession(!!session)
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setIsValidSession(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        setIsSubmitting(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                throw error
            }

            setIsSuccess(true)
            toast.success("Password updated successfully!")

            setTimeout(() => {
                router.push("/profile")
            }, 2000)
        } catch (error: any) {
            console.error("Error updating password:", error)
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isValidSession === null) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-black" />
            </main>
        )
    }

    if (!isValidSession) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-16 h-16 bg-orange-100 border-4 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <KeyRound className="h-8 w-8 text-orange-600" />
                    </div>
                    <h1 className="text-2xl font-black">Invalid or Expired Link</h1>
                    <p className="text-gray-600">
                        This password reset link is invalid or has expired. Please request a new one from your profile page.
                    </p>
                    <Button
                        onClick={() => router.push("/login")}
                        className="w-full bg-black hover:bg-gray-800 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black py-6 text-lg rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        Go to Login
                    </Button>
                </div>
            </main>
        )
    }

    if (isSuccess) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 border-4 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-black">Password Updated!</h1>
                    <p className="text-gray-600">
                        Your password has been successfully updated. Redirecting to your profile...
                    </p>
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-black" />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-black border-4 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <KeyRound className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black">Set New Password</h1>
                    <p className="text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="font-bold">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="h-14 border-4 border-black rounded-xl font-bold text-lg pr-12"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="font-bold">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-14 border-4 border-black rounded-xl font-bold text-lg"
                            required
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || !password || !confirmPassword}
                        className="w-full bg-black hover:bg-gray-800 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black py-7 text-lg rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                </form>
            </div>
        </main>
    )
}

"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
            },
          },
        })

        if (error) throw error

        if (data.user) {
          toast.success("Account created! Please check your email to verify your account.")
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (!signInError) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              router.push("/")
              router.refresh()
            }
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          toast.success("Logged in successfully!")
          router.push("/")
          router.refresh()
        } else {
          throw new Error("Session not available after login")
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      toast.error(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error("Google auth error:", error)
      toast.error(error.message || "Google authentication failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          {/* Animated Logo */}
          <div className="w-20 h-20 bg-black border-4 border-black rounded-3xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 animate-logo-pop">
            <svg className="w-10 h-10 text-white fill-white animate-bolt-flash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {/* Animated Title */}
          <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic mb-2 animate-title-slide">Unwise</h1>
          {/* Animated Subtitle */}
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-subtitle-fade">
            {isSignUp ? "Join the chaos" : "Back for more math?"}
          </p>

          <style jsx>{`
            @keyframes logo-pop {
              0% {
                transform: scale(0) rotate(-12deg);
                opacity: 0;
              }
              50% {
                transform: scale(1.15) rotate(3deg);
              }
              70% {
                transform: scale(0.95) rotate(-1deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }

            @keyframes bolt-flash {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.6;
              }
            }

            @keyframes title-slide {
              0% {
                transform: translateY(20px);
                opacity: 0;
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }

            @keyframes subtitle-fade {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }

            .animate-logo-pop {
              animation: logo-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .animate-bolt-flash {
              animation: bolt-flash 2s ease-in-out infinite;
              animation-delay: 0.6s;
            }

            .animate-title-slide {
              animation: title-slide 0.5s ease-out forwards;
              animation-delay: 0.3s;
              opacity: 0;
            }

            .animate-subtitle-fade {
              animation: subtitle-fade 0.5s ease-out forwards;
              animation-delay: 0.5s;
              opacity: 0;
            }
          `}</style>
        </div>

        <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold text-black">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="h-12 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold text-black">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold text-black">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
              {!isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-black text-white hover:bg-gray-800 border-2 border-black rounded-xl transition-colors"
            >
              {isLoading
                ? "Loading..."
                : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-black"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold border-2 border-black rounded-xl mt-4 bg-white text-black hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-black transition-colors underline decoration-2 underline-offset-2"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
          <div className="mt-4 p-4 bg-gray-100 border-2 border-black rounded-xl">
            <p className="text-sm text-black">
              <strong>Development Mode:</strong> Supabase credentials not configured.
              Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


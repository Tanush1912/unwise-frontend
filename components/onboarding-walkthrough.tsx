"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronRight, Check } from "lucide-react"

interface OnboardingStep {
    title: string
    description: string
    image: string
    overlay: React.ReactNode
}

export function OnboardingWalkthrough() {
    const [currentStep, setCurrentStep] = useState(0)
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const steps: OnboardingStep[] = [
        {
            title: "Welcome to Unwise",
            description: "Unwise keeps track of balances between friends.",
            image: "/onboarding/v3/welcome.png",
            overlay: (
                <motion.div
                    initial={{ y: 40, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                    className="bg-white border-4 border-black rounded-3xl p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-[300px] w-full"
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-black uppercase tracking-widest border-2 border-black px-2 py-0.5 rounded-lg bg-emerald-50">DASHBOARD</span>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-5 h-1.5 bg-black rounded-full" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Overall Balance</div>
                                <div className="text-lg font-black leading-none">You are owed</div>
                            </div>
                            <span className="text-2xl font-black text-emerald-500">$64.64</span>
                        </div>
                        <div className="pt-4 border-t-2 border-black space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="text-2xl">✈️</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-black">Beach trip</div>
                                    <div className="text-xs text-emerald-600 font-bold">David owes you $100</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="text-2xl">🏠</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-black">House stuff</div>
                                    <div className="text-xs text-orange-600 font-bold">You owe Brooklyn $35</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )
        },
        {
            title: "Settle Up",
            description: "Pay your friends back any time via your preferred method.",
            image: "/onboarding/v3/settle.png",
            overlay: (
                <motion.div
                    initial={{ x: 40, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                    className="bg-white border-4 border-black rounded-3xl p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-[300px] w-full"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className="w-16 h-16 bg-pink-100 rounded-full border-4 border-black flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-3xl">🐘</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-white">
                                <Check className="w-4 h-4 text-white" strokeWidth={5} />
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-black uppercase tracking-tight">Payment Sent</div>
                            <div className="text-lg font-black">To Brooklyn S.</div>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl border-2 border-black p-4 mb-5">
                        <div className="text-xs font-bold text-gray-400 mb-1">TOTAL AMOUNT</div>
                        <div className="text-3xl font-black font-mono tracking-tighter text-black">$105.36</div>
                    </div>
                    <div className="text-center">
                        <span className="text-xs text-black font-black bg-emerald-400 px-6 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            SUCCESSFULLY SETTLED
                        </span>
                    </div>
                </motion.div>
            )
        },
        {
            title: "Scan Receipts",
            description: "Snap a photo of your receipt and let AI do the heavy lifting.",
            image: "/onboarding/v3/scan.png",
            overlay: (
                <motion.div
                    initial={{ y: 40, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                    className="bg-white border-4 border-black rounded-3xl p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-[280px] w-full"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-xl">🤖</span>
                        </div>
                        <span className="font-black text-sm tracking-tight border-b-2 border-black leading-none">AI SCAN COMPLETE</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { item: "Margherita Pizza", price: "$18.50" },
                            { item: "Quattro Formaggi", price: "$22.00" },
                            { item: "Iced Tea x4", price: "$16.00" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                <span className="text-gray-500 truncate mr-4">{item.item}</span>
                                <span className="font-black text-black">{item.price}</span>
                            </div>
                        ))}
                        <div className="pt-3 mt-3 border-t-4 border-black flex justify-between items-center font-black text-lg">
                            <span className="tracking-tight">GRAND TOTAL</span>
                            <span className="text-emerald-500">$56.50</span>
                        </div>
                    </div>
                </motion.div>
            )
        }
    ]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            router.push("/")
        }
    }

    const handleSkip = () => {
        router.push("/")
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans overflow-hidden">
            {/* Background/Illustration Area  */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`bg-${currentStep}`}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={steps[currentStep].image}
                            alt=""
                            fill
                            className="object-cover opacity-60"
                            priority
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/90" />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="relative z-10 flex flex-col h-full items-center justify-between p-6 md:p-12">
                {/* Header Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`header-${currentStep}`}
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center pt-6 max-w-sm"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-black tracking-tighter mb-4 leading-none uppercase italic">
                            {steps[currentStep].title}
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 font-bold px-4 leading-tight">
                            {steps[currentStep].description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Visual/Overlay Content */}
                <div className="flex-1 w-full flex items-center justify-center perspective-1000">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`overlay-${currentStep}`}
                            initial={{ opacity: 0, rotateY: 10, translateZ: 50 }}
                            animate={{ opacity: 1, rotateY: 0, translateZ: 0 }}
                            exit={{ opacity: 0, rotateY: -10, translateZ: -50 }}
                            transition={{ duration: 0.6, ease: "backOut" }}
                            className="w-full flex justify-center drop-shadow-2xl"
                        >
                            {steps[currentStep].overlay}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="w-full max-w-md flex flex-col gap-6 pb-6">
                    {/* Pagination */}
                    <div className="flex justify-center gap-3">
                        {steps.map((_, idx) => (
                            <motion.div
                                key={idx}
                                animate={{
                                    width: idx === currentStep ? 40 : 12,
                                    backgroundColor: idx === currentStep ? "#000" : "#D1D5DB"
                                }}
                                className="h-3 rounded-full cursor-pointer border-2 border-black transition-all"
                                onClick={() => setCurrentStep(idx)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button
                            onClick={handleNext}
                            className="w-full h-20 text-2xl font-black border-4 border-black bg-black text-white hover:bg-gray-900 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95 group"
                        >
                            <span>{currentStep === steps.length - 1 ? "GET STARTED" : "CONTINUE"}</span>
                            <div className="ml-3 bg-white rounded-full p-1 group-hover:rotate-45 transition-transform border-4 border-black">
                                <ChevronRight className="w-6 h-6 text-black" strokeWidth={4} />
                            </div>
                        </Button>

                        <button
                            onClick={handleSkip}
                            className="text-gray-400 font-black hover:text-black transition-colors uppercase tracking-widest text-sm"
                        >
                            Skip tour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

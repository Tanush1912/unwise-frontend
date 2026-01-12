"use client"

import { useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertCircle, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { cn } from "@/lib/utils"

interface Member {
    id: string
    name: string
    email?: string
    avatar_url?: string
    is_placeholder?: boolean
}

interface PreviewResponse {
    csv_members: string[]
    group_members: Member[]
    suggested_mappings: Record<string, string | null>
    expense_count: number
    payment_count: number
    total_amount: number
}

interface ImportResponse {
    success: boolean
    imported_expenses: number
    imported_payments: number
    created_placeholders: string[]
    errors: string[]
}

interface SplitwiseImportDialogProps {
    groupId: string
    members: Member[]
    isOpen: boolean
    onClose: () => void
}

type Step = "upload" | "preview" | "mapping" | "importing" | "success"

export const SplitwiseImportDialog = ({
    groupId,
    members,
    isOpen,
    onClose,
}: SplitwiseImportDialogProps) => {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState<Step>("upload")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
    const [mappings, setMappings] = useState<Record<string, string | null>>({})
    const [importResult, setImportResult] = useState<ImportResponse | null>(null)

    const resetState = () => {
        setStep("upload")
        setSelectedFile(null)
        setPreviewData(null)
        setMappings({})
        setImportResult(null)
        setIsLoading(false)
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.csv')) {
                toast.error("Please select a CSV file")
                return
            }
            setSelectedFile(file)
        }
    }

    const handlePreview = async () => {
        if (!selectedFile) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const response = await authFetch(`/api/groups/${groupId}/import/splitwise/preview`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to preview CSV")
            }

            const data: PreviewResponse = await response.json()
            setPreviewData(data)
            setMappings(data.suggested_mappings || {})
            setStep("mapping")
        } catch (error) {
            console.error("Preview error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to preview CSV")
        } finally {
            setIsLoading(false)
        }
    }

    const handleImport = async () => {
        if (!selectedFile || !previewData) return

        setStep("importing")
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("member_mapping", JSON.stringify(mappings))

            const response = await authFetch(`/api/groups/${groupId}/import/splitwise`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to import CSV")
            }

            const result: ImportResponse = await response.json()
            setImportResult(result)
            setStep("success")

            // Refresh group data
            queryClient.invalidateQueries({ queryKey: ["group", groupId] })
            queryClient.invalidateQueries({ queryKey: ["groups"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        } catch (error) {
            console.error("Import error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to import CSV")
            setStep("mapping")
        } finally {
            setIsLoading(false)
        }
    }

    const updateMapping = (csvMember: string, groupMemberId: string | null) => {
        setMappings(prev => ({
            ...prev,
            [csvMember]: groupMemberId
        }))
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const renderUploadStep = () => (
        <div className="space-y-6 py-4">
            <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "border-4 border-dashed border-black rounded-2xl p-8 text-center cursor-pointer transition-colors",
                    selectedFile ? "bg-gray-50" : "hover:bg-gray-50"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileSelect}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-black">
                            <FileSpreadsheet className="h-8 w-8 text-black" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-2 border-black"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFile(null)
                            }}
                        >
                            Choose different file
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-black">
                            <Upload className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Drop your Splitwise CSV here</p>
                            <p className="text-sm text-muted-foreground">
                                or click to browse
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-bold text-black uppercase tracking-tight">
                    <strong>How to export from Splitwise:</strong>
                </p>
                <ol className="text-sm text-black/70 mt-3 list-decimal list-inside space-y-2 font-medium">
                    <li>Open Splitwise on the web</li>
                    <li>Go to your group settings</li>
                    <li>Click &quot;Export to spreadsheet&quot;</li>
                    <li>Download the CSV file</li>
                </ol>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-12 border-2 border-black font-bold"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handlePreview}
                    disabled={!selectedFile || isLoading}
                    className="flex-1 h-12 font-bold"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            Preview Import
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )

    const renderMappingStep = () => (
        <div className="space-y-3 py-2">
            {/* Summary - using flex with equal widths */}
            <div className="flex gap-2">
                <div className="flex-1 bg-gray-100 border-2 border-black rounded-lg p-2 text-center min-w-0">
                    <p className="text-xl font-black">{previewData?.expense_count || 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Expenses</p>
                </div>
                <div className="flex-1 bg-gray-100 border-2 border-black rounded-lg p-2 text-center min-w-0">
                    <p className="text-xl font-black">{previewData?.payment_count || 0}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Payments</p>
                </div>
                <div className="flex-1 bg-gray-100 border-2 border-black rounded-lg p-2 text-center min-w-0 overflow-hidden">
                    <p className="text-lg font-black truncate">₹{(previewData?.total_amount || 0).toFixed(0)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
                </div>
            </div>

            {/* Member Mappings */}
            <div className="space-y-1">
                <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                    Map members
                </p>

                <div className="border-2 border-black rounded-lg overflow-hidden divide-y divide-gray-200 max-h-56 overflow-y-auto">
                    {previewData?.csv_members.map((csvMember) => (
                        <div key={csvMember} className="flex items-center gap-2 p-2 bg-white">
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="font-semibold text-sm truncate">{csvMember}</p>
                                <p className="text-[10px] text-muted-foreground">From Splitwise</p>
                            </div>

                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

                            <Select
                                value={mappings[csvMember] || "create_placeholder"}
                                onValueChange={(value) =>
                                    updateMapping(csvMember, value === "create_placeholder" ? null : value)
                                }
                            >
                                <SelectTrigger className="w-[120px] h-8 text-xs border border-gray-300 rounded-md">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="create_placeholder">
                                        <div className="flex items-center gap-1">
                                            <UserPlus className="h-3 w-3" />
                                            <span className="text-xs">New placeholder</span>
                                        </div>
                                    </SelectItem>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex items-center gap-1">
                                                <Avatar className="h-4 w-4">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback className="text-[6px] font-bold">
                                                        {getInitials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs truncate max-w-[70px]">{member.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                <p className="text-[11px] font-medium text-yellow-800">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Unmapped members will be created as placeholders.
                </p>
            </div>

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => setStep("upload")}
                    className="flex-1 h-10 border-2 border-black font-bold text-sm"
                >
                    Back
                </Button>
                <Button
                    onClick={handleImport}
                    disabled={isLoading}
                    className="flex-1 h-10 font-bold text-sm"
                >
                    Import {previewData?.expense_count || 0}
                </Button>
            </div>
        </div>
    )

    const renderImportingStep = () => (
        <div className="py-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-black" />
            <p className="font-bold text-xl">Importing your expenses...</p>
            <p className="text-muted-foreground mt-2">This may take a moment</p>
        </div>
    )

    const renderSuccessStep = () => (
        <div className="space-y-6 py-4">
            <div className="text-center">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Check className="h-10 w-10 text-black" />
                </div>
                <h3 className="text-2xl font-black">Import Complete!</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 border-2 border-black rounded-xl p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-3xl font-black text-black">
                        {importResult?.imported_expenses || 0}
                    </p>
                    <p className="text-sm font-bold text-muted-foreground">Expenses imported</p>
                </div>
                <div className="bg-gray-100 border-2 border-black rounded-xl p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-3xl font-black text-black">
                        {importResult?.imported_payments || 0}
                    </p>
                    <p className="text-sm font-bold text-muted-foreground">Payments imported</p>
                </div>
            </div>

            {(importResult?.created_placeholders?.length || 0) > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                    <p className="font-bold text-sm mb-2">Created placeholders:</p>
                    <div className="flex flex-wrap gap-2">
                        {importResult?.created_placeholders.map((name) => (
                            <span
                                key={name}
                                className="px-3 py-1 bg-yellow-100 border border-yellow-400 rounded-full text-sm font-medium"
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {(importResult?.errors?.length || 0) > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                    <p className="font-bold text-sm text-red-600 mb-2">Some errors occurred:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                        {importResult?.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <Button
                onClick={handleClose}
                className="w-full h-12 font-bold"
            >
                Done
            </Button>
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="border-4 border-black rounded-3xl sm:max-w-md max-w-[90vw] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">
                        {step === "upload" && "Import from Splitwise"}
                        {step === "mapping" && "Map Members"}
                        {step === "importing" && "Importing..."}
                        {step === "success" && "Success!"}
                    </DialogTitle>
                    {step === "upload" && (
                        <DialogDescription className="font-medium">
                            Import your expense history from Splitwise CSV export
                        </DialogDescription>
                    )}
                    {step === "mapping" && (
                        <DialogDescription className="font-medium">
                            Match Splitwise members to your group members
                        </DialogDescription>
                    )}
                </DialogHeader>

                {step === "upload" && renderUploadStep()}
                {step === "mapping" && renderMappingStep()}
                {step === "importing" && renderImportingStep()}
                {step === "success" && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    )
}

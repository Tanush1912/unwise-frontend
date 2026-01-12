"use client"

import { useRef, useState } from "react"
import { useExpenseStore } from "@/store/expense-store"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { apiRequestFormData } from "@/lib/api-client"

interface ReceiptUploadProps {
  onUploaded: () => void
}

interface ScanReceiptResponse {
  items: Array<{ name: string; price: number }>
  total: number
  subtotal: number
  tax: number
  cgst: number
  sgst: number
  service_charge: number
  receipt_image_url?: string
  prices_include_tax?: boolean
}

const detectTaxInclusive = (data: ScanReceiptResponse): boolean => {
  if (data.prices_include_tax !== undefined) {
    return data.prices_include_tax
  }

  const itemsSum = (data.items || []).reduce((sum, item) => sum + item.price, 0)
  const diffToTotal = Math.abs(itemsSum - (data.total || 0))
  const diffToSubtotal = Math.abs(itemsSum - (data.subtotal || 0))

  return diffToTotal < diffToSubtotal
}

export const ReceiptUpload = ({ onUploaded }: ReceiptUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { setReceiptImage, setIsScanning } = useExpenseStore()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setReceiptImage(file)
    setIsUploading(true)
    setIsScanning(true)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const data = await apiRequestFormData("/scan-receipt", formData) as ScanReceiptResponse
      const detectedTaxInclusive = detectTaxInclusive(data)
      const transformedItems = (data.items || []).map((item, index) => ({
        id: `item-${index}`,
        name: item.name,
        price: item.price,
        assignedUsers: [],
      }))

      const store = useExpenseStore.getState()
      store.setReceiptItems(transformedItems)
      store.setTotalAmount(data.total || 0)
      store.setReceiptImageUrl(data.receipt_image_url || null)
      store.setTaxDetails({
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        cgst: data.cgst || 0,
        sgst: data.sgst || 0,
        serviceCharge: data.service_charge || 0,
        pricesIncludeTax: detectedTaxInclusive,
      })

      onUploaded()
    } catch (error) {
      console.error("Error scanning receipt:", error)
      const mockItems = [
        { id: "1", name: "Item 1", price: 25.50, assignedUsers: [] },
        { id: "2", name: "Item 2", price: 15.75, assignedUsers: [] },
      ]
      const store = useExpenseStore.getState()
      store.setReceiptItems(mockItems)
      store.setTotalAmount(41.25)
      store.setTaxDetails({
        subtotal: 41.25,
        tax: 0,
        cgst: 0,
        sgst: 0,
        serviceCharge: 0,
      })
      onUploaded()
    } finally {
      setIsUploading(false)
      setIsScanning(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setReceiptImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <Card className="relative border-2 border-black">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <img
              src={preview}
              alt="Receipt preview"
              className="h-full w-full object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mx-auto" />
                <p className="text-sm font-semibold">Scanning receipt...</p>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Button
          onClick={handleClick}
          className="h-44 w-full flex-col gap-2"
          variant="outline"
          disabled={isUploading}
        >
          <Camera className="h-12 w-12 text-muted-foreground" />
          <span className="text-lg font-medium">Take Photo or Upload Receipt</span>
          <span className="text-sm text-muted-foreground">Tap to capture or select image</span>
        </Button>
      )}
    </div>
  )
}

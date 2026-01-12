import { create } from "zustand"

export interface ReceiptItem {
  id: string
  name: string
  price: number
  assignedUsers: string[]
}

export interface ExpenseState {

  receiptImage: File | null
  receiptImageUrl: string | null
  receiptItems: ReceiptItem[]
  isScanning: boolean
  groupId: string | null
  paidBy: string | null
  totalAmount: number
  description: string
  subtotal: number
  tax: number
  cgst: number
  sgst: number
  serviceCharge: number
  pricesIncludeTax: boolean
  expenseId: string | null
  date: string | null

  setReceiptImage: (file: File | null) => void
  setReceiptImageUrl: (url: string | null) => void
  setReceiptItems: (items: ReceiptItem[]) => void
  updateReceiptItem: (id: string, updates: Partial<ReceiptItem>) => void
  assignUserToItem: (itemId: string, userId: string) => void
  unassignUserFromItem: (itemId: string, userId: string) => void
  setGroupId: (groupId: string) => void
  setPaidBy: (userId: string) => void
  setTotalAmount: (amount: number) => void
  setDescription: (description: string) => void
  setIsScanning: (isScanning: boolean) => void
  setTaxDetails: (details: { subtotal: number; tax: number; cgst: number; sgst: number; serviceCharge: number; pricesIncludeTax?: boolean }) => void
  setExpenseId: (id: string | null) => void
  setDate: (date: string | null) => void
  resetExpense: () => void
}

const initialReceiptItems: ReceiptItem[] = []

export const useExpenseStore = create<ExpenseState>((set) => ({
  receiptImage: null,
  receiptImageUrl: null,
  receiptItems: initialReceiptItems,
  isScanning: false,
  groupId: null,
  paidBy: null,
  totalAmount: 0,
  description: "",
  subtotal: 0,
  tax: 0,
  cgst: 0,
  sgst: 0,
  serviceCharge: 0,
  pricesIncludeTax: false,
  expenseId: null,
  date: null,

  setReceiptImage: (file) => set({ receiptImage: file }),
  setReceiptImageUrl: (url) => set({ receiptImageUrl: url }),

  setReceiptItems: (items) => set({ receiptItems: items }),

  updateReceiptItem: (id, updates) =>
    set((state) => ({
      receiptItems: state.receiptItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  assignUserToItem: (itemId, userId) =>
    set((state) => ({
      receiptItems: state.receiptItems.map((item) =>
        item.id === itemId && !item.assignedUsers.includes(userId)
          ? { ...item, assignedUsers: [...item.assignedUsers, userId] }
          : item
      ),
    })),

  unassignUserFromItem: (itemId, userId) =>
    set((state) => ({
      receiptItems: state.receiptItems.map((item) =>
        item.id === itemId
          ? { ...item, assignedUsers: item.assignedUsers.filter((id) => id !== userId) }
          : item
      ),
    })),

  setGroupId: (groupId) => set({ groupId }),
  setPaidBy: (paidBy) => set({ paidBy }),
  setTotalAmount: (totalAmount) => set({ totalAmount }),
  setDescription: (description) => set({ description }),
  setIsScanning: (isScanning) => set({ isScanning }),

  setTaxDetails: (details) => set({
    subtotal: details.subtotal,
    tax: details.tax,
    cgst: details.cgst,
    sgst: details.sgst,
    serviceCharge: details.serviceCharge,
    pricesIncludeTax: details.pricesIncludeTax ?? false,
  }),
  setExpenseId: (expenseId) => set({ expenseId }),
  setDate: (date) => set({ date }),

  resetExpense: () =>
    set({
      receiptImage: null,
      receiptImageUrl: null,
      receiptItems: initialReceiptItems,
      isScanning: false,
      groupId: null,
      paidBy: null,
      totalAmount: 0,
      description: "",
      subtotal: 0,
      tax: 0,
      cgst: 0,
      sgst: 0,
      serviceCharge: 0,
      pricesIncludeTax: false,
      expenseId: null,
      date: null,
    }),
}))

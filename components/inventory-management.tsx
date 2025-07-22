"use client"
import { useState, useEffect, useRef } from "react"
import {
  Package,
  Plus,
  Minus,
  ShoppingCart,
  TrendingUp,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Trash2,
  Save,
  X,
  AlertCircle,
  BarChart3,
  Eye,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import "jspdf-autotable"
import { DataManager } from "./data-manager"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface InventoryItem {
  id: string
  productId: string
  productName: string
  category: string
  unit: string
  openingStock: number
  purchases: number
  sales: number
  adjustments: number
  closingStock: number
  reorderLevel: number
  lastUpdated: string
  notes?: string
}

interface StockTransaction {
  id: string
  productId: string
  productName: string
  type: "opening" | "purchase" | "sale" | "adjustment"
  quantity: number
  date: string
  reference?: string
  notes?: string
  createdAt: string
}

interface TransactionItem {
  id: string
  name: string
  quantity: number
  unit: string
}

interface InventoryReport {
  id: string
  reportType: "closing_stock" | "stock_movement" | "low_stock" | "valuation"
  title: string
  dateRange: {
    start: string
    end: string
  }
  data: any[]
  generatedAt: string
  totalItems: number
  totalValue: number
}

const STORAGE_KEYS = {
  INVENTORY_ITEMS: "inventory_items",
  STOCK_TRANSACTIONS: "stock_transactions",
  INVENTORY_REPORTS: "inventory_reports",
}

export default function InventoryManagement() {
  // State management
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [superCategories, setSuperCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])

  // UI State
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "reports" | "settings">("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all")

  // Transaction UI State
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [transactionType, setTransactionType] = useState<"sale" | "purchase" | "adjustment">("purchase")
  const [currentView, setCurrentView] = useState<"super" | "sub" | "products">("super")
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([])
  const [transactionReference, setTransactionReference] = useState("")
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"))

  // Add edit mode state
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)

  // Dialog states
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showItemDetailsDialog, setShowItemDetailsDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Form states
  const [itemForm, setItemForm] = useState({
    productId: "",
    openingStock: 0,
    reorderLevel: 0,
    notes: "",
  })
  const [reportForm, setReportForm] = useState({
    type: "closing_stock" as "closing_stock" | "stock_movement" | "low_stock" | "valuation",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    categoryFilter: "all",
  })
  const [lastProcessedTransaction, setLastProcessedTransaction] = useState<any>(null)
  const [showTransactionReceipt, setShowTransactionReceipt] = useState(false)

  // Refs
  const reportRef = useRef<HTMLDivElement>(null)

  const PRINT_UTILITY_API_URL = process.env.NEXT_PUBLIC_PRINT_UTILITY_API_URL || "http://localhost:5000"
  const THERMAL_PRINTER = process.env.NEXT_PUBLIC_THERMAL_PRINTER || "Microsoft Print to PDF"
  const LAZER_PRINTER = process.env.NEXT_PUBLIC_LAZER_PRINTER || "Microsoft Print to PDF"

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Apply filters when data changes
  useEffect(() => {
    applyFilters()
  }, [inventoryItems, searchQuery, categoryFilter, stockFilter])

  // Add this useEffect after the existing useEffect for loading data
  useEffect(() => {
    // Listen for storage changes to sync data in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "products" || e.key === "sales" || e.key === "inventory_items" || e.key === "stock_transactions") {
        loadData()
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Helper function to get category name for a product
  const getCategoryNameForProduct = (productId: string): string => {
    const product = products.find((p) => p.id === productId)
    if (!product) return "Unknown"
    const subCategory = subCategories.find((sc) => sc.id === product.subCategoryId)
    if (!subCategory) return "Unknown"
    return subCategory.name
  }

  // Update the loadData function to sync with POS data and fix category mapping
  const loadData = () => {
    // Load inventory data
    const storedItems = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS)
    let currentInventoryItems: InventoryItem[] = []
    if (storedItems) {
      currentInventoryItems = JSON.parse(storedItems)
    }

    const storedTransactions = localStorage.getItem(STORAGE_KEYS.STOCK_TRANSACTIONS)
    if (storedTransactions) {
      setStockTransactions(JSON.parse(storedTransactions))
    }

    // Load products and categories from DataManager
    const productsData = DataManager.getProducts()
    const subCategoriesData = DataManager.getSubCategories()
    const superCategoriesData = DataManager.getSuperCategories()

    setProducts(productsData)
    setSubCategories(subCategoriesData)
    setSuperCategories(superCategoriesData)
    setCategories([...superCategoriesData, ...subCategoriesData])

    // Fix category mapping for existing inventory items
    const updatedInventoryItems = currentInventoryItems.map((item) => {
      if (item.category === "Unknown" || !item.category) {
        const product = productsData.find((p) => p.id === item.productId)
        if (product) {
          const subCategory = subCategoriesData.find((sc) => sc.id === product.subCategoryId)
          return {
            ...item,
            category: subCategory?.name || "Unknown",
            lastUpdated: new Date().toISOString(),
          }
        }
      }
      return item
    })

    // Save the updated inventory items with fixed categories
    if (JSON.stringify(updatedInventoryItems) !== JSON.stringify(currentInventoryItems)) {
      saveInventoryItems(updatedInventoryItems)
    } else {
      setInventoryItems(updatedInventoryItems)
    }

    // Sync inventory with POS data
    syncInventoryWithPOSData(productsData, updatedInventoryItems)
  }

  // Add this new function to sync inventory with POS data
  const syncInventoryWithPOSData = (productsData: any[], currentInventoryItems: InventoryItem[]) => {
    const sales = DataManager.getSales() // This line is not used, but kept from original code.

    // Create a map of existing inventory items
    const inventoryMap = new Map(currentInventoryItems.map((item) => [item.productId, item]))
    let hasChanges = false

    // Process each product to ensure it has inventory tracking
    for (const product of productsData) {
      if (!inventoryMap.has(product.id)) {
        // Create inventory item for products that don't have one
        const subCategory = subCategories.find((c) => c.id === product.subCategoryId)
        const newInventoryItem: InventoryItem = {
          id: generateId(),
          productId: product.id,
          productName: product.name,
          category: subCategory?.name || "Unknown",
          unit: product.unit,
          openingStock: product.stock,
          purchases: 0,
          sales: 0,
          adjustments: 0,
          closingStock: product.stock,
          reorderLevel: 10,
          lastUpdated: new Date().toISOString(),
          notes: "Auto-synced from POS",
        }
        currentInventoryItems.push(newInventoryItem)
        inventoryMap.set(product.id, newInventoryItem)
        hasChanges = true
      } else {
        // Update closing stock to match current product stock and fix category
        const inventoryItem = inventoryMap.get(product.id)
        if (inventoryItem) {
          let itemChanged = false
          // Fix category if it's unknown
          if (inventoryItem.category === "Unknown" || !inventoryItem.category) {
            const subCategory = subCategories.find((c) => c.id === product.subCategoryId)
            if (subCategory) {
              inventoryItem.category = subCategory.name
              itemChanged = true
            }
          }
          // Update stock if different
          if (inventoryItem.closingStock !== product.stock) {
            inventoryItem.closingStock = product.stock
            itemChanged = true
          }
          if (itemChanged) {
            inventoryItem.lastUpdated = new Date().toISOString()
            hasChanges = true
          }
        }
      }
    }

    // Save updated inventory if there were changes
    if (hasChanges) {
      DataManager.setInventoryItems(currentInventoryItems)
    }
    setInventoryItems(currentInventoryItems)
  }

  const saveInventoryItems = (items: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(items))
    DataManager.setInventoryItems(items)
    setInventoryItems(items)
  }

  const saveStockTransactions = (transactions: StockTransaction[]) => {
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions))
    DataManager.setStockTransactions(transactions)
    setStockTransactions(transactions)
  }

  const applyFilters = () => {
    let filtered = [...inventoryItems]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => item.productName.toLowerCase().includes(query))
    }

    // Category filter - now works with proper category names
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Stock level filter
    if (stockFilter === "low") {
      filtered = filtered.filter((item) => item.closingStock <= item.reorderLevel && item.closingStock > 0)
    } else if (stockFilter === "out") {
      filtered = filtered.filter((item) => item.closingStock <= 0)
    }

    // Sort by last updated date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.lastUpdated).getTime()
      const dateB = new Date(b.lastUpdated).getTime()
      return dateB - dateA
    })

    setFilteredItems(filtered)
  }

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Transaction handling functions
  const handleSuperCategorySelect = (categoryId: string) => {
    setSelectedSuperCategory(categoryId)
    setSelectedSubCategory("")
    setCurrentView("sub")
  }

  const handleSubCategorySelect = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId)
    setCurrentView("products")
  }

  const handleBackToSuper = () => {
    setCurrentView("super")
    setSelectedSuperCategory("")
    setSelectedSubCategory("")
  }

  const handleBackToSub = () => {
    setCurrentView("sub")
    setSelectedSubCategory("")
  }

  const addToTransaction = (product: any) => {
    const existingItem = transactionItems.find((item) => item.id === product.id)
    if (existingItem) {
      updateTransactionQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: TransactionItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit,
      }
      setTransactionItems([...transactionItems, newItem])
    }
  }

  const updateTransactionQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromTransaction(itemId)
      return
    }
    setTransactionItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)),
    )
  }

  const removeFromTransaction = (itemId: string) => {
    setTransactionItems((items) => items.filter((item) => item.id !== itemId))
  }

  const clearTransactionItems = () => {
    setTransactionItems([])
  }

  // Fixed processTransaction function to prevent duplicate transactions
  const processTransaction = async () => {
    if (transactionItems.length === 0) return

    try {
      if (editingTransactionId) {
        // Edit mode: update existing transaction
        const oldTransaction = stockTransactions.find((t) => t.id === editingTransactionId)
        if (!oldTransaction) {
          alert("Original transaction not found.")
          return
        }

        // Only support editing single-item transactions for now (as per UI)
        const item = transactionItems[0]
        const updatedTransaction: StockTransaction = {
          ...oldTransaction,
          productId: item.id,
          productName: item.name,
          type: transactionType,
          quantity: transactionType === "sale" ? -item.quantity : item.quantity,
          date: transactionDate,
          reference: transactionReference || `${transactionType.toUpperCase()}-${Date.now().toString().slice(-4)}`,
          notes: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction`,
          createdAt: oldTransaction.createdAt, // keep original createdAt
        }

        updateTransaction(editingTransactionId, updatedTransaction)

        // Update product stock in DataManager - calculate the net change
        const product = products.find((p) => p.id === item.id)
        if (product) {
          // Calculate net change from old to new transaction
          let oldEffect = 0
          let newEffect = 0

          if (oldTransaction.type === "purchase") oldEffect = Math.abs(oldTransaction.quantity)
          else if (oldTransaction.type === "sale") oldEffect = -Math.abs(oldTransaction.quantity)
          else if (oldTransaction.type === "adjustment") oldEffect = oldTransaction.quantity

          if (transactionType === "purchase") newEffect = item.quantity
          else if (transactionType === "sale") newEffect = -item.quantity
          else if (transactionType === "adjustment") newEffect = item.quantity

          const netChange = newEffect - oldEffect
          const newStock = Math.max(0, product.stock + netChange)

          await DataManager.updateProductStock(product.id, newStock)
        }

        // Refresh products data
        setProducts(DataManager.getProducts())

        // Set the transaction record and show receipt
        setLastProcessedTransaction({
          id: updatedTransaction.id,
          type: updatedTransaction.type,
          date: updatedTransaction.date,
          reference: updatedTransaction.reference,
          items: [
            {
              id: updatedTransaction.productId,
              name: updatedTransaction.productName,
              quantity: Math.abs(updatedTransaction.quantity),
              unit: product ? product.unit : "unit",
            },
          ],
          processedAt: updatedTransaction.createdAt,
          transactionNumber: `${updatedTransaction.type.toUpperCase()}-${format(new Date(updatedTransaction.date), "yyyyMMdd")}-${updatedTransaction.id.slice(-4)}`,
        })
        setShowTransactionReceipt(true)

        // Clear form and close dialog
        clearTransactionItems()
        setTransactionReference("")
        setTransactionDate(format(new Date(), "yyyy-MM-dd"))
        setCurrentView("super")
        setSelectedSuperCategory("")
        setSelectedSubCategory("")
        setShowTransactionDialog(false)
        setEditingTransactionId(null)
        return
      }

      const transactionRecord = {
        id: generateId(),
        type: transactionType,
        date: transactionDate,
        reference: transactionReference,
        items: [...transactionItems],
        processedAt: new Date().toISOString(),
        transactionNumber: `${transactionType.toUpperCase()}-${format(new Date(), "yyyyMMdd")}-${Date.now().toString().slice(-4)}`,
      }

      // Process each item in the transaction
      for (const item of transactionItems) {
        // Create stock transaction record
        const newTransaction: StockTransaction = {
          id: generateId(),
          productId: item.id,
          productName: item.name,
          type: transactionType,
          quantity: transactionType === "sale" ? -item.quantity : item.quantity,
          date: transactionDate,
          reference: transactionReference || `${transactionType.toUpperCase()}-${Date.now().toString().slice(-4)}`,
          notes: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction`,
          createdAt: new Date().toISOString(),
        }

        // Save stock transaction
        const updatedTransactions = [...stockTransactions, newTransaction]
        saveStockTransactions(updatedTransactions)

        // Update inventory item directly (without calling DataManager methods to avoid duplication)
        updateInventoryFromTransaction(newTransaction)

        // Update product stock in DataManager
        const product = products.find((p) => p.id === item.id)
        if (product) {
          let newStock = product.stock
          if (transactionType === "purchase") {
            newStock += item.quantity
          } else if (transactionType === "sale") {
            newStock = Math.max(0, newStock - item.quantity)
          } else if (transactionType === "adjustment") {
            newStock += item.quantity // Can be negative for adjustments
          }
          await DataManager.updateProductStock(product.id, Math.max(0, newStock))
        }
      }

      // Refresh products data
      setProducts(DataManager.getProducts())

      // Set the transaction record and show receipt
      setLastProcessedTransaction(transactionRecord)
      setShowTransactionReceipt(true)

      // Clear form and close dialog
      clearTransactionItems()
      setTransactionReference("")
      setTransactionDate(format(new Date(), "yyyy-MM-dd"))
      setCurrentView("super")
      setSelectedSuperCategory("")
      setSelectedSubCategory("")
      setShowTransactionDialog(false)
      setEditingTransactionId(null)
    } catch (error) {
      console.error("Error processing transaction:", error)
      alert("Error processing transaction. Please try again.")
    }
  }

  const handleAddInventoryItem = () => {
    if (!itemForm.productId) return
    const product = products.find((p) => p.id === itemForm.productId)
    if (!product) return
    const subCategory = subCategories.find((c) => c.id === product.subCategoryId)
    const categoryName = subCategory?.name || "Unknown"

    const newItem: InventoryItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      category: categoryName,
      unit: product.unit,
      openingStock: itemForm.openingStock,
      purchases: 0,
      sales: 0,
      adjustments: 0,
      closingStock: itemForm.openingStock,
      reorderLevel: itemForm.reorderLevel,
      lastUpdated: new Date().toISOString(),
      notes: itemForm.notes,
    }

    // Add opening stock transaction if > 0
    if (itemForm.openingStock > 0) {
      const openingTransaction: StockTransaction = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        type: "opening",
        quantity: itemForm.openingStock,
        date: format(new Date(), "yyyy-MM-dd"),
        reference: "Opening Stock",
        notes: "Initial opening stock entry",
        createdAt: new Date().toISOString(),
      }
      const updatedTransactions = [...stockTransactions, openingTransaction]
      saveStockTransactions(updatedTransactions)
    }

    const updatedItems = [...inventoryItems, newItem]
    saveInventoryItems(updatedItems)

    // Reset form
    setItemForm({
      productId: "",
      openingStock: 0,
      reorderLevel: 0,
      notes: "",
    })
    setShowAddItemDialog(false)
  }

  const updateInventoryFromTransaction = (transaction: StockTransaction) => {
    const updatedItems = inventoryItems.map((item) => {
      if (item.productId === transaction.productId) {
        const updatedItem = { ...item }
        switch (transaction.type) {
          case "purchase":
            updatedItem.purchases += Math.abs(transaction.quantity)
            updatedItem.closingStock += Math.abs(transaction.quantity)
            break
          case "sale":
            updatedItem.sales += Math.abs(transaction.quantity)
            updatedItem.closingStock -= Math.abs(transaction.quantity)
            break
          case "adjustment":
            updatedItem.adjustments += transaction.quantity
            updatedItem.closingStock += transaction.quantity
            break
        }
        updatedItem.lastUpdated = new Date().toISOString()
        return updatedItem
      }
      return item
    })
    saveInventoryItems(updatedItems)
  }

  const updateTransaction = (transactionId: string, updatedTransaction: StockTransaction) => {
    // Find the old transaction
    const oldTransaction = stockTransactions.find((t) => t.id === transactionId)
    if (!oldTransaction) return

    // First, reverse the old transaction effect on inventory
    const updatedItems = inventoryItems.map((item) => {
      if (item.productId === oldTransaction.productId) {
        const updatedItem = { ...item }

        // Reverse the old transaction
        switch (oldTransaction.type) {
          case "purchase":
            updatedItem.purchases -= Math.abs(oldTransaction.quantity)
            updatedItem.closingStock -= Math.abs(oldTransaction.quantity)
            break
          case "sale":
            updatedItem.sales -= Math.abs(oldTransaction.quantity)
            updatedItem.closingStock += Math.abs(oldTransaction.quantity)
            break
          case "adjustment":
            updatedItem.adjustments -= oldTransaction.quantity
            updatedItem.closingStock -= oldTransaction.quantity
            break
        }

        // Apply the new transaction
        switch (updatedTransaction.type) {
          case "purchase":
            updatedItem.purchases += Math.abs(updatedTransaction.quantity)
            updatedItem.closingStock += Math.abs(updatedTransaction.quantity)
            break
          case "sale":
            updatedItem.sales += Math.abs(updatedTransaction.quantity)
            updatedItem.closingStock -= Math.abs(updatedTransaction.quantity)
            break
          case "adjustment":
            updatedItem.adjustments += updatedTransaction.quantity
            updatedItem.closingStock += updatedTransaction.quantity
            break
        }

        updatedItem.lastUpdated = new Date().toISOString()
        return updatedItem
      }
      return item
    })

    // Save updated inventory
    saveInventoryItems(updatedItems)

    // Replace the transaction in the list
    const updatedTransactions = stockTransactions.map((t) => (t.id === transactionId ? updatedTransaction : t))
    saveStockTransactions(updatedTransactions)
  }

  const deleteInventoryItem = (itemId: string) => {
    const updatedItems = inventoryItems.filter((item) => item.id !== itemId)
    saveInventoryItems(updatedItems)

    // Also remove related transactions
    const updatedTransactions = stockTransactions.filter((t) => {
      const item = inventoryItems.find((i) => i.id === itemId)
      return item ? t.productId !== item.productId : true
    })
    saveStockTransactions(updatedTransactions)
  }

  const deleteTransaction = (transactionId: string) => {
    const transaction = stockTransactions.find((t) => t.id === transactionId)
    if (!transaction) return

    // Reverse the transaction effect on inventory
    const reverseTransaction = {
      ...transaction,
      quantity: -transaction.quantity,
    }
    updateInventoryFromTransaction(reverseTransaction)

    // Remove the transaction
    const updatedTransactions = stockTransactions.filter((t) => t.id !== transactionId)
    saveStockTransactions(updatedTransactions)
  }

  // Render functions for transaction interface
  const renderSuperCategories = () => {
    if (superCategories.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No super categories found.</p>
          <p className="text-sm">Please ensure data is loaded or add categories.</p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {superCategories.map((category) => (
          <Button
            key={category.id}
            onClick={() => handleSuperCategorySelect(category.id)}
            className="h-28 sm:h-32 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-900 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md p-2"
            variant="outline"
          >
            <div className="relative">
              {category.image ? (
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200"
                />
              ) : (
                <span className="text-xl sm:text-2xl">{category.icon}</span>
              )}
            </div>
            <span className="font-medium text-sm text-center px-1 leading-tight">{category.name}</span>
          </Button>
        ))}
      </div>
    )
  }

  const renderSubCategories = () => {
    const filteredSubCategories = subCategories.filter((sub) => sub.superCategoryId === selectedSuperCategory)
    if (filteredSubCategories.length === 0) {
      return (
        <div className="space-y-4">
          <Button
            onClick={handleBackToSuper}
            variant="outline"
            className="rounded-lg border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            ← Back to Categories
          </Button>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No subcategories found for this category.</p>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <Button
          onClick={handleBackToSuper}
          variant="outline"
          className="rounded-lg border-gray-300 hover:bg-gray-50 bg-transparent"
        >
          ← Back to Categories
        </Button>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSubCategories.map((subCategory) => (
            <Button
              key={subCategory.id}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              className="h-24 sm:h-28 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-900 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md p-2"
              variant="outline"
            >
              <div className="relative">
                {subCategory.image ? (
                  <img
                    src={subCategory.image || "/placeholder.svg"}
                    alt={subCategory.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <span className="text-xl sm:text-2xl">{subCategory.icon}</span>
                )}
              </div>
              <span className="font-medium text-sm text-center px-1 leading-tight">{subCategory.name}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    const filteredProducts = products.filter((prod) => prod.subCategoryId === selectedSubCategory)
    if (filteredProducts.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleBackToSub}
              variant="outline"
              className="rounded-lg border-gray-300 hover:bg-gray-50 text-xs bg-transparent"
            >
              ← Back to Subcategories
            </Button>
            <Button
              onClick={handleBackToSuper}
              variant="outline"
              className="rounded-lg border-gray-300 hover:bg-gray-50 text-xs bg-transparent"
            >
              ← Back to Categories
            </Button>
          </div>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products found in this subcategory.</p>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleBackToSub}
            variant="outline"
            className="rounded-lg border-gray-300 hover:bg-gray-50 text-xs bg-transparent"
          >
            ← Back to Subcategories
          </Button>
          <Button
            onClick={handleBackToSuper}
            variant="outline"
            className="rounded-lg border-gray-300 hover:bg-gray-50 text-xs bg-transparent"
          >
            ← Back to Categories
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    {product.image && (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <div className="text-sm text-gray-500">Unit: {product.unit}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => addToTransaction(product)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium shadow-sm text-sm py-2.5"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Generate report functions (simplified for inventory without prices)
  // ...existing code...
  const generateReport = () => {
    let reportData: any[] = []
    let title = ""
    const totalValue = 0

    // Parse date range
    const startDate = new Date(reportForm.startDate)
    const endDate = new Date(reportForm.endDate)
    endDate.setHours(23, 59, 59, 999) // include the whole end day

    // Helper: filter by category
    const filterByCategory = (item: InventoryItem) => {
      if (reportForm.categoryFilter === "all") return true
      return item.category === reportForm.categoryFilter
    }

    // Helper: filter by date (lastUpdated)
    const filterByDate = (item: InventoryItem) => {
      const updated = new Date(item.lastUpdated)
      return updated >= startDate && updated <= endDate
    }

    switch (reportForm.type) {
      case "closing_stock":
        title = "Closing Stock Report"
        reportData = inventoryItems
          .filter(filterByCategory)
          .filter(filterByDate)
          .map((item) => ({
            productName: item.productName,
            category: item.category,
            unit: item.unit,
            openingStock: item.openingStock,
            purchases: item.purchases,
            sales: item.sales,
            adjustments: item.adjustments,
            closingStock: item.closingStock,
            status: item.closingStock <= item.reorderLevel ? "Low Stock" : "Normal",
          }))
        break
      case "stock_movement":
        title = "Stock Movement Report"
        reportData = stockTransactions
          .filter((t) => {
            const transactionDate = new Date(t.date)
            return transactionDate >= startDate && transactionDate <= endDate
          })
          .filter((t) => {
            if (reportForm.categoryFilter !== "all") {
              const item = inventoryItems.find((item) => item.productId === t.productId)
              return item && item.category === reportForm.categoryFilter
            }
            return true
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((t) => ({
            date: t.date,
            productName: t.productName,
            type: t.type,
            quantity: t.quantity,
            reference: t.reference || "-",
            notes: t.notes || "-",
          }))
        break
      case "low_stock":
        title = "Low Stock Report"
        // Find items that are low stock as of now, but only include if their last transaction is in the date range
        reportData = inventoryItems
          .filter(filterByCategory)
          .filter((item) => item.closingStock <= item.reorderLevel)
          .filter((item) => {
            // Find last transaction for this item
            const lastTx = stockTransactions
              .filter((t) => t.productId === item.productId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            if (!lastTx) return false
            const txDate = new Date(lastTx.date)
            return txDate >= startDate && txDate <= endDate
          })
          .map((item) => ({
            productName: item.productName,
            category: item.category,
            currentStock: item.closingStock,
            reorderLevel: item.reorderLevel,
            shortage: item.reorderLevel - item.closingStock,
            lastUpdated: format(new Date(item.lastUpdated), "MMM dd, yyyy"),
          }))
        break
      case "valuation":
        title = "Inventory Valuation Report"
        reportData = inventoryItems
          .filter(filterByCategory)
          .filter(filterByDate)
          .map((item) => ({
            productName: item.productName,
            category: item.category,
            closingStock: item.closingStock,
          }))
        break
    }

    const report: InventoryReport = {
      id: generateId(),
      reportType: reportForm.type,
      title,
      dateRange: {
        start: reportForm.startDate,
        end: reportForm.endDate,
      },
      data: reportData,
      generatedAt: new Date().toISOString(),
      totalItems: reportData.length,
      totalValue,
    }
    return report
  }

  const printReport = (report: InventoryReport) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups for this site to enable printing")
      return
    }

    const printContent = generatePrintableReport(report)

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.focus()
          printWindow.print()

          // Close window after printing (with delay)
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close()
            }
          }, 1000)
        }
      }, 500)
    }

    // Fallback in case onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed && printWindow.document.readyState === "complete") {
        printWindow.focus()
        printWindow.print()

        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close()
          }
        }, 1000)
      }
    }, 1000)
  }

  const generatePrintableReport = (report: InventoryReport): string => {
    const currentDate = format(new Date(), "MMM dd, yyyy HH:mm")
    let tableHeaders = ""
    let tableRows = ""

    switch (report.reportType) {
      case "closing_stock":
        tableHeaders = `
        <tr>
          <th style="width: 25%;">Product Name</th>
          <th style="width: 15%;">Category</th>
          <th style="width: 8%;">Unit</th>
          <th style="width: 10%;">Opening</th>
          <th style="width: 10%;">Purchases</th>
          <th style="width: 8%;">Sales</th>
          <th style="width: 10%;">Adjustments</th>
          <th style="width: 8%;">Closing</th>
          <th style="width: 6%;">Status</th>
        </tr>
      `
        tableRows = report.data
          .map(
            (item) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.category}</td>
          <td>${item.unit}</td>
          <td class="text-center">${item.openingStock}</td>
          <td class="text-center">${item.purchases}</td>
          <td class="text-center">${item.sales}</td>
          <td class="text-center">${item.adjustments}</td>
          <td class="text-center">${item.closingStock}</td>
          <td class="text-center">${item.status}</td>
        </tr>
      `,
          )
          .join("")
        break
      case "stock_movement":
        tableHeaders = `
        <tr>
          <th style="width: 12%;">Date</th>
          <th style="width: 35%;">Product Name</th>
          <th style="width: 12%;">Type</th>
          <th style="width: 12%;">Quantity</th>
          <th style="width: 29%;">Reference</th>
        </tr>
      `
        tableRows = report.data
          .map(
            (item) => `
        <tr>
          <td>${format(new Date(item.date), "MMM dd, yyyy")}</td>
          <td>${item.productName}</td>
          <td class="text-center">${item.type.toUpperCase()}</td>
          <td class="text-center">${item.quantity}</td>
          <td>${item.reference || "-"}</td>
        </tr>
      `,
          )
          .join("")
        break
      case "low_stock":
        tableHeaders = `
        <tr>
          <th style="width: 30%;">Product Name</th>
          <th style="width: 20%;">Category</th>
          <th style="width: 12%;">Current Stock</th>
          <th style="width: 12%;">Reorder Level</th>
          <th style="width: 10%;">Shortage</th>
          <th style="width: 16%;">Last Updated</th>
        </tr>
      `
        tableRows = report.data
          .map(
            (item) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.category}</td>
          <td class="text-center">${item.currentStock}</td>
          <td class="text-center">${item.reorderLevel}</td>
          <td class="text-center">${item.shortage}</td>
          <td class="text-center">${item.lastUpdated}</td>
        </tr>
      `,
          )
          .join("")
        break
      case "valuation":
        tableHeaders = `
        <tr>
          <th style="width: 50%;">Product Name</th>
          <th style="width: 30%;">Category</th>
          <th style="width: 20%;">Closing Stock</th>
        </tr>
      `
        tableRows = report.data
          .map(
            (item) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.category}</td>
          <td class="text-center">${item.closingStock}</td>
        </tr>
      `,
          )
          .join("")
        break
    }

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${report.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            padding: 8mm;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
          }
          .company-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
          .report-title { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
          .report-info { font-size: 9px; color: #666; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 9px;
          }
          th, td {
            border: 1px solid #000;
            padding: 2px 3px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .text-center { text-align: center; }

          .summary {
            margin-top: 8px;
            padding: 6px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            font-size: 9px;
          }
          .summary-item {
            display: inline-block;
            margin-right: 20px;
          }

          @media print {
            body { margin: 0; padding: 8mm; }
            .no-print { display: none; }
            @page {
              size: A4;
              margin: 8mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">SNS</div>
          <div class="report-title">${report.title}</div>
          <div class="report-info">
            Generated on: ${currentDate} |
            Period: ${format(new Date(report.dateRange.start), "MMM dd, yyyy")} to ${format(new Date(report.dateRange.end), "MMM dd, yyyy")}
          </div>
        </div>
        <table>
          <thead>
            ${tableHeaders}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-item"><strong>Total Items:</strong> ${report.totalItems}</div>
          <div class="summary-item"><strong>Generated At:</strong> ${currentDate}</div>
        </div>
      </body>
    </html>
  `
  }

  const printTransactionReceipt = (transaction: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups for this site to enable printing")
      return
    }

    const printContent = generateTransactionReceiptHTML(transaction)

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.focus()
          printWindow.print()

          // Close window after printing (with delay)
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close()
            }
          }, 1000)
        }
      }, 500)
    }

    // Fallback in case onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed && printWindow.document.readyState === "complete") {
        printWindow.focus()
        printWindow.print()

        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close()
          }
        }, 1000)
      }
    }, 1000)
  }

  const generateThermalTransactionReceiptText = (transaction: any): string => {
    const currentDate = format(new Date(), "MMM dd, yyyy HH:mm")
    const line = "-".repeat(32)
    const doubleLine = "=".repeat(32)

    let text = ""
    text += center("SNS") + "\n"
    text += center("Jodbhavi peth, Solapur") + "\n"
    text += center("Ph: 8668749859") + "\n"
    text += doubleLine + "\n"
    text += center(`${transaction.type.toUpperCase()} RECEIPT`) + "\n"
    text += line + "\n"

    text += `Receipt No: ${transaction.transactionNumber}\n`
    text += `Date: ${transaction.date}\n`
    text += `Time: ${format(new Date(transaction.processedAt), "HH:mm:ss")}\n`
    if (transaction.reference) {
      text += `Reference: ${transaction.reference}\n`
    }
    text += line + "\n"

    text += leftRight("Item", "Qty") + "\n"
    text += line + "\n"

    transaction.items.forEach((item: any) => {
      text += `${item.name}\n`
      text += leftRight("", `${item.quantity} ${item.unit}`) + "\n"
    })
    text += line + "\n"

    const totalQuantity = transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    text += leftRight("Total Items:", transaction.items.length.toString()) + "\n"
    text += leftRight("Total Quantity:", totalQuantity.toString()) + "\n"
    text += doubleLine + "\n"

    text += center("Thank you for your business!") + "\n"
    text += center("This is a computer generated receipt.") + "\n"
    text += center(currentDate) + "\n"

    return text

    function center(str: string): string {
      const padding = Math.max(0, Math.floor((32 - str.length) / 2))
      return " ".repeat(padding) + str
    }

    function leftRight(left: string, right: string): string {
      const space = " ".repeat(Math.max(0, 32 - left.length - right.length))
      return left + space + right
    }
  }

  const printThermalTransactionReceipt = (transaction: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups for this site to enable printing")
      return
    }

    const textContent = generateThermalTransactionReceiptText(transaction)

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Thermal Receipt - ${transaction.transactionNumber}</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            white-space: pre-wrap;
            padding: 5mm;
          }
          @media print {
            body { margin: 0; padding: 2mm; }
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
          }
        </style>
      </head>
      <body>${textContent}</body>
    </html>
  `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.focus()
          printWindow.print()

          // Close window after printing (with delay)
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close()
            }
          }, 1000)
        }
      }, 500)
    }

    // Fallback in case onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed && printWindow.document.readyState === "complete") {
        printWindow.focus()
        printWindow.print()

        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close()
          }
        }, 1000)
      }
    }, 1000)
  }

  const generateTransactionReceiptHTML = (transaction: any): string => {
    const currentDate = format(new Date(), "MMM dd, yyyy HH:mm")
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${transaction.type.toUpperCase()} Receipt - ${transaction.transactionNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            padding: 8mm;
          }
          .receipt { max-width: 100%; }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .company-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
          .company-details { font-size: 9px; margin-bottom: 2px; }
          .receipt-title { font-size: 14px; font-weight: bold; margin-top: 4px; }

          .receipt-info {
            margin-bottom: 8px;
            font-size: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .info-label { font-weight: bold; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #000;
            padding: 3px 4px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 9px;
            text-align: center;
          }
          .text-center { text-align: center; }

          .summary {
            margin-top: 8px;
            padding: 6px;
            background-color: #f9f9f9;
            border: 1px solid #000;
            font-size: 10px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }

          .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 9px;
            border-top: 1px solid #000;
            padding-top: 6px;
          }

          @media print {
            body { margin: 0; padding: 8mm; }
            .no-print { display: none; }
            @page {
              size: A4;
              margin: 8mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">SNS</div>
            <div class="company-details">Jodbhavi peth, Solapur | Ph: 8668749859</div>
            <div class="receipt-title">${transaction.type.toUpperCase()} RECEIPT</div>
          </div>

          <div class="receipt-info">
            <div class="info-row">
              <span class="info-label">Receipt No:</span>
              <span>${transaction.transactionNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${transaction.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span>${format(new Date(transaction.processedAt), "HH:mm:ss")}</span>
            </div>
            ${transaction.reference
        ? `
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span>${transaction.reference}</span>
              </div>
            `
        : ""
      }
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 60%;">Particulars</th>
                <th style="width: 16%;">QTY</th>
                <th style="width: 16%;">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${transaction.items
        .map(
          (item: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.name}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.unit}</td>
                </tr>
              `,
        )
        .join("")}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span><strong>Transaction Type:</strong></span>
              <span>${transaction.type.toUpperCase()}</span>
            </div>
            <div class="summary-row">
              <span><strong>Total Items:</strong></span>
              <span>${transaction.items.length}</span>
            </div>
            <div class="summary-row">
              <span><strong>Total Quantity:</strong></span>
              <span>${transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</span>
            </div>
          </div>

          <div class="footer">
            <div>Thank you for your business!</div>
            <div>This is a computer generated receipt.</div>
            <div style="margin-top: 4px;">${currentDate}</div>
          </div>
        </div>
      </body>
    </html>
  `
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.closingStock <= 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (item.closingStock <= item.reorderLevel) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { status: "In Stock", color: "bg-green-100 text-green-800" }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate summary statistics
  const totalItems = inventoryItems.length
  const totalStockValue = 0 // No pricing in inventory
  const lowStockItems = inventoryItems.filter((item) => item.closingStock <= item.reorderLevel).length
  const outOfStockItems = inventoryItems.filter((item) => item.closingStock <= 0).length

  // Get unique categories for filter dropdown (excluding "Unknown")
  const uniqueCategories = Array.from(new Set(inventoryItems.map((item) => item.category)))
    .filter((category) => category && category !== "Unknown")
    .sort()

  return (
    <div className="min-h-screen bg-white relative">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative z-10 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Inventory Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage stock levels, track movements, and generate reports
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Button
              onClick={() => {
                setTransactionType("purchase")
                setShowTransactionDialog(true)
              }}
              variant="outline"
              className="rounded-[9px]"
            >
              <Package className="w-4 h-4 mr-2" />
              Purchase
            </Button>
            <Button
              onClick={() => {
                setTransactionType("sale")
                setShowTransactionDialog(true)
              }}
              variant="outline"
              className="rounded-[9px]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Sale
            </Button>
            <Button
              onClick={() => {
                setTransactionType("adjustment")
                setShowTransactionDialog(true)
              }}
              variant="outline"
              className="rounded-[9px]"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Adjust
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-[11px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[11px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[11px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[11px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
                </div>
                <X className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Filters */}
            <Card className="rounded-[11px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Search Products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by product name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-[9px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="rounded-[9px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock Level</Label>
                    <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
                      <SelectTrigger className="rounded-[9px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                        <SelectItem value="out">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Items */}
            <Card className="rounded-[11px]">
              <CardHeader>
                <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item)
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                            <div>
                              <h3 className="font-medium">{item.productName}</h3>
                              <p className="text-sm text-gray-600">{item.category}</p>
                            </div>
                            <Badge className={`text-xs ${stockStatus.color}`}>{stockStatus.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Opening:</span> {item.openingStock} {item.unit}
                            </div>
                            <div>
                              <span className="text-gray-500">Purchases:</span> {item.purchases} {item.unit}
                            </div>
                            <div>
                              <span className="text-gray-500">Sales:</span> {item.sales} {item.unit}
                            </div>
                            <div>
                              <span className="text-gray-500">Closing:</span>{" "}
                              <span className="font-medium">
                                {item.closingStock} {item.unit}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Last updated: {format(new Date(item.lastUpdated), "MMM dd, yyyy HH:mm")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowItemDetailsDialog(true)
                            }}
                            className="rounded-[9px]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteInventoryItem(item.id)}
                            className="rounded-[9px] text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No inventory items found</p>
                      <p className="text-sm">Add items to start managing your inventory</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="rounded-[11px]">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stockTransactions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 50)
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge
                              variant={
                                transaction.type === "purchase"
                                  ? "default"
                                  : transaction.type === "sale"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs mr-2"
                            >
                              {transaction.type.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{transaction.productName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span>{format(new Date(transaction.date), "MMM dd, yyyy")}</span>
                            <span className="mx-2">•</span>
                            <span>Qty: {Math.abs(transaction.quantity)}</span>
                            {transaction.reference && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Ref: {transaction.reference}</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Create a transaction record for reprinting
                              const transactionRecord = {
                                id: transaction.id,
                                type: transaction.type,
                                date: transaction.date,
                                reference: transaction.reference,
                                items: [
                                  {
                                    id: transaction.productId,
                                    name: transaction.productName,
                                    quantity: Math.abs(transaction.quantity),
                                    unit: "unit", // Default unit
                                  },
                                ],
                                processedAt: transaction.createdAt,
                                transactionNumber: `${transaction.type.toUpperCase()}-${format(new Date(transaction.date), "yyyyMMdd")}-${transaction.id.slice(-4)}`,
                              }
                              setLastProcessedTransaction(transactionRecord)
                              setShowTransactionReceipt(true)
                            }}
                            className="rounded-[9px]"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Find the product and add to transaction for editing
                              const product = products.find((p) => p.id === transaction.productId)
                              if (product) {
                                setTransactionType(transaction.type as "sale" | "purchase" | "adjustment")
                                setTransactionItems([
                                  {
                                    id: product.id,
                                    name: product.name,
                                    quantity: Math.abs(transaction.quantity),
                                    unit: product.unit,
                                  },
                                ])
                                setTransactionReference(transaction.reference || "")
                                setTransactionDate(transaction.date)
                                setShowTransactionDialog(true)
                                setEditingTransactionId(transaction.id) // Set edit mode
                              }
                            }}
                            className="rounded-[9px]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTransaction(transaction.id)}
                            className="rounded-[9px] text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {stockTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                      <p className="text-sm">Add transactions to track stock movements</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="rounded-[11px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generate Reports
                </CardTitle>
                <CardDescription>Create detailed inventory reports for analysis and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Report Type</Label>
                      <Select
                        value={reportForm.type}
                        onValueChange={(value: any) => setReportForm({ ...reportForm, type: value })}
                      >
                        <SelectTrigger className="rounded-[9px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="closing_stock">Closing Stock Report</SelectItem>
                          <SelectItem value="stock_movement">Stock Movement Report</SelectItem>
                          <SelectItem value="low_stock">Low Stock Report</SelectItem>
                          <SelectItem value="valuation">Inventory Valuation Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={reportForm.startDate}
                          onChange={(e) => setReportForm({ ...reportForm, startDate: e.target.value })}
                          className="rounded-[9px]"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={reportForm.endDate}
                          onChange={(e) => setReportForm({ ...reportForm, endDate: e.target.value })}
                          className="rounded-[9px]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Category Filter</Label>
                      <Select
                        value={reportForm.categoryFilter}
                        onValueChange={(value) => setReportForm({ ...reportForm, categoryFilter: value })}
                      >
                        <SelectTrigger className="rounded-[9px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {uniqueCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-[9px]">
                      <h3 className="font-medium mb-2">Report Preview</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Type:</strong> {reportForm.type.replace("_", " ").toUpperCase()}
                        </p>
                        <p>
                          <strong>Period:</strong> {reportForm.startDate} to {reportForm.endDate}
                        </p>
                        <p>
                          <strong>Items:</strong> {filteredItems.length} products
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          const report = generateReport()
                          setShowReportDialog(true)
                            ; (window as any).currentReport = report // Store the generated report for viewing
                        }}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            const report = generateReport()
                            printReport(report)
                          }}
                          variant="outline"
                          className="rounded-[9px]"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="rounded-[11px]">
              <CardHeader>
                <CardTitle>Inventory Settings</CardTitle>
                <CardDescription>Configure inventory management preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Data Management</AlertTitle>
                  <AlertDescription>
                    Inventory data is stored locally in your browser. Make sure to backup your data regularly.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      const data = {
                        inventoryItems,
                        stockTransactions,
                        exportedAt: new Date().toISOString(),
                      }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `inventory_backup_${format(new Date(), "yyyy-MM-dd")}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    variant="outline"
                    className="rounded-[9px]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Inventory Data
                  </Button>
                  <div>
                    <Label>Import Inventory Data</Label>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            try {
                              const data = JSON.parse(event.target?.result as string)
                              if (data.inventoryItems) {
                                saveInventoryItems(data.inventoryItems)
                              }
                              if (data.stockTransactions) {
                                saveStockTransactions(data.stockTransactions)
                              }
                              alert("Data imported successfully!")
                            } catch (error) {
                              alert("Error importing data. Please check the file format.")
                            }
                          }
                          reader.readAsText(file)
                        }
                      }}
                      className="rounded-[9px]"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all inventory data? This action cannot be undone.")) {
                        localStorage.removeItem(STORAGE_KEYS.INVENTORY_ITEMS)
                        localStorage.removeItem(STORAGE_KEYS.STOCK_TRANSACTIONS)
                        setInventoryItems([])
                        setStockTransactions([])
                        alert("All inventory data has been cleared.")
                      }
                    }}
                    variant="destructive"
                    className="rounded-[9px]"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                  <Button
                    onClick={() => {
                      // Fix all unknown categories
                      const updatedItems = inventoryItems.map((item) => {
                        if (item.category === "Unknown" || !item.category) {
                          const categoryName = getCategoryNameForProduct(item.productId)
                          return {
                            ...item,
                            category: categoryName,
                            lastUpdated: new Date().toISOString(),
                          }
                        }
                        return item
                      })
                      saveInventoryItems(updatedItems)
                      alert("Category mapping has been fixed for all items!")
                    }}
                    variant="outline"
                    className="rounded-[9px]"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Fix Category Mapping
                  </Button>
                  <Button
                    onClick={() => {
                      // Remove duplicate transactions
                      const uniqueTransactions = stockTransactions.filter((transaction, index, self) => {
                        return (
                          index ===
                          self.findIndex(
                            (t) =>
                              t.productId === transaction.productId &&
                              t.type === transaction.type &&
                              t.quantity === transaction.quantity &&
                              t.date === transaction.date &&
                              Math.abs(new Date(t.createdAt).getTime() - new Date(transaction.createdAt).getTime()) <
                              1000,
                          )
                        )
                      })
                      if (uniqueTransactions.length !== stockTransactions.length) {
                        saveStockTransactions(uniqueTransactions)
                        // Recalculate inventory based on unique transactions
                        const recalculatedItems = inventoryItems.map((item) => {
                          const itemTransactions = uniqueTransactions.filter((t) => t.productId === item.productId)
                          let purchases = 0
                          let sales = 0
                          let adjustments = 0
                          itemTransactions.forEach((t) => {
                            switch (t.type) {
                              case "purchase":
                                purchases += Math.abs(t.quantity)
                                break
                              case "sale":
                                sales += Math.abs(t.quantity)
                                break
                              case "adjustment":
                                adjustments += t.quantity
                                break
                            }
                          })
                          return {
                            ...item,
                            purchases,
                            sales,
                            adjustments,
                            closingStock: item.openingStock + purchases - sales + adjustments,
                            lastUpdated: new Date().toISOString(),
                          }
                        })
                        saveInventoryItems(recalculatedItems)
                        alert(
                          `Removed ${stockTransactions.length - uniqueTransactions.length} duplicate transactions and recalculated inventory!`,
                        )
                      } else {
                        alert("No duplicate transactions found.")
                      }
                    }}
                    variant="outline"
                    className="rounded-[9px]"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Fix Duplicate Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Dialog - Responsive */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-7xl max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Transaction</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-auto">
            {" "}
            {/* Changed to flex-col and h-auto */}
            {/* Product Selection - Top Section */}
            <div className="flex-1 overflow-y-auto p-4">
              {" "}
              {/* Removed h-[80vh] */}
              {currentView === "super" && renderSuperCategories()}
              {currentView === "sub" && renderSubCategories()}
              {currentView === "products" && renderProducts()}
            </div>
            {/* Transaction Items - Bottom Section */}
            <div className="w-full border-t border-gray-200 flex flex-col bg-gray-50">
              {" "}
              {/* Changed to w-full and border-t only */}
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium text-base">
                  {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Items
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {" "}
                {/* Removed h-[80vh] */}
                {transactionItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items selected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactionItems.map((item) => (
                      <Card key={item.id} className="rounded-lg border-gray-200">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTransactionQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 p-0 rounded-lg"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateTransactionQuantity(item.id, Number.parseInt(e.target.value) || 0)
                                }
                                className="w-14 h-7 text-center rounded-lg border-gray-300 text-xs"
                                min="1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTransactionQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 p-0 rounded-lg"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                Total: {item.quantity} {item.unit}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromTransaction(item.id)}
                                className="w-6 h-6 p-0 rounded-lg text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              {/* Transaction Summary */}
              <div className="border-t border-gray-200 p-3 space-y-3">
                <div>
                  <Label className="text-xs">Reference (Optional)</Label>
                  <Input
                    placeholder="Reference number or note"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="rounded-lg border-gray-300 text-xs h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Transaction Date</Label>
                  <Input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="rounded-lg border-gray-300 text-xs h-8"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border">
                  <div className="text-sm font-bold">Total Items: {transactionItems.length}</div>
                  <div className="text-xs text-gray-600">
                    Total Quantity: {transactionItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={clearTransactionItems}
                    variant="outline"
                    className="w-full rounded-lg text-xs h-8 bg-transparent"
                    disabled={transactionItems.length === 0}
                  >
                    Clear Items
                  </Button>
                  <Button
                    onClick={processTransaction}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-xs h-8"
                    disabled={transactionItems.length === 0}
                  >
                    Process {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Add a new product to your inventory with opening stock</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select
                value={itemForm.productId}
                onValueChange={(value) => setItemForm({ ...itemForm, productId: value })}
              >
                <SelectTrigger className="rounded-[9px]">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((product) => !inventoryItems.some((item) => item.productId === product.id))
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.unit})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Opening Stock</Label>
                <Input
                  type="number"
                  value={itemForm.openingStock}
                  onChange={(e) => setItemForm({ ...itemForm, openingStock: Number.parseInt(e.target.value) || 0 })}
                  className="rounded-[9px]"
                  min="0"
                />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={itemForm.reorderLevel}
                  onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number.parseInt(e.target.value) || 0 })}
                  className="rounded-[9px]"
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                className="rounded-[9px]"
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddInventoryItem}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={!itemForm.productId}
              >
                <Save className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              <Button
                onClick={() => {
                  setItemForm({ productId: "", openingStock: 0, reorderLevel: 0, notes: "" })
                  setShowAddItemDialog(false)
                }}
                variant="outline"
                className="rounded-[9px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Details Dialog */}
      <Dialog open={showItemDetailsDialog} onOpenChange={setShowItemDetailsDialog}>
        <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details - {selectedItem?.productName}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{selectedItem.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Unit</Label>
                  <p className="text-sm">{selectedItem.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Opening Stock</Label>
                  <p className="text-sm">
                    {selectedItem.openingStock} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reorder Level</Label>
                  <p className="text-sm">
                    {selectedItem.reorderLevel} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Purchases</Label>
                  <p className="text-sm">
                    {selectedItem.purchases} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Sales</Label>
                  <p className="text-sm">
                    {selectedItem.sales} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Adjustments</Label>
                  <p className="text-sm">
                    {selectedItem.adjustments} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Stock</Label>
                  <p className="text-sm font-bold">
                    {selectedItem.closingStock} {selectedItem.unit}
                  </p>
                </div>
              </div>
              {selectedItem.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Recent Transactions</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {stockTransactions
                    .filter((t) => t.productId === selectedItem.productId)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-[9px]"
                      >
                        <div>
                          <Badge
                            variant={
                              transaction.type === "purchase"
                                ? "default"
                                : transaction.type === "sale"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs mr-2"
                          >
                            {transaction.type.toUpperCase()}
                          </Badge>
                          <span className="text-sm">
                            {Math.abs(transaction.quantity)} {selectedItem.unit}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{format(new Date(transaction.date), "MMM dd")}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <span>Generated Report</span>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button
                  onClick={() => {
                    if ((window as any).currentReport) {
                      printReport((window as any).currentReport)
                    }
                  }}
                  variant="outline"
                  className="rounded-[9px]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div ref={reportRef} className="p-4">
            {(window as any).currentReport ? (
              <div dangerouslySetInnerHTML={{ __html: generatePrintableReport((window as any).currentReport) }} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No report generated</p>
                <p className="text-sm">Generate a report to view it here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Receipt Dialog */}
      <Dialog open={showTransactionReceipt} onOpenChange={setShowTransactionReceipt}>
        <DialogContent className="max-w-full sm:max-w-lg md:max-w-xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
            <DialogDescription>View and print the transaction receipt</DialogDescription>
          </DialogHeader>
          {lastProcessedTransaction && (
            <div className="space-y-4">
              <div dangerouslySetInnerHTML={{ __html: generateTransactionReceiptHTML(lastProcessedTransaction) }} />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  onClick={() => printTransactionReceipt(lastProcessedTransaction)}
                  variant="outline"
                  className="rounded-[9px]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  onClick={() => printThermalTransactionReceipt(lastProcessedTransaction)}
                  variant="outline"
                  className="rounded-[9px]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Thermal Receipt
                </Button>
                <Button onClick={() => setShowTransactionReceipt(false)} variant="secondary" className="rounded-[9px]">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

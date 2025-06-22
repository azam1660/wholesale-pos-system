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
import jsPDF from "jspdf"
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

  // Update the loadData function to sync with POS data
  const loadData = () => {
    // Load inventory data
    const storedItems = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS)
    if (storedItems) {
      setInventoryItems(JSON.parse(storedItems))
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

    // Sync inventory with POS data
    syncInventoryWithPOSData(productsData)
  }

  // Add this new function to sync inventory with POS data
  const syncInventoryWithPOSData = (productsData: any[]) => {
    const sales = DataManager.getSales()
    const currentInventoryItems = DataManager.getInventoryItems()
    const currentStockTransactions = DataManager.getStockTransactions()

    // Create a map of existing inventory items
    const inventoryMap = new Map(currentInventoryItems.map((item) => [item.productId, item]))

    // Process each product to ensure it has inventory tracking
    for (const product of productsData) {
      if (!inventoryMap.has(product.id)) {
        // Create inventory item for products that don't have one
        const subCategory = subCategories.find((c) => c.id === product.subCategoryId)
        const newInventoryItem = {
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
      } else {
        // Update closing stock to match current product stock
        const inventoryItem = inventoryMap.get(product.id)
        if (inventoryItem && inventoryItem.closingStock !== product.stock) {
          inventoryItem.closingStock = product.stock
          inventoryItem.lastUpdated = new Date().toISOString()
        }
      }
    }

    // Save updated inventory
    DataManager.setInventoryItems(currentInventoryItems)
    setInventoryItems(currentInventoryItems)
  }

  const saveInventoryItems = (items: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(items))
    setInventoryItems(items)
  }

  const saveStockTransactions = (transactions: StockTransaction[]) => {
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions))
    setStockTransactions(transactions)
  }

  const applyFilters = () => {
    let filtered = [...inventoryItems]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => item.productName.toLowerCase().includes(query))
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Stock level filter
    if (stockFilter === "low") {
      filtered = filtered.filter((item) => item.closingStock <= item.reorderLevel && item.closingStock > 0)
    } else if (stockFilter === "out") {
      filtered = filtered.filter((item) => item.closingStock <= 0)
    }

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

  // Update the processTransaction function to sync with DataManager
  const processTransaction = async () => {
    if (transactionItems.length === 0) return

    try {
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
        const newTransaction: StockTransaction = {
          id: generateId(),
          productId: item.id,
          productName: item.name,
          type: transactionType,
          quantity: transactionType === "sale" ? -item.quantity : item.quantity,
          date: transactionDate,
          reference: transactionReference,
          notes: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction`,
          createdAt: new Date().toISOString(),
        }

        const updatedTransactions = [...stockTransactions, newTransaction]
        saveStockTransactions(updatedTransactions)

        // Update inventory item
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

      // Update DataManager inventory if it's a purchase
      if (transactionType === "purchase") {
        DataManager.updateInventoryFromPurchase(
          transactionItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            productName: item.name,
            unit: item.unit,
            reference: transactionReference,
          })),
        )
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
  const renderSuperCategories = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {superCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleSuperCategorySelect(category.id)}
          className="h-20 sm:h-24 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-900 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md p-2"
          variant="outline"
        >
          <div className="relative">
            {category.image ? (
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <span className="text-lg sm:text-xl">{category.icon}</span>
            )}
          </div>
          <span className="font-medium text-xs text-center px-1 leading-tight">{category.name}</span>
        </Button>
      ))}
    </div>
  )

  const renderSubCategories = () => {
    const filteredSubCategories = subCategories.filter((sub) => sub.superCategoryId === selectedSuperCategory)
    return (
      <div className="space-y-4">
        <Button onClick={handleBackToSuper} variant="outline" className="rounded-lg border-gray-300 hover:bg-gray-50">
          ← Back to Categories
        </Button>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSubCategories.map((subCategory) => (
            <Button
              key={subCategory.id}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              className="h-18 sm:h-20 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-900 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md p-2"
              variant="outline"
            >
              <div className="relative">
                {subCategory.image ? (
                  <img
                    src={subCategory.image || "/placeholder.svg"}
                    alt={subCategory.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <span className="text-lg sm:text-xl">{subCategory.icon}</span>
                )}
              </div>
              <span className="font-medium text-xs text-center px-1 leading-tight">{subCategory.name}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    const filteredProducts = products.filter((prod) => prod.subCategoryId === selectedSubCategory)
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleBackToSub}
            variant="outline"
            className="rounded-lg border-gray-300 hover:bg-gray-50 text-xs"
          >
            ← Back to Subcategories
          </Button>
          <Button
            onClick={handleBackToSuper}
            variant="outline"
            className="rounded-lg border-gray-300 hover:bg-gray-50 text-xs"
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
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <div className="text-xs text-gray-500">Unit: {product.unit}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => addToTransaction(product)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium shadow-sm text-xs py-2"
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
  const generateReport = () => {
    let reportData: any[] = []
    let title = ""
    const totalValue = 0

    const startDate = new Date(reportForm.startDate)
    const endDate = new Date(reportForm.endDate)

    switch (reportForm.type) {
      case "closing_stock":
        title = "Closing Stock Report"
        reportData = filteredItems.map((item) => ({
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
          .map((t) => ({
            date: t.date,
            productName: t.productName,
            type: t.type,
            quantity: t.quantity,
            reference: t.reference,
            notes: t.notes,
          }))
        break

      case "low_stock":
        title = "Low Stock Report"
        reportData = filteredItems
          .filter((item) => item.closingStock <= item.reorderLevel)
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
        reportData = filteredItems.map((item) => ({
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
    if (!printWindow) return

    const printContent = generatePrintableReport(report)
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const generatePrintableReport = (report: InventoryReport): string => {
    const currentDate = format(new Date(), "MMM dd, yyyy HH:mm")

    let tableHeaders = ""
    let tableRows = ""

    switch (report.reportType) {
      case "closing_stock":
        tableHeaders = `
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Opening</th>
            <th>Purchases</th>
            <th>Sales</th>
            <th>Adjustments</th>
            <th>Closing</th>
            <th>Status</th>
          </tr>
        `
        tableRows = report.data
          .map(
            (item) => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.category}</td>
            <td>${item.unit}</td>
            <td>${item.openingStock}</td>
            <td>${item.purchases}</td>
            <td>${item.sales}</td>
            <td>${item.adjustments}</td>
            <td>${item.closingStock}</td>
            <td>${item.status}</td>
          </tr>
        `,
          )
          .join("")
        break

      case "stock_movement":
        tableHeaders = `
          <tr>
            <th>Date</th>
            <th>Product Name</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Reference</th>
          </tr>
        `
        tableRows = report.data
          .map(
            (item) => `
          <tr>
            <td>${format(new Date(item.date), "MMM dd, yyyy")}</td>
            <td>${item.productName}</td>
            <td>${item.type.toUpperCase()}</td>
            <td>${item.quantity}</td>
            <td>${item.reference || "-"}</td>
          </tr>
        `,
          )
          .join("")
        break

      case "low_stock":
        tableHeaders = `
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
            <th>Shortage</th>
            <th>Last Updated</th>
          </tr>
        `
        tableRows = report.data
          .map(
            (item) => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.category}</td>
            <td>${item.currentStock}</td>
            <td>${item.reorderLevel}</td>
            <td>${item.shortage}</td>
            <td>${item.lastUpdated}</td>
          </tr>
        `,
          )
          .join("")
        break

      case "valuation":
        tableHeaders = `
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Closing Stock</th>
          </tr>
        `
        tableRows = report.data
          .map(
            (item) => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.category}</td>
            <td>${item.closingStock}</td>
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
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 18px; margin-bottom: 10px; }
            .report-info { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd; }
            .summary-item { display: inline-block; margin-right: 30px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">SL SALAR</div>
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

  const exportToPDF = (report: InventoryReport) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text("SL SALAR", 105, 20, { align: "center" })

    doc.setFontSize(16)
    doc.text(report.title, 105, 30, { align: "center" })

    doc.setFontSize(10)
    const dateRange = `${format(new Date(report.dateRange.start), "MMM dd, yyyy")} to ${format(new Date(report.dateRange.end), "MMM dd, yyyy")}`
    doc.text(`Period: ${dateRange}`, 105, 40, { align: "center" })
    doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 105, 45, { align: "center" })

    // Table
    let tableData: any[] = []
    let columns: any[] = []

    switch (report.reportType) {
      case "closing_stock":
        columns = ["Product", "Category", "Unit", "Opening", "Purchases", "Sales", "Adjustments", "Closing", "Status"]
        tableData = report.data.map((item) => [
          item.productName,
          item.category,
          item.unit,
          item.openingStock,
          item.purchases,
          item.sales,
          item.adjustments,
          item.closingStock,
          item.status,
        ])
        break

      case "stock_movement":
        columns = ["Date", "Product", "Type", "Quantity", "Reference"]
        tableData = report.data.map((item) => [
          format(new Date(item.date), "MMM dd"),
          item.productName,
          item.type.toUpperCase(),
          item.quantity,
          item.reference || "-",
        ])
        break

      case "low_stock":
        columns = ["Product", "Category", "Current Stock", "Reorder Level", "Shortage", "Last Updated"]
        tableData = report.data.map((item) => [
          item.productName,
          item.category,
          item.currentStock,
          item.reorderLevel,
          item.shortage,
          item.lastUpdated,
        ])
        break

      case "valuation":
        columns = ["Product", "Category", "Closing Stock"]
        tableData = report.data.map((item) => [item.productName, item.category, item.closingStock])
        break
    }

    doc.autoTable({
      head: [columns],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    })

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Total Items: ${report.totalItems}`, 20, finalY)

    // Save
    const fileName = `${report.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`
    doc.save(fileName)
  }

  const printTransactionReceipt = (transaction: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = generateTransactionReceiptHTML(transaction)
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const printThermalTransactionReceipt = (transaction: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = generateThermalTransactionReceiptHTML(transaction)
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const generateTransactionReceiptHTML = (transaction: any): string => {
    const currentDate = format(new Date(), "MMM dd, yyyy HH:mm")

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${transaction.type.toUpperCase()} Receipt - ${transaction.transactionNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .receipt { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .receipt-title { font-size: 18px; margin-bottom: 10px; }
            .receipt-info { margin-bottom: 20px; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="company-name">SL SALAR</div>
              <div class="receipt-title">${transaction.type.toUpperCase()} RECEIPT</div>
              <div>Jodbhavi peth, Solapur | Ph: 8668749859</div>
            </div>

            <div class="receipt-info">
              <div><strong>Receipt No:</strong> ${transaction.transactionNumber}</div>
              <div><strong>Date:</strong> ${transaction.date}</div>
              <div><strong>Time:</strong> ${format(new Date(transaction.processedAt), "HH:mm:ss")}</div>
              ${transaction.reference ? `<div><strong>Reference:</strong> ${transaction.reference}</div>` : ""}
            </div>

            <table>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Particulars</th>
                  <th>QTY</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                ${transaction.items
                  .map(
                    (item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
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
              <div><strong>Transaction Type:</strong> ${transaction.type.toUpperCase()}</div>
              <div><strong>Total Items:</strong> ${transaction.items.length}</div>
              <div><strong>Total Quantity:</strong> ${transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</div>
              <div><strong>Processed At:</strong> ${currentDate}</div>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 12px;">
              <div>Thank you for your business!</div>
              <div>This is a computer generated receipt.</div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const generateThermalTransactionReceiptHTML = (transaction: any): string => {
    const currentDate = format(new Date(), "MMM dd, yyyy HH:mm")

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal ${transaction.type.toUpperCase()} Receipt - ${transaction.transactionNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 5px;
              width: 79mm;
              font-size: 12px;
              line-height: 1.2;
            }
            .thermal-receipt {
              width: 100%;
              max-width: 79mm;
            }
            .center { text-align: center; }
            .left { text-align: left; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 2px 0; }
            .double-line { border-bottom: 2px solid #000; margin: 3px 0; }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 1px 0;
              font-size: 11px;
            }
            .item-name {
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 40mm;
            }
            .item-qty { width: 20mm; text-align: center; }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin: 2px 0;
            }
            .header { font-size: 14px; font-weight: bold; }
            .sub-header { font-size: 10px; }
            .footer { font-size: 10px; margin-top: 5px; }
            @media print {
              body { margin: 0; padding: 2px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="thermal-receipt">
            <!-- Store Header -->
            <div class="center header">SL SALAR</div>
            <div class="center sub-header">Jodbhavi peth, Solapur</div>
            <div class="center sub-header">Ph: 8668749859</div>
            <div class="double-line"></div>

            <!-- Receipt Details -->
            <div class="center bold">${transaction.type.toUpperCase()} RECEIPT</div>
            <div class="line"></div>
            <div class="left">
              <div><strong>Receipt:</strong> ${transaction.transactionNumber}</div>
              <div><strong>Date:</strong> ${transaction.date}</div>
              <div><strong>Time:</strong> ${format(new Date(transaction.processedAt), "HH:mm:ss")}</div>
              ${transaction.reference ? `<div><strong>Ref:</strong> ${transaction.reference}</div>` : ""}
            </div>
            <div class="line"></div>

            <!-- Items Header -->
            <div class="item-row bold">
              <div class="item-name">Item</div>
              <div class="item-qty">Qty</div>
            </div>
            <div class="line"></div>

            <!-- Items -->
            ${transaction.items
              .map(
                (item: any) => `
              <div class="item-row">
                <div class="item-name">${item.name}</div>
                <div class="item-qty">${item.quantity} ${item.unit}</div>
              </div>
            `,
              )
              .join("")}

            <div class="line"></div>

            <!-- Total -->
            <div class="total-row" style="font-size: 14px;">
              <div>TOTAL QTY:</div>
              <div>${transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</div>
            </div>
            <div class="double-line"></div>

            <!-- Summary -->
            <div class="center sub-header">
              <div>Items: ${transaction.items.length}</div>
              <div>Type: ${transaction.type.toUpperCase()}</div>
            </div>

            <!-- Footer -->
            <div class="center footer">
              <div>Thank you!</div>
              <div>${currentDate}</div>
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

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage stock levels, track movements, and generate reports</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddItemDialog(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            <Button
              onClick={() => {
                setTransactionType("purchase")
                setShowTransactionDialog(true)
              }}
              variant="outline"
              className="rounded-[9px] border-gray-300"
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
              className="rounded-[9px] border-gray-300"
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
              className="rounded-[9px] border-gray-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Adjust
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <TabsList className="grid grid-cols-4 mb-4">
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
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
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
                        className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <h3 className="font-medium">{item.productName}</h3>
                              <p className="text-sm text-gray-600">{item.category}</p>
                            </div>
                            <Badge className={`text-xs ${stockStatus.color}`}>{stockStatus.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                        </div>
                        <div className="flex items-center gap-2">
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
                        className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge
                              variant={
                                transaction.type === "purchase"
                                  ? "default"
                                  : transaction.type === "sale"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
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
                        </div>
                        <div className="flex items-center gap-2">
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
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
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
                          // Store the generated report for viewing
                          ;(window as any).currentReport = report
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
                        <Button
                          onClick={() => {
                            const report = generateReport()
                            exportToPDF(report)
                          }}
                          variant="outline"
                          className="rounded-[9px]"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Dialog - Responsive */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Transaction</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[80vh]">
            {/* Product Selection - Left Side */}
            <div className="flex-1 overflow-y-auto p-4">
              {currentView === "super" && renderSuperCategories()}
              {currentView === "sub" && renderSubCategories()}
              {currentView === "products" && renderProducts()}
            </div>

            {/* Transaction Items - Right Side */}
            <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col bg-gray-50">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium text-base">
                  {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Items
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
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
                    className="w-full rounded-lg text-xs h-8"
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
        <DialogContent className="max-w-md">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details - {selectedItem?.productName}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Generated Report</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const report = (window as any).currentReport
                    if (report) printReport(report)
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-[9px]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  onClick={() => {
                    const report = (window as any).currentReport
                    if (report) exportToPDF(report)
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-[9px]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div ref={reportRef} className="space-y-4">
            {(window as any).currentReport && (
              <div className="bg-white p-6">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h1 className="text-2xl font-bold">SL SALAR</h1>
                  <h2 className="text-lg mt-2">{(window as any).currentReport.title}</h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Period: {format(new Date((window as any).currentReport.dateRange.start), "MMM dd, yyyy")} to{" "}
                    {format(new Date((window as any).currentReport.dateRange.end), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Generated: {format(new Date((window as any).currentReport.generatedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        {(window as any).currentReport.reportType === "closing_stock" && (
                          <>
                            <th className="border border-gray-300 p-2 text-left">Product Name</th>
                            <th className="border border-gray-300 p-2 text-left">Category</th>
                            <th className="border border-gray-300 p-2 text-center">Unit</th>
                            <th className="border border-gray-300 p-2 text-center">Opening</th>
                            <th className="border border-gray-300 p-2 text-center">Purchases</th>
                            <th className="border border-gray-300 p-2 text-center">Sales</th>
                            <th className="border border-gray-300 p-2 text-center">Adjustments</th>
                            <th className="border border-gray-300 p-2 text-center">Closing</th>
                            <th className="border border-gray-300 p-2 text-center">Status</th>
                          </>
                        )}
                        {(window as any).currentReport.reportType === "stock_movement" && (
                          <>
                            <th className="border border-gray-300 p-2 text-left">Date</th>
                            <th className="border border-gray-300 p-2 text-left">Product Name</th>
                            <th className="border border-gray-300 p-2 text-center">Type</th>
                            <th className="border border-gray-300 p-2 text-center">Quantity</th>
                            <th className="border border-gray-300 p-2 text-left">Reference</th>
                          </>
                        )}
                        {(window as any).currentReport.reportType === "low_stock" && (
                          <>
                            <th className="border border-gray-300 p-2 text-left">Product Name</th>
                            <th className="border border-gray-300 p-2 text-left">Category</th>
                            <th className="border border-gray-300 p-2 text-center">Current Stock</th>
                            <th className="border border-gray-300 p-2 text-center">Reorder Level</th>
                            <th className="border border-gray-300 p-2 text-center">Shortage</th>
                            <th className="border border-gray-300 p-2 text-center">Last Updated</th>
                          </>
                        )}
                        {(window as any).currentReport.reportType === "valuation" && (
                          <>
                            <th className="border border-gray-300 p-2 text-left">Product Name</th>
                            <th className="border border-gray-300 p-2 text-left">Category</th>
                            <th className="border border-gray-300 p-2 text-center">Closing Stock</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(window as any).currentReport.data.map((item: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {(window as any).currentReport.reportType === "closing_stock" && (
                            <>
                              <td className="border border-gray-300 p-2">{item.productName}</td>
                              <td className="border border-gray-300 p-2">{item.category}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.unit}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.openingStock}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.purchases}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.sales}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.adjustments}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.closingStock}</td>
                              <td className="border border-gray-300 p-2 text-center">
                                <Badge
                                  className={
                                    item.status === "Low Stock"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </td>
                            </>
                          )}
                          {(window as any).currentReport.reportType === "stock_movement" && (
                            <>
                              <td className="border border-gray-300 p-2">
                                {format(new Date(item.date), "MMM dd, yyyy")}
                              </td>
                              <td className="border border-gray-300 p-2">{item.productName}</td>
                              <td className="border border-gray-300 p-2 text-center">
                                <Badge
                                  variant={
                                    item.type === "purchase"
                                      ? "default"
                                      : item.type === "sale"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {item.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 p-2 text-center">{Math.abs(item.quantity)}</td>
                              <td className="border border-gray-300 p-2">{item.reference || "-"}</td>
                            </>
                          )}
                          {(window as any).currentReport.reportType === "low_stock" && (
                            <>
                              <td className="border border-gray-300 p-2">{item.productName}</td>
                              <td className="border border-gray-300 p-2">{item.category}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.currentStock}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.reorderLevel}</td>
                              <td className="border border-gray-300 p-2 text-center text-red-600">{item.shortage}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.lastUpdated}</td>
                            </>
                          )}
                          {(window as any).currentReport.reportType === "valuation" && (
                            <>
                              <td className="border border-gray-300 p-2">{item.productName}</td>
                              <td className="border border-gray-300 p-2">{item.category}</td>
                              <td className="border border-gray-300 p-2 text-center">{item.closingStock}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-gray-50 border rounded-[9px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Total Items:</strong> {(window as any).currentReport.totalItems}
                    </div>
                    <div>
                      <strong>Generated At:</strong>{" "}
                      {format(new Date((window as any).currentReport.generatedAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Receipt Dialog */}
      <Dialog open={showTransactionReceipt} onOpenChange={setShowTransactionReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {lastProcessedTransaction?.type.charAt(0).toUpperCase() + lastProcessedTransaction?.type.slice(1)}{" "}
              Transaction Completed
            </DialogTitle>
          </DialogHeader>

          {lastProcessedTransaction && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">
                    {lastProcessedTransaction.type.charAt(0).toUpperCase() + lastProcessedTransaction.type.slice(1)}{" "}
                    transaction processed successfully!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Transaction No:</strong> {lastProcessedTransaction.transactionNumber}
                </div>
                <div>
                  <strong>Date:</strong> {lastProcessedTransaction.date}
                </div>
                <div>
                  <strong>Type:</strong> {lastProcessedTransaction.type.toUpperCase()}
                </div>
                <div>
                  <strong>Reference:</strong> {lastProcessedTransaction.reference || "N/A"}
                </div>
              </div>

              {/* Items Summary */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lastProcessedTransaction.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm">{item.name}</td>
                        <td className="px-3 py-2 text-sm text-center">
                          {item.quantity} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => printTransactionReceipt(lastProcessedTransaction)}
                  className="rounded-lg"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => printThermalTransactionReceipt(lastProcessedTransaction)}
                  className="rounded-lg"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Thermal Print
                </Button>
                <Button
                  onClick={() => setShowTransactionReceipt(false)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                >
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

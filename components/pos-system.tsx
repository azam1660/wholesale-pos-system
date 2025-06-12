"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import {
  Trash2,
  Plus,
  Minus,
  User,
  ShoppingCart,
  FileText,
  Printer,
  Settings,
  UserPlus,
  Package,
  Download,
  Save,
  Eye,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminPanel from "./admin-panel"
import { DataManager } from "./data-manager"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface SuperCategory {
  id: string
  name: string
  icon: string
  image?: string
  createdAt: string
  updatedAt: string
}

interface SubCategory {
  id: string
  name: string
  icon: string
  image?: string
  superCategoryId: string
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  unit: string
  image?: string
  subCategoryId: string
  createdAt: string
  updatedAt: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  unit: string
  lastUsedRate?: number
}

interface Invoice {
  invoiceNumber: string
  date: string
  customer: any
  items: OrderItem[]
  subtotal: number
  hamaliCharges: number
  total: number
  isCashSale: boolean
  paymentMethod: "cash" | "card" | "upi" | "credit"
  reference?: string
}

interface Sale {
  id: string
  invoiceNumber: string
  customerId?: string
  isCashSale: boolean
  items: {
    productId: string
    quantity: number
    unitPrice: number
  }[]
  paymentMethod: "cash" | "card" | "upi" | "credit"
  createdAt: string
  timestamp: number
  customerName?: string
  customerPhone?: string
  subtotal: number
  total: number
}

const storeInfo = {
  name: "SL SALAR",
  address: "60/61, Jodhbhavi Peth Chatla Chowk, Main Road, Main Road-413001",
  phone: "9420490692",
}

// Invoice counter - stored in localStorage
const getInvoiceCounter = () => {
  const stored = localStorage.getItem("invoiceCounter")
  return stored ? Number.parseInt(stored) : 1
}

const setInvoiceCounter = (counter: number) => {
  localStorage.setItem("invoiceCounter", counter.toString())
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export default function POSSystem() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [currentView, setCurrentView] = useState<"super" | "sub" | "products">("super")
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [showInvoice, setShowInvoice] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [isCashSale, setIsCashSale] = useState(true) // Default to true
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "credit">("cash")
  const invoiceRef = useRef<HTMLDivElement>(null)

  const [showEditInvoice, setShowEditInvoice] = useState(false)
  const [editableInvoice, setEditableInvoice] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<OrderItem[]>([])

  const [hamaliCharges, setHamaliCharges] = useState(0)
  const [includeHamali, setIncludeHamali] = useState(false)
  const [invoiceReference, setInvoiceReference] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [customerTransactions, setCustomerTransactions] = useState<Sale[]>([])
  const [allTransactions, setAllTransactions] = useState<Sale[]>([])
  const [showCashTransactions, setShowCashTransactions] = useState(false)

  // Data states
  const [superCategories, setSuperCategories] = useState<SuperCategory[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const editInvoice = (invoice: Invoice) => {
    setEditableInvoice({ ...invoice })
    setInvoiceItems([...invoice.items])
    setShowEditInvoice(true)
  }

  const updateInvoiceItem = (itemId: string, field: "quantity" | "unitPrice", value: number) => {
    setInvoiceItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice
          return updatedItem
        }
        return item
      }),
    )
  }

  const saveInvoiceChanges = () => {
    if (!editableInvoice) return

    const updatedSubtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const updatedInvoice = {
      ...editableInvoice,
      items: [...invoiceItems],
      subtotal: updatedSubtotal,
      total: updatedSubtotal,
    }

    setCurrentInvoice(updatedInvoice)
    setShowEditInvoice(false)
    setShowInvoice(true)
  }

  const exportInvoiceToPDF = (invoice: Invoice) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text(storeInfo.name, 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.text(storeInfo.address, 105, 30, { align: "center" })
    doc.text(`Contact: ${storeInfo.phone}`, 105, 35, { align: "center" })

    // Invoice details
    doc.setFontSize(16)
    doc.text("INVOICE", 20, 50)

    doc.setFontSize(10)
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 60)
    doc.text(`Date: ${invoice.date}`, 20, 65)
    doc.text(`Payment: ${invoice.paymentMethod.toUpperCase()}`, 20, 70)

    // Customer details
    if (!invoice.isCashSale && invoice.customer) {
      doc.text("Bill To:", 120, 60)
      doc.text(invoice.customer.name, 120, 65)
      doc.text(invoice.customer.phone, 120, 70)
      if (invoice.customer.address) {
        doc.text(invoice.customer.address, 120, 75)
      }
    } else {
      doc.text("CASH CUSTOMER", 120, 65)
    }

    // Items table
    const tableData = invoice.items.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      item.unit,
      `₹${item.unitPrice.toFixed(2)}`,
      `₹${item.lineTotal.toFixed(2)}`,
    ])

    doc.autoTable({
      head: [["S.No.", "Particulars", "QTY", "Unit", "Rate (₹)", "Amount (₹)"]],
      body: tableData,
      startY: 85,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    })

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text(`Total: ₹${invoice.total.toFixed(2)}`, 150, finalY, { align: "right" })

    // Footer
    doc.setFontSize(8)
    doc.text("Thank you for your business!", 20, finalY + 20)
    doc.text("Terms & Conditions Apply", 20, finalY + 25)

    return doc
  }

  const downloadInvoicePDF = (invoice: Invoice) => {
    const doc = exportInvoiceToPDF(invoice)
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
  }

  const shareInvoicePDF = async (invoice: Invoice) => {
    const doc = exportInvoiceToPDF(invoice)
    const pdfBlob = doc.output("blob")

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([pdfBlob], `Invoice_${invoice.invoiceNumber}.pdf`, { type: "application/pdf" })
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice from ${storeInfo.name}`,
          files: [file],
        })
      } catch (error) {
        console.error("Error sharing:", error)
        // Fallback to download
        downloadInvoicePDF(invoice)
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Invoice_${invoice.invoiceNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Initialize data manager and load data
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [superCats, subCats, prods, custs] = await Promise.all([
          DataManager.getSuperCategories(),
          DataManager.getSubCategories(),
          DataManager.getProducts(),
          DataManager.getCustomers(),
        ])

        setSuperCategories(superCats)
        setSubCategories(subCats)
        setProducts(prods)
        setCustomers(custs)
        setDataLoaded(true)
      } catch (error) {
        console.error("Error loading data:", error)
        setDataLoaded(true)
      }
    }

    loadAllData()
  }, [])

  // Check for prefilled order from Purchase Order conversion
  useEffect(() => {
    const prefilledData = localStorage.getItem("posPrefilledOrder")
    if (prefilledData) {
      try {
        const orderData = JSON.parse(prefilledData)

        // Convert PO items to POS order items
        const posItems = orderData.items.map((item) => {
          const product = products.find((p) => p.id === item.id)
          const lastUsedRate = getLastUsedRate(item.id) || product?.price || 0

          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: lastUsedRate,
            lineTotal: item.quantity * lastUsedRate,
            unit: item.unit,
            lastUsedRate: lastUsedRate,
          }
        })

        setOrderItems(posItems)

        // Set reference if provided
        if (orderData.reference) {
          setInvoiceReference(`PO Ref: ${orderData.reference}`)
        }

        // Show notification
        alert(`Purchase Order converted to POS with ${posItems.length} items`)

        // Clear the prefilled data
        localStorage.removeItem("posPrefilledOrder")
      } catch (error) {
        console.error("Error loading prefilled order:", error)
        localStorage.removeItem("posPrefilledOrder")
      }
    }
  }, [products, dataLoaded])

  // Real-time data synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "superCategories") {
        setSuperCategories(DataManager.getSuperCategories())
      } else if (e.key === "subCategories") {
        setSubCategories(DataManager.getSubCategories())
      } else if (e.key === "products") {
        setProducts(DataManager.getProducts())
      } else if (e.key === "customers") {
        setCustomers(DataManager.getCustomers())
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Refresh data when returning from admin panel
  const handleAdminReturn = useCallback(() => {
    setShowAdmin(false)
    // Refresh all data
    setSuperCategories(DataManager.getSuperCategories())
    setSubCategories(DataManager.getSubCategories())
    setProducts(DataManager.getProducts())
    setCustomers(DataManager.getCustomers())
  }, [])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return []
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch),
    )
  }, [customerSearch, customers])

  const selectedCustomerData = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomer)
  }, [customers, selectedCustomer])

  const generateInvoiceNumber = () => {
    const counter = getInvoiceCounter()
    const date = new Date(invoiceDate)
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "")
    const invoiceNumber = `SNS/${dateStr}/${counter.toString().padStart(4, "0")}`
    setInvoiceCounter(counter + 1)
    return invoiceNumber
  }

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return

    try {
      const newCustomer = await DataManager.addCustomer({
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
      })

      setCustomers((prev) => [...prev, newCustomer])
      setSelectedCustomer(newCustomer.id)
      resetCustomerForm()
    } catch (error) {
      console.error("Error saving customer:", error)
    }
  }

  const resetCustomerForm = () => {
    setCustomerForm({ name: "", email: "", phone: "", address: "" })
    setShowAddCustomer(false)
  }

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

  const addToOrder = (product: Product) => {
    const existingItem = orderItems.find((item) => item.id === product.id)
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      // Get last used rate from localStorage or use product price
      const lastUsedRate = getLastUsedRate(product.id) || product.price
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: lastUsedRate,
        lineTotal: lastUsedRate,
        unit: product.unit,
        lastUsedRate: lastUsedRate,
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const getLastUsedRate = (productId: string): number | null => {
    const stored = localStorage.getItem(`lastRate_${productId}`)
    return stored ? Number.parseFloat(stored) : null
  }

  const saveLastUsedRate = (productId: string, rate: number) => {
    localStorage.setItem(`lastRate_${productId}`, rate.toString())
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId)
      return
    }
    setOrderItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity, lineTotal: newQuantity * item.unitPrice } : item,
      ),
    )
  }

  const updateUnitPrice = (itemId: string, newPrice: number) => {
    setOrderItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          saveLastUsedRate(itemId, newPrice)
          return { ...item, unitPrice: newPrice, lineTotal: item.quantity * newPrice, lastUsedRate: newPrice }
        }
        return item
      }),
    )
  }

  const removeFromOrder = (itemId: string) => {
    setOrderItems((items) => items.filter((item) => item.id !== itemId))
  }

  const clearCart = () => {
    setOrderItems([])
  }

  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
  }, [orderItems])

  const total = useMemo(() => {
    return subtotal + (includeHamali ? hamaliCharges : 0)
  }, [subtotal, hamaliCharges, includeHamali])

  const generateInvoice = () => {
    const invoiceNumber = generateInvoiceNumber()
    const invoice: Invoice = {
      invoiceNumber,
      date: invoiceDate,
      customer: isCashSale ? null : selectedCustomerData,
      items: [...orderItems],
      subtotal,
      hamaliCharges,
      total: total,
      isCashSale,
      paymentMethod,
      reference: invoiceReference,
    }
    setCurrentInvoice(invoice)
    setShowInvoice(true)
  }

  const printInvoice = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${currentInvoice?.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .invoice { max-width: 800px; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .header { text-align: center; margin-bottom: 20px; }
                .store-info { margin-bottom: 20px; }
                .customer-info { margin-bottom: 20px; }
                .signature { margin-top: 40px; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${invoiceRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const confirmOrder = async () => {
    if (orderItems.length === 0) return
    if (!isCashSale && !selectedCustomer) return

    try {
      const invoiceNumber = generateInvoiceNumber()
      // Record the sale
      await DataManager.recordSale({
        invoiceNumber: invoiceNumber,
        customerId: isCashSale ? undefined : selectedCustomer,
        isCashSale,
        items: orderItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        timestamp: Date.now(),
        customerName: selectedCustomerData?.name,
        customerPhone: selectedCustomerData?.phone,
        subtotal: subtotal,
        total: total,
      })

      // Generate and show invoice
      generateInvoice()

      // Clear cart and reset form
      clearCart()
      setSelectedCustomer("")
      setIsCashSale(false)
      setPaymentMethod("cash")
      setInvoiceReference("")
      setInvoiceDate(new Date().toISOString().split("T")[0])
      setHamaliCharges(0)
      setIncludeHamali(false)

      // Refresh product data to show updated stock
      setProducts(DataManager.getProducts())
    } catch (error) {
      console.error("Error recording sale:", error)
      alert("Error processing sale. Please try again.")
    }
  }

  const loadCustomerTransactions = (customerId: string) => {
    const sales = DataManager.getSalesByCustomer(customerId)
    setCustomerTransactions(sales)
    setShowTransactionHistory(true)
  }

  const loadAllTransactions = () => {
    const sales = DataManager.getSales()
    setAllTransactions(sales)
    setShowCashTransactions(true)
  }

  if (showAdmin) {
    return <AdminPanel onBack={handleAdminReturn} />
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
        </div>
      </div>
    )
  }

  const renderSuperCategories = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {superCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleSuperCategorySelect(category.id)}
          className="h-24 sm:h-32 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-black rounded-[23px] flex flex-col items-center justify-center gap-2 sm:gap-3 transition-colors p-4"
          variant="outline"
        >
          <div className="relative">
            {category.image ? (
              <div className="relative">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-[11px] border border-gray-200"
                />
                <span className="absolute -bottom-1 -right-1 text-lg sm:text-xl">{category.icon}</span>
              </div>
            ) : (
              <span className="text-2xl sm:text-3xl">{category.icon}</span>
            )}
          </div>
          <span className="font-medium text-xs sm:text-sm text-center px-2">{category.name}</span>
        </Button>
      ))}
    </div>
  )

  const renderSubCategories = () => {
    const filteredSubCategories = subCategories.filter((sub) => sub.superCategoryId === selectedSuperCategory)
    return (
      <div className="space-y-4">
        <Button onClick={handleBackToSuper} variant="outline" className="rounded-[9px] border-gray-300">
          ← Back to Categories
        </Button>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredSubCategories.map((subCategory) => (
            <Button
              key={subCategory.id}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              className="h-20 sm:h-28 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-black rounded-[18px] flex flex-col items-center justify-center gap-2 transition-colors p-4"
              variant="outline"
            >
              <div className="relative">
                {subCategory.image ? (
                  <div className="relative">
                    <img
                      src={subCategory.image || "/placeholder.svg"}
                      alt={subCategory.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-[9px] border border-gray-200"
                    />
                    <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">{subCategory.icon}</span>
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl">{subCategory.icon}</span>
                )}
              </div>
              <span className="font-medium text-xs sm:text-sm text-center px-2">{subCategory.name}</span>
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
          <Button onClick={handleBackToSub} variant="outline" className="rounded-[9px] border-gray-300">
            ← Back to Subcategories
          </Button>
          <Button onClick={handleBackToSuper} variant="outline" className="rounded-[9px] border-gray-300">
            ← Back to Categories
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="rounded-[11px] border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {product.image && (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-[9px] border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-lg font-bold">
                          ₹{getLastUsedRate(product.id) || product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => addToOrder(product)}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px] font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

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

      <div className="relative z-10 flex flex-col lg:flex-row h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-black">SL SALAR POS</h1>
                <Button
                  onClick={() => setShowAdmin(true)}
                  variant="outline"
                  className="rounded-[9px] border-gray-300"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
                <Button
                  onClick={() => window.open("/inventory", "_blank")}
                  variant="outline"
                  className="rounded-[9px] border-gray-300"
                  size="sm"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Inventory
                </Button>
              </div>

              {/* Customer Selection */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cash-sale"
                    checked={isCashSale}
                    onCheckedChange={(checked) => {
                      setIsCashSale(checked as boolean)
                      if (checked) {
                        setSelectedCustomer("")
                        setCustomerSearch("")
                      }
                    }}
                  />
                  <label htmlFor="cash-sale" className="text-sm font-medium">
                    Cash Sale
                  </label>
                </div>

                {!isCashSale && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10 w-full sm:w-64 rounded-[9px]"
                      />
                      {customerSearch && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-[9px] mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => {
                                setSelectedCustomer(customer.id)
                                setCustomerSearch("")
                              }}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm">{customer.name}</div>
                              <div className="text-xs text-gray-500">{customer.phone}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowAddCustomer(true)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                      size="sm"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {selectedCustomerData && !isCashSale && (
                  <Card className="rounded-[11px] border-gray-200 w-full sm:w-auto">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{selectedCustomerData.name}</div>
                          <div className="text-xs text-gray-500">{selectedCustomerData.phone}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadCustomerTransactions(selectedCustomerData.id)}
                          className="rounded-[9px]"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isCashSale && (
                  <Card className="rounded-[11px] border-yellow-200 bg-yellow-50 w-full sm:w-auto">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-yellow-800">CASH SALE</div>
                          <div className="text-xs text-yellow-600">No customer required</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={loadAllTransactions}
                          className="rounded-[9px] border-yellow-300"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </header>

          {/* Product Selection Area */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
            {currentView === "super" && renderSuperCategories()}
            {currentView === "sub" && renderSubCategories()}
            {currentView === "products" && renderProducts()}
          </main>
        </div>

        {/* Order Summary Panel */}
        <div className="w-full lg:w-96 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-96 lg:max-h-none">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-bold">Order Summary</h2>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items in cart</p>
            ) : (
              <div className="space-y-3 max-h-48 lg:max-h-96 overflow-y-auto">
                {orderItems.map((item) => (
                  <Card key={item.id} className="rounded-[9px] border-gray-200">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="font-medium text-sm">{item.name}</div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 p-0 rounded-[9px]"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center rounded-[9px]"
                            min="1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 p-0 rounded-[9px]"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs text-gray-500">{item.unit}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Rate:</span>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateUnitPrice(item.id, Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-xs rounded-[9px]"
                            step="0.01"
                            min="0"
                          />
                          <span className="text-xs text-gray-500">₹</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">₹{item.lineTotal.toFixed(2)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromOrder(item.id)}
                            className="w-7 h-7 p-0 rounded-[9px] text-red-500 hover:text-red-700"
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

          {/* Hamali/Freight Charges */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-hamali"
                  checked={includeHamali}
                  onCheckedChange={(checked) => setIncludeHamali(checked as boolean)}
                />
                <Label htmlFor="include-hamali" className="text-sm font-medium">
                  Include Hamali/Freight Charges
                </Label>
              </div>
              {includeHamali && (
                <Input
                  type="number"
                  placeholder="Enter hamali charges"
                  value={hamaliCharges}
                  onChange={(e) => setHamaliCharges(Number.parseFloat(e.target.value) || 0)}
                  className="rounded-[9px]"
                  step="0.01"
                  min="0"
                />
              )}
            </div>
          </div>

          {/* Reference and Date Inputs */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Reference (Optional)</Label>
                <Input
                  placeholder="Reference number or note"
                  value={invoiceReference}
                  onChange={(e) => setInvoiceReference(e.target.value)}
                  className="rounded-[9px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="rounded-[9px]"
                />
              </div>
            </div>
          </div>

          {/* Order Totals */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              {includeHamali && hamaliCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hamali/Freight:</span>
                  <span className="font-medium">₹{hamaliCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl border-t pt-2">
                <span className="font-bold">Total:</span>
                <span className="font-bold">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: "cash" | "card" | "upi" | "credit") => setPaymentMethod(value)}
              >
                <SelectTrigger className="rounded-[9px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                  <SelectItem value="upi">📱 UPI</SelectItem>
                  <SelectItem value="credit">🏪 Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 lg:p-6 space-y-3">
            <Button
              onClick={clearCart}
              variant="outline"
              className="w-full rounded-[9px] border-gray-300"
              disabled={orderItems.length === 0}
            >
              Clear Cart
            </Button>
            <Button
              onClick={confirmOrder}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px] font-medium"
              disabled={orderItems.length === 0 || (!isCashSale && !selectedCustomer)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="customer-address">Address</Label>
              <Textarea
                id="customer-address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveCustomer}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={!customerForm.name.trim()}
              >
                Add Customer
              </Button>
              <Button onClick={resetCustomerForm} variant="outline" className="rounded-[9px]">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Generated</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => editInvoice(currentInvoice!)}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-[9px]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={printInvoice} variant="outline" className="rounded-[9px]">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => downloadInvoicePDF(currentInvoice!)} variant="outline" className="rounded-[9px]">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={() => shareInvoicePDF(currentInvoice!)}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-[9px]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Share PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {currentInvoice && (
            <div ref={invoiceRef} className="invoice bg-white p-8">
              {/* Store Header */}
              <div className="header text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-bold">{storeInfo.name}</h1>
                <p className="text-sm mt-2">{storeInfo.address}</p>
                <p className="text-sm mt-1">Contact: {storeInfo.phone}</p>
              </div>

              {/* Invoice Details */}
              <div className="flex justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">INVOICE</h2>
                  <p>
                    <strong>Invoice No:</strong> {currentInvoice.invoiceNumber}
                  </p>
                  <p>
                    <strong>Date:</strong> {currentInvoice.date}
                  </p>
                  <p>
                    <strong>Payment:</strong> {currentInvoice.paymentMethod.toUpperCase()}
                  </p>
                  {currentInvoice.reference && (
                    <p>
                      <strong>Reference:</strong> {currentInvoice.reference}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h3 className="font-bold">Bill To:</h3>
                  {currentInvoice.isCashSale ? (
                    <p className="text-lg font-bold">CASH CUSTOMER</p>
                  ) : (
                    <div>
                      <p className="font-medium">{currentInvoice.customer?.name}</p>
                      <p className="text-sm">{currentInvoice.customer?.address}</p>
                      <p className="text-sm">{currentInvoice.customer?.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left">S.No.</th>
                    <th className="border border-black p-2 text-left">Particulars</th>
                    <th className="border border-black p-2 text-center">QTY</th>
                    <th className="border border-black p-2 text-center">Unit</th>
                    <th className="border border-black p-2 text-right">Rate (₹)</th>
                    <th className="border border-black p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-black p-2">{index + 1}</td>
                      <td className="border border-black p-2">{item.name}</td>
                      <td className="border border-black p-2 text-center">{item.quantity}</td>
                      <td className="border border-black p-2 text-center">{item.unit}</td>
                      <td className="border border-black p-2 text-right">{item.unitPrice.toFixed(2)}</td>
                      <td className="border border-black p-2 text-right">{item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {currentInvoice.hamaliCharges > 0 && (
                    <tr>
                      <td colSpan={5} className="border border-black p-2 text-right font-bold">
                        Hamali/Freight Charges:
                      </td>
                      <td className="border border-black p-2 text-right font-bold">
                        ₹{currentInvoice.hamaliCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5} className="border border-black p-2 text-right font-bold">
                      Total (INR):
                    </td>
                    <td className="border border-black p-2 text-right font-bold">₹{currentInvoice.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <div className="flex justify-between items-end mt-8">
                <div>
                  <p className="text-sm">Thank you for your business!</p>
                  <p className="text-sm">Terms & Conditions Apply</p>
                  <p className="text-sm mt-2">
                    <strong>Payment Method:</strong> {currentInvoice.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="border-t border-black pt-2 mt-16 w-48">
                    <p className="text-sm">Authorized Signature</p>
                    <p className="text-xs">{storeInfo.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditInvoice} onOpenChange={setShowEditInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice - {editableInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>

          {editableInvoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-[9px]">
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <p className="text-sm">{editableInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{editableInvoice.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">
                    {editableInvoice.isCashSale ? "Cash Customer" : editableInvoice.customer?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm">{editableInvoice.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              {/* Editable Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Invoice Items</h3>
                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <Card key={item.id} className="rounded-[9px]">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div className="col-span-2">
                            <Label className="text-sm">Product</Label>
                            <p className="font-medium">{item.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateInvoiceItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)
                              }
                              className="rounded-[9px]"
                              min="1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateInvoiceItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                              }
                              className="rounded-[9px]"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Unit</Label>
                            <p className="text-sm text-gray-600">{item.unit}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Line Total</Label>
                            <p className="font-bold">₹{item.lineTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 bg-gray-50 rounded-[9px]">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold">
                    ₹{invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowEditInvoice(false)} variant="outline" className="rounded-[9px]">
                  Cancel
                </Button>
                <Button
                  onClick={saveInvoiceChanges}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Transaction History Dialog */}
      <Dialog open={showTransactionHistory} onOpenChange={setShowTransactionHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Transaction History - {selectedCustomerData?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {customerTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found for this customer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{transaction.invoiceNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {transaction.paymentMethod.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm")}</span>
                        <span className="mx-2">•</span>
                        <span>{transaction.items.length} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(transaction.total)}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const invoice = {
                            invoiceNumber: transaction.invoiceNumber,
                            date: transaction.date,
                            customer: selectedCustomerData,
                            items: transaction.items,
                            subtotal: transaction.subtotal,
                            total: transaction.total,
                            isCashSale: false,
                            paymentMethod: transaction.paymentMethod,
                          }
                          setCurrentInvoice(invoice)
                          setShowInvoice(true)
                          setShowTransactionHistory(false)
                        }}
                        className="rounded-[9px]"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const invoice = {
                            invoiceNumber: transaction.invoiceNumber,
                            date: transaction.date,
                            customer: selectedCustomerData,
                            items: transaction.items,
                            subtotal: transaction.subtotal,
                            total: transaction.total,
                            isCashSale: false,
                            paymentMethod: transaction.paymentMethod,
                          }
                          editInvoice(invoice)
                          setShowTransactionHistory(false)
                        }}
                        className="rounded-[9px]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Sale Transactions Dialog */}
      <Dialog open={showCashTransactions} onOpenChange={setShowCashTransactions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Transactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTransactions
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{transaction.invoiceNumber}</span>
                          <Badge variant={transaction.isCashSale ? "secondary" : "default"} className="text-xs">
                            {transaction.isCashSale ? "Cash" : "Customer"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {transaction.paymentMethod.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>{format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm")}</span>
                          <span className="mx-2">•</span>
                          <span>{transaction.customerName || "Cash Customer"}</span>
                          <span className="mx-2">•</span>
                          <span>{transaction.items.length} items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(transaction.total)}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const invoice = {
                              invoiceNumber: transaction.invoiceNumber,
                              date: transaction.date,
                              customer: transaction.isCashSale
                                ? null
                                : { name: transaction.customerName, phone: transaction.customerPhone },
                              items: transaction.items,
                              subtotal: transaction.subtotal,
                              total: transaction.total,
                              isCashSale: transaction.isCashSale,
                              paymentMethod: transaction.paymentMethod,
                            }
                            setCurrentInvoice(invoice)
                            setShowInvoice(true)
                            setShowCashTransactions(false)
                          }}
                          className="rounded-[9px]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const invoice = {
                              invoiceNumber: transaction.invoiceNumber,
                              date: transaction.date,
                              customer: transaction.isCashSale
                                ? null
                                : { name: transaction.customerName, phone: transaction.customerPhone },
                              items: transaction.items,
                              subtotal: transaction.subtotal,
                              total: transaction.total,
                              isCashSale: transaction.isCashSale,
                              paymentMethod: transaction.paymentMethod,
                            }
                            editInvoice(invoice)
                            setShowCashTransactions(false)
                          }}
                          className="rounded-[9px]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

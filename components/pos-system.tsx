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
  Save,
  Eye,
  Edit,
  X,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import AdminPanel from "./admin-panel"
import InventoryManagement from "./inventory-management"
import PurchaseOrderModule from "./purchase-order-module"
import { DataManager } from "./data-manager"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut } from 'lucide-react'

interface SuperCategory {
  id: string
  name: string
  nameMr?: string
  icon: string
  image?: string
  createdAt: string
  updatedAt: string
}

interface SubCategory {
  id: string
  name: string
  nameMr?: string
  icon: string
  image?: string
  superCategoryId: string
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  nameMr?: string
  price: number
  stock: number
  unit: string
  image?: string
  subCategoryId: string
  hamaliValue: number
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

interface Estimate {
  estimateNumber: string
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
  estimateNumber: string
  customerId?: string
  isCashSale: boolean
  items: {
    productId: string
    productName?: string
    quantity: number
    unitPrice: number
    lineTotal?: number
    unit?: string
    subCategoryId?: string
    subCategoryName?: string
    superCategoryId?: string
    superCategoryName?: string
  }[]
  paymentMethod: "cash" | "card" | "upi" | "credit"
  createdAt: string
  timestamp: number
  customerName?: string
  customerPhone?: string
  subtotal: number
  total: number
  hamaliCharges: number
  reference?: string
  updatedAt?: string
}

const storeInfo = {
  name: "WholesalePoS",
  address: "Jodbhavi Peth, Solapur",
  phone: "9420490692",
  contact: "9405842623",
}
const generateEstimateNumber = async (date: string) => {
  const counter = await DataManager.getNextEstimateNumber()
  const dateObj = new Date(date)
  const dateStr = dateObj.toISOString().split("T")[0].replace(/-/g, "")
  const estimateNumber = `EST/${dateStr}/${counter.toString().padStart(4, "0")}`
  return estimateNumber
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export default function POSSystem() {
  const { t, language, setLanguage, tName } = useLanguage()
  const { user, logout } = useAuth()
  const [showAdmin, setShowAdmin] = useState(false)
  const [activeMainTab, setActiveMainTab] = useState<"pos" | "order" | "godown">("pos")
  const [currentView, setCurrentView] = useState<"super" | "sub" | "products" | "all_products">("super")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [showEstimate, setShowEstimate] = useState(false)
  const [currentEstimate, setCurrentEstimate] = useState<Estimate | null>(null)
  const [isCashSale, setIsCashSale] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "credit">("cash")
  const estimateRef = useRef<HTMLDivElement>(null)

  const [showEditEstimate, setShowEditEstimate] = useState(false)
  const [editableEstimate, setEditableEstimate] = useState<Estimate | null>(null)
  const [estimateItems, setEstimateItems] = useState<OrderItem[]>([])
  const [showAddItemToEstimate, setShowAddItemToEstimate] = useState(false)
  const [productSearchForEstimate, setProductSearchForEstimate] = useState("")

  const [hamaliCharges, setHamaliCharges] = useState(0)
  const [includeHamali, setIncludeHamali] = useState(false)
  const [estimateReference, setEstimateReference] = useState("")
  const [estimateDate, setEstimateDate] = useState(new Date().toISOString().split("T")[0])
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [customerTransactions, setCustomerTransactions] = useState<Sale[]>([])
  const [allTransactions, setAllTransactions] = useState<Sale[]>([])
  const [showCashTransactions, setShowCashTransactions] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Enhanced responsive hook
  const [isTablet, setIsTablet] = useState(false)
  const [isLaptop, setIsLaptop] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [superCategories, setSuperCategories] = useState<SuperCategory[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 640) // Mobile: < 640px
      setIsTablet(width >= 640 && width < 1024) // Tablet: 640px - 1024px
      setIsLaptop(width >= 1024 && width < 1280) // Laptop: 1024px - 1280px
      setIsDesktop(width >= 1280) // Desktop: >= 1280px
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])
  const calculateHamaliCharges = useCallback(() => {
    if (!includeHamali) return 0
    return orderItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id)
      return sum + (product?.hamaliValue || 0) * item.quantity
    }, 0)
  }, [orderItems, products, includeHamali])

  useEffect(() => {
    if (includeHamali) {
      setHamaliCharges(calculateHamaliCharges())
    } else {
      setHamaliCharges(0)
    }
  }, [includeHamali, calculateHamaliCharges])

  const saveEstimateChanges = async () => {
    if (!editableEstimate) return

    try {
      const updatedSubtotal = estimateItems.reduce((sum, item) => sum + item.lineTotal, 0)
      const updatedTotal = updatedSubtotal + (editableEstimate.hamaliCharges || 0)

      const updatedEstimate = {
        ...editableEstimate,
        items: [...estimateItems],
        subtotal: updatedSubtotal,
        total: updatedTotal,
      }

      const sales = await DataManager.getSales()
      const saleIndex = sales.findIndex((sale: any) => sale.estimateNumber === editableEstimate.estimateNumber)

      function generateUUID() {
        // Simple RFC4122 version 4 compliant UUID generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }

      if (saleIndex !== -1) {
        const originalSale = sales[saleIndex]

        const updatedSaleItems = estimateItems.map((item) => {
          const originalItem = originalSale.items.find((saleItem: any) => saleItem.productId === item.id)
          return {
            id: originalItem?.id || generateUUID(),
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            unit: item.unit,
            subCategoryId: originalItem?.subCategoryId || "",
            subCategoryName: originalItem?.subCategoryName || "",
            superCategoryId: originalItem?.superCategoryId || "",
            superCategoryName: originalItem?.superCategoryName || "",
          }
        })

        await DataManager.updateSale(originalSale.id, {
          items: updatedSaleItems,
          subtotal: updatedSubtotal,
          hamaliCharges: editableEstimate.hamaliCharges || 0,
          total: updatedTotal,
          updatedAt: new Date().toISOString(),
        })

        // Handle stock updates
        const originalItems = originalSale.items
        for (const newItem of estimateItems) {
          const originalItem = originalItems.find((item) => item.productId === newItem.id)
          if (originalItem) {
            const quantityDiff = newItem.quantity - originalItem.quantity
            if (quantityDiff !== 0) {
              const product = products.find((p) => p.id === newItem.id)
              if (product) {
                const newStock = Math.max(0, product.stock - quantityDiff)
                await DataManager.updateProductStock(product.id, newStock)
              }
            }
          } else {
            // New item added
            const product = products.find((p) => p.id === newItem.id)
            if (product) {
              const newStock = Math.max(0, product.stock - newItem.quantity)
              await DataManager.updateProductStock(product.id, newStock)
            }
          }
        }

        // Handle removed items
        for (const originalItem of originalItems) {
          const stillExists = estimateItems.find((item) => item.id === originalItem.productId)
          if (!stillExists) {
            const product = products.find((p) => p.id === originalItem.productId)
            if (product) {
              const newStock = product.stock + originalItem.quantity
              await DataManager.updateProductStock(product.id, newStock)
            }
          }
        }

        const prods = await DataManager.getProducts()
        setProducts(prods)
      }

      setCurrentEstimate(updatedEstimate)
      setShowEditEstimate(false)
      setShowEstimate(true)
    } catch (error) {
      console.error("Error saving estimate changes:", error)
      alert("Error saving changes. Please try again.")
    }
  }

  const editEstimate = (estimate: Estimate) => {
    setEditableEstimate({ ...estimate })
    setEstimateItems([...estimate.items])
    setShowEditEstimate(true)
  }

  const updateEstimateItem = (itemId: string, field: "quantity" | "unitPrice", value: number) => {
    setEstimateItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice
          if (field === "unitPrice") {
            saveLastUsedRate(itemId, value)
            updatedItem.lastUsedRate = value
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const removeEstimateItem = (itemId: string) => {
    setEstimateItems((items) => items.filter((item) => item.id !== itemId))
  }

  const addNewItemToEstimate = () => {
    setShowAddItemToEstimate(true)
  }

  const addProductToEstimate = (product: Product) => {
    const existingItem = estimateItems.find((item) => item.id === product.id)
    if (existingItem) {
      updateEstimateItem(product.id, "quantity", existingItem.quantity + 1)
    } else {
      const lastUsedRate = getLastUsedRate(product.id) || product.price
      const newItem: OrderItem = {
        id: product.id,
        name: tName(product),
        quantity: 1,
        unitPrice: lastUsedRate,
        lineTotal: lastUsedRate,
        unit: product.unit,
        lastUsedRate: lastUsedRate,
      }
      setEstimateItems((prev) => [...prev, newItem])
    }
    setShowAddItemToEstimate(false)
    setProductSearchForEstimate("")
  }

  const filteredProductsForEstimate = products.filter((product) =>
    product.name.toLowerCase().includes(productSearchForEstimate.toLowerCase()) ||
    (product.nameMr && product.nameMr.toLowerCase().includes(productSearchForEstimate.toLowerCase())),
  )

  const handlePrint = () => {
    if (!estimateRef.current) return

    const printContent = estimateRef.current.innerHTML
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Estimate</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 16px;
              color: #000;
              background: #fff;
              font-size: 14px;
              line-height: 1.5;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1rem;
              font-size: 12px;
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
              font-size: 13px;
            }

            .header {
              text-align: center;
              margin-bottom: 14px;
            }

            /* Make Estimate Heading smaller for print */
            .estimate-heading {
              font-size: 18px !important;  /* Smaller for print */
              margin-bottom: 5px !important;  /* Reduce gap between estimate heading and details */
            }

            /* Make Estimate Details smaller for print */
            .estimate-details {
              font-size: 13px !important;  /* Smaller for print */
              margin-bottom: 2px !important; /* Reduce gap between estimate details */
            }

            /* Make Bill To heading smaller for print */
            .bill-to-heading {
              font-size: 13px !important;  /* Smaller for print */
              margin-top: 5px !important; /* Reduce gap between Bill To label and address */
            }

            /* Make Bill To Info smaller for print */
            .bill-to-info {
              font-size: 10px !important;  /* Smaller for print */
              margin-top: 0px !important;  /* Remove extra space before Bill To details */
            }

            .estimate-details, .footer {
              margin-bottom: 16px;
              font-size: 10px;
            }

            tr {
              page-break-inside: avoid;
            }

            .signature {
              border-top: 1px solid #000;
              width: 180px;
              margin-top: 40px;
              text-align: center;
              font-size: 13px;
              padding-top: 8px;
            }

            /* Make Total INR larger for print */
table tbody tr.total-row td {
  font-size: 12px !important;
  font-weight: bold !important;
  text-align: right;
  padding: 4px 6px;
}

            /* Total row first column to right align */
            table tbody tr.total-row td:first-child {
              text-align: right;
            }

           @media print {
  @page {
    size: A6;
  }

  /* Store Info - Smaller for print */
  .header h1 {
    font-size: 14px !important; /* Smaller font for header */
  }

  .header p {
    font-size: 10px !important; /* Smaller font for store details */
  }

  /* Estimate Heading smaller for print */
  .estimate-heading {
    font-size: 10px !important; /* Smaller font for the estimate heading */
    margin-bottom: 5px !important; /* Reduced gap */
  }

  /* Estimate Details smaller for print */
  .estimate-details {
    font-size: 10px !important; /* Smaller font for estimate details */
    margin-bottom: 2px !important; /* Reduced gap */
  }

  /* Make Bill To heading smaller for print */
  .bill-to-heading {
    font-size: 10px !important; /* Reduced font size */
    margin-top: 5px !important; /* Reduced gap */
  }

  /* Make Bill To Info smaller for print */
  .bill-to-info {
    font-size: 9px !important; /* Smaller font for customer details */
    margin-top: 0px !important;  /* Removed extra space */
  }

  /* Estimate table - make font smaller */
  table {
    width: 100% !important; /* Ensure the table spans the entire page */
    border-collapse: collapse;
    font-size: 9px !important; /* Smaller font for table content */
  }

  th, td {
    padding: 3px 4px !important;
    text-align: left;
    border: 1px solid #000 !important;
  }

  th {
    background-color: #f0f0f0;
    font-weight: bold;
  }

  /* Make Total INR row font larger for print */
  table tbody tr.total-row td {
    font-size: 12px !important; /* Larger font for total row */
    font-weight: bold !important;
    text-align: right;
    padding: 4px 6px !important;
  }

  /* Total row first column to right align */
  table tbody tr.total-row td:first-child {
    text-align: right !important;
  }

  /* Adjust flex layout for side-by-side Estimate and Bill To */
  .flex {
    display: flex !important;
    justify-content: space-between !important;
    flex-wrap: wrap;
  }

  .w-1/2 {
    width: 48% !important; /* Ensures both sections take up equal space */
  }

  /* Ensure proper alignment of elements for printing */
  .estimate-details, .bill-to-info {
    font-size: 9px !important; /* Ensure font is consistent in print */
  }

  /* Footer Text */
  .footer p {
    font-size: 9px !important; /* Smaller font for footer */
    text-align: center;
  }
}

          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)

      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const printThermalEstimate = () => {
    if (!estimateRef.current) return

    const printContent = estimateRef.current.innerHTML
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Estimate</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 6px;
              color: #000;
              background: #fff;
              font-size: 8.5px;
              line-height: 1.3;
              width: 72mm;
              max-width: 72mm;
            }

            .no-print {
              display: none !important;
            }

            .header {
              text-align: center;
              margin-bottom: 6px;
            }

            .header h1 {
              font-size: 12px;
              margin-bottom: 2px;
              font-weight: bold;
            }

            .header p {
              font-size: 8px;
              line-height: 1.2;
            }

            .section {
              margin-bottom: 4px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              margin-bottom: 2px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 2px 0;
              font-size: 8px;
            }

            th, td {
              border: 1px solid #000;
              padding: 2px;
              vertical-align: top;
              text-align: left;
            }

            th {
              background-color: #f0f0f0;
              text-align: center;
              font-weight: bold;
            }

            .summary {
              margin-top: 5px;
              font-size: 8px;
            }

            .signature {
              border-top: 1px solid #000;
              width: 100px;
              margin: 10px auto 0;
              text-align: center;
              font-size: 8px;
            }

            .footer {
            width: 100vw;
              text-align: center; !important
              margin-top: 2px;
              font-size: 8px;
            }

            tr {
              page-break-inside: avoid;
            }

            @media print {
              @page {
                margin: 4mm;
              }

              body {
                margin: 0;
                padding: 2mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)

      printWindow.document.close()
      printWindow.focus()
      printWindow.print()

      setTimeout(() => {
        if (!printWindow.closed) printWindow.close()
      }, 1000)
    }
  }
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
  useEffect(() => {
    const prefilledData = localStorage.getItem("posPrefilledOrder")
    if (prefilledData) {
      try {
        const orderData = JSON.parse(prefilledData)
        const posItems = orderData.items.map((item: any) => {
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
        if (orderData.reference) {
          setEstimateReference(`PO Ref: ${orderData.reference}`)
        }
        localStorage.removeItem("posPrefilledOrder")
      } catch (error) {
        console.error("Error loading prefilled order:", error)
        localStorage.removeItem("posPrefilledOrder")
      }
    }
  }, [products, dataLoaded])
  // Storage event listeners removed - using MongoDB now
  const handleAdminReturn = useCallback(async () => {
    setShowAdmin(false)

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
      const lastUsedRate = getLastUsedRate(product.id) || product.price
      const newItem: OrderItem = {
        id: product.id,
        name: tName(product),
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
  const confirmOrder = async () => {
    if (orderItems.length === 0) return
    if (!isCashSale && !selectedCustomer) return

    try {
      const estimateNumber = await generateEstimateNumber(estimateDate)

      await DataManager.recordSale({
        estimateNumber: estimateNumber,
        date: estimateDate,
        customerId: isCashSale ? undefined : selectedCustomer,
        isCashSale,
        items: orderItems.map((item) => {
          const product = products.find((p) => p.id === item.id)
          const subCat = product ? subCategories.find((sc) => sc.id === product.subCategoryId) : null
          const superCat = subCat ? superCategories.find((sc) => sc.id === subCat.superCategoryId) : null
          return {
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice,
            unit: item.unit,
            subCategoryId: product?.subCategoryId,
            subCategoryName: subCat ? tName(subCat) : undefined,
            superCategoryId: superCat?.id,
            superCategoryName: superCat ? tName(superCat) : undefined,
          }
        }),
        paymentMethod,
        timestamp: Date.now(),
        customerName: isCashSale ? "CASH CUSTOMER" : selectedCustomerData?.name,
        customerPhone: isCashSale ? "" : selectedCustomerData?.phone,
        subtotal: subtotal,
        hamaliCharges: includeHamali ? hamaliCharges : 0,
        total: total,
        reference: estimateReference,
      })
      const estimate: Estimate = {
        estimateNumber,
        date: new Date(estimateDate).toLocaleDateString("en-IN"),
        customer: isCashSale ? null : selectedCustomerData,
        items: [...orderItems],
        subtotal,
        hamaliCharges: includeHamali ? hamaliCharges : 0,
        total: total,
        isCashSale,
        paymentMethod,
        reference: estimateReference,
      }
      setCurrentEstimate(estimate)
      setShowEstimate(true)
      clearCart()
      setSelectedCustomer("")
      setIsCashSale(true)
      setPaymentMethod("cash")
      setEstimateReference("")
      setEstimateDate(new Date().toISOString().split("T")[0])
      setHamaliCharges(0)
      setIncludeHamali(false)
      const prods = await DataManager.getProducts()
      setProducts(prods)
    } catch (error) {
      console.error("Error recording sale:", error)
      alert("Error processing sale. Please try again.")
    }
  }

  const loadCustomerTransactions = async (customerId: string) => {
    const sales = await DataManager.getSalesByCustomer(customerId)
    setCustomerTransactions(sales)
    setShowTransactionHistory(true)
  }

  const loadAllTransactions = async () => {
    const sales = await DataManager.getSales()
    setAllTransactions(sales)
    setShowCashTransactions(true)
  }

  if (showAdmin) {
    if (user?.role !== "admin") {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
          <div className="text-center space-y-4 max-w-md bg-slate-850 p-8 rounded-[16px] border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
            <p className="text-slate-400">You do not have permissions to access the Admin Panel.</p>
            <Button onClick={() => setShowAdmin(false)} className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-[9px] font-bold">
              Back to POS Terminal
            </Button>
          </div>
        </div>
      )
    }
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
    <div className="space-y-4">
      <div className="px-2 sm:px-3 md:px-4 lg:px-6 pt-4">
        <Button 
          onClick={() => {
            setCurrentView("all_products")
            setProductSearchQuery("")
          }} 
          className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px] font-medium"
        >
          {t('viewAllProducts')}
        </Button>
      </div>
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4 p-2 sm:p-3 md:p-4 lg:p-6">
        {superCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleSuperCategorySelect(category.id)}
          className="h-20 sm:h-24 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 active:bg-yellow-100 text-black rounded-[12px] sm:rounded-[15px] md:rounded-[18px] lg:rounded-[20px] flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all duration-200 p-2 sm:p-3 touch-manipulation overflow-hidden"
          variant="outline"
        >
          <div className="relative flex-shrink-0">
            {category.image ? (
              <div className="relative">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-[6px] sm:rounded-[8px] md:rounded-[10px] border border-gray-200"
                />
                <span className="absolute -bottom-1 -right-1 text-xs sm:text-sm">{category.icon}</span>
              </div>
            ) : (
              <span className="text-sm sm:text-lg md:text-xl lg:text-2xl">{category.icon}</span>
            )}
          </div>
          <span className="font-medium text-xs sm:text-sm text-center leading-tight break-words hyphens-auto w-full px-1">
            {tName(category)}
          </span>
        </Button>
      ))}
      </div>
    </div>
  )

  const renderSubCategories = () => {
    const filteredSubCategories = subCategories.filter((sub) => sub.superCategoryId === selectedSuperCategory)
    return (
      <div className="space-y-3 sm:space-y-4 p-2 sm:p-4">
        <Button
          onClick={handleBackToSuper}
          variant="outline"
          className="rounded-[9px] border-gray-300 bg-transparent text-sm"
        >
          {t('backToCategories')}
        </Button>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
          {filteredSubCategories.map((subCategory) => (
            <Button
              key={subCategory.id}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              className="h-14 sm:h-16 md:h-18 lg:h-20 xl:h-24 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 active:bg-yellow-100 text-black rounded-[10px] sm:rounded-[12px] md:rounded-[14px] lg:rounded-[15px] flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all duration-200 p-2 sm:p-3 touch-manipulation overflow-hidden"
              variant="outline"
            >
              <div className="relative flex-shrink-0">
                {subCategory.image ? (
                  <div className="relative">
                    <img
                      src={subCategory.image || "/placeholder.svg"}
                      alt={subCategory.name}
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 object-cover rounded-[5px] sm:rounded-[6px] md:rounded-[8px] border border-gray-200"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs sm:text-sm">
                      {subCategory.icon}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm md:text-lg lg:text-xl">{subCategory.icon}</span>
                )}
              </div>
              <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-center leading-tight break-words hyphens-auto w-full px-1">
                {tName(subCategory)}
              </span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    let filteredProducts = currentView === "all_products"
      ? products
      : products.filter((prod) => prod.subCategoryId === selectedSubCategory)
      
    if (productSearchQuery.trim()) {
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (p.nameMr && p.nameMr.toLowerCase().includes(productSearchQuery.toLowerCase())),
      )
    }

    return (
      <div className="space-y-3 sm:space-y-4 p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            {currentView === "products" ? (
              <>
                <Button
                  onClick={handleBackToSub}
                  variant="outline"
                  className="rounded-[9px] border-gray-300 text-xs sm:text-sm bg-transparent"
                >
                  {t('backToSubcategories')}
                </Button>
                <Button
                  onClick={handleBackToSuper}
                  variant="outline"
                  className="rounded-[9px] border-gray-300 text-xs sm:text-sm bg-transparent"
                >
                  {t('backToCategories')}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleBackToSuper}
                variant="outline"
                className="rounded-[9px] border-gray-300 text-xs sm:text-sm bg-transparent"
              >
                {t('backToCategories')}
              </Button>
            )}
          </div>
          {currentView === "all_products" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('searchProducts')}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-9 rounded-[9px] h-10 w-full bg-white border-gray-300"
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="rounded-[11px] border-gray-200 overflow-hidden">
              <CardContent className="p-3 sm:p-4 overflow-hidden">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    {product.image && (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-cover rounded-[8px] sm:rounded-[9px] border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="font-medium text-xs sm:text-sm leading-tight break-words hyphens-auto">
                        {tName(product)}
                      </h3>
                      <div className="flex justify-between items-center mt-1 sm:mt-2">
                        <span className="text-sm sm:text-base md:text-lg font-bold">
                          ₹{getLastUsedRate(product.id) || product.price.toFixed(2)}
                        </span>
                      </div>
                      {product.hamaliValue > 0 && (
                        <div className="text-[10px] sm:text-xs text-gray-500 break-words">
                          {t('hamaliValue')} ₹{product.hamaliValue.toFixed(2)}/{product.unit}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => addToOrder(product)}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black rounded-[9px] font-medium text-sm sm:text-base py-2.5 xs:py-3 min-h-[44px] touch-manipulation"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:w-5 sm:h-5 mr-1 xs:mr-2" />
                    {t('addToOrder')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  const MobileCartSheet = () => (
    <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
      <SheetContent side="right" className="w-full xs:w-80 sm:w-96 md:w-[28rem] p-0 overflow-y-auto">
        <div className="flex flex-col h-full">
          <div className="p-3 xs:p-4 sm:p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2 xs:gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-base sm:text-xl font-bold">{t('orderSummary')}</h2>
            </div>
          </div>

          {orderItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-sm">{t('noItemsInCart')}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-5 space-y-2 xs:space-y-3">
              {orderItems.map((item) => (
                <Card key={item.id} className="rounded-[9px] border-gray-200 overflow-hidden">
                  <CardContent className="p-3 xs:p-4 overflow-hidden">
                    <div className="space-y-2">
                      <div className="font-medium text-sm break-words hyphens-auto leading-tight">{item.name}</div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 xs:w-11 xs:h-11 p-0 rounded-[9px] flex-shrink-0 touch-manipulation"
                        >
                          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                          className="w-18 xs:w-20 h-10 xs:h-11 text-center rounded-[9px] text-sm xs:text-base touch-manipulation"
                          min="1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 xs:w-11 xs:h-11 p-0 rounded-[9px] flex-shrink-0 touch-manipulation"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                        <span className="text-xs text-gray-500 flex-shrink-0">{item.unit}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 flex-shrink-0">{t('rate')}</span>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateUnitPrice(item.id, Number.parseFloat(e.target.value) || 0)}
                          className="w-20 h-7 text-xs rounded-[9px]"
                          step="0.01"
                          min="0"
                        />
                        <span className="text-xs text-gray-500 flex-shrink-0">₹</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">₹{item.lineTotal.toFixed(2)}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromOrder(item.id)}
                          className="w-7 h-7 p-0 rounded-[9px] text-red-500 hover:text-red-700 flex-shrink-0"
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

          {/* Mobile Cart Footer */}
          <div className="border-t border-gray-200 p-3 xs:p-4 sm:p-5 space-y-3 xs:space-y-4 bg-white sticky bottom-0">
            {/* Hamali Charges */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-hamali-mobile"
                  checked={includeHamali}
                  onCheckedChange={(checked) => setIncludeHamali(checked as boolean)}
                />
                <Label htmlFor="include-hamali-mobile" className="text-sm font-medium">
                  {t('includeHamali')}
                </Label>
              </div>
              {includeHamali && (
                <Input
                  type="number"
                  placeholder={t('overrideHamali')}
                  value={hamaliCharges}
                  onChange={(e) => setHamaliCharges(Number.parseFloat(e.target.value) || 0)}
                  className="rounded-[9px]"
                  step="0.01"
                  min="0"
                />
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-medium">{t('subtotal')}</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              {includeHamali && hamaliCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('hamaliFreight')}</span>
                  <span className="font-medium">₹{hamaliCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl border-t pt-2">
                <span className="font-bold">{t('total')}</span>
                <span className="font-bold">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={clearCart}
                variant="outline"
                className="w-full rounded-[9px] border-gray-300 bg-transparent"
                disabled={orderItems.length === 0}
              >
                {t('clearCart')}
              </Button>
              <Button
                onClick={confirmOrder}
                className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black rounded-[9px] font-medium min-h-[48px] text-base touch-manipulation"
                disabled={orderItems.length === 0 || (!isCashSale && !selectedCustomer)}
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                {t('generateEstimate')}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

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

      <div className="relative z-10">
        {/* Main Header */}
        <header className="bg-white border-b border-gray-200 p-4 sm:p-6 sticky top-0 z-20 shadow-sm">
          <div className="flex flex-col gap-2 xs:gap-3 sm:gap-4">
            {/* Top Header Row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-black">{t('appTitle')}</h1>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
                    variant="outline"
                    className="rounded-[9px] border-gray-300 text-xs xs:text-sm font-medium min-h-[44px] touch-manipulation"
                    size="sm"
                  >
                    {language === 'en' ? 'मराठी' : 'EN'}
                  </Button>
                  {user?.role === 'admin' && (
                    <Button
                      onClick={() => setShowAdmin(true)}
                      variant="outline"
                      className="rounded-[9px] border-gray-300 text-xs xs:text-sm sm:text-base min-h-[44px] touch-manipulation"
                      size="sm"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 sm:w-5 sm:h-5 mr-1 xs:mr-2" />
                      <span className="hidden xs:inline">{t('admin')}</span>
                    </Button>
                  )}
                  <Button
                    onClick={logout}
                    variant="outline"
                    className="rounded-[9px] border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs xs:text-sm font-medium min-h-[44px] touch-manipulation flex items-center gap-1.5"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xs:inline">{t('logout')}</span>
                  </Button>
                </div>
              </div>

              {/* Mobile/Tablet Cart Button */}
              {(isMobile || isTablet) && (
                <Button
                  onClick={() => setShowMobileCart(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black rounded-[9px] relative min-h-[44px] touch-manipulation"
                  size="sm"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {orderItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[22px] h-6 flex items-center justify-center rounded-full px-1.5">
                      {orderItems.length}
                    </Badge>
                  )}
                </Button>
              )}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeMainTab} onValueChange={(value: any) => setActiveMainTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto min-h-[44px] gap-1 xs:gap-2">
                <TabsTrigger value="pos" className="text-sm sm:text-base py-2 touch-manipulation">
                  {t('pos')}
                </TabsTrigger>
                <TabsTrigger value="order" className="text-sm sm:text-base py-2 touch-manipulation">
                  {t('order')}
                </TabsTrigger>
                <TabsTrigger value="godown" className="text-sm sm:text-base py-2 touch-manipulation">
                  <span className="hidden xs:inline">{t('godownEntry')}</span>
                  <span className="xs:hidden">{t('godown')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pos" className="mt-4">
                <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-200px)]">
                  {/* POS Content */}
                  <div className="flex-1 flex flex-col">
                    {/* Customer Selection */}
                    <div className="flex flex-col gap-2 xs:gap-3 sm:gap-4 w-full mb-3 xs:mb-4 px-2 xs:px-3 sm:px-4 md:px-6">
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
                          {t('cashSale')}
                        </label>
                      </div>

                      {!isCashSale && (
                        <div className="flex gap-2 w-full">
                          <div className="relative flex-1">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder={t('searchCustomers')}
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              className="pl-10 w-full rounded-[9px] text-sm min-h-[44px] touch-manipulation"
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
                                    <div className="font-medium text-sm break-words">{customer.name}</div>
                                    <div className="text-xs text-gray-500 break-words">{customer.phone}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => setShowAddCustomer(true)}
                            className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black rounded-[9px] flex-shrink-0 min-h-[44px] min-w-[44px] touch-manipulation"
                            size="sm"
                          >
                            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                          </Button>
                        </div>
                      )}

                      {selectedCustomerData && !isCashSale && (
                        <Card className="rounded-[11px] border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="text-sm font-medium break-words">{selectedCustomerData.name}</div>
                                <div className="text-xs text-gray-500 break-words">{selectedCustomerData.phone}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadCustomerTransactions(selectedCustomerData.id)}
                                className="rounded-[9px] flex-shrink-0"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {isCashSale && (
                        <Card className="rounded-[11px] border-yellow-200 bg-yellow-50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-yellow-800">CASH SALE</div>
                                <div className="text-xs text-yellow-600">No customer required</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={loadAllTransactions}
                                className="rounded-[9px] border-yellow-300 bg-transparent flex-shrink-0"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Product Selection Area */}
                    <main className="flex-1 overflow-y-auto">
                      {currentView === "super" && renderSuperCategories()}
                      {currentView === "sub" && renderSubCategories()}
                      {(currentView === "products" || currentView === "all_products") && renderProducts()}
                    </main>
                  </div>

                  {/* Desktop/Tablet Order Summary Panel */}
                  <div className="hidden lg:flex w-full lg:w-96 xl:w-[28rem] bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 flex-col">
                    <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                          <h2 className="text-lg font-bold">{t('orderSummary')}</h2>
                        </div>

                        {orderItems.length === 0 ? (
                          <p className="text-gray-500 text-sm">{t('noItemsInCart')}</p>
                        ) : (
                          <div className="space-y-3 max-h-48 lg:max-h-96 overflow-y-auto">
                            {orderItems.map((item) => (
                              <Card key={item.id} className="rounded-[9px] border-gray-200 overflow-hidden">
                                <CardContent className="p-3 overflow-hidden">
                                  <div className="space-y-2">
                                    <div className="font-medium text-sm break-words hyphens-auto leading-tight">
                                      {item.name}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 p-0 rounded-[9px] flex-shrink-0"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                                        className="w-16 h-8 text-center rounded-[9px] text-sm"
                                        min="1"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 p-0 rounded-[9px] flex-shrink-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-xs text-gray-500 flex-shrink-0">{item.unit}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 flex-shrink-0">{t('rate')}</span>
                                      <Input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                          updateUnitPrice(item.id, Number.parseFloat(e.target.value) || 0)
                                        }
                                        className="w-20 h-7 text-xs rounded-[9px]"
                                        step="0.01"
                                        min="0"
                                      />
                                      <span className="text-xs text-gray-500 flex-shrink-0">₹</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-sm">₹{item.lineTotal.toFixed(2)}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeFromOrder(item.id)}
                                        className="w-7 h-7 p-0 rounded-[9px] text-red-500 hover:text-red-700 flex-shrink-0"
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
                              {t('includeHamali')}
                            </Label>
                          </div>
                          {includeHamali && (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600">
                                {t('autoCalculated')} ₹{calculateHamaliCharges().toFixed(2)}
                              </div>
                              <Input
                                type="number"
                                placeholder={t('overrideHamali')}
                                value={hamaliCharges}
                                onChange={(e) => setHamaliCharges(Number.parseFloat(e.target.value) || 0)}
                                className="rounded-[9px]"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reference and Date Inputs */}
                      <div className="p-4 lg:p-6 border-b border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">{t('referenceOptional')}</Label>
                            <Input
                              placeholder={t('poNumber')}
                              value={estimateReference}
                              onChange={(e) => setEstimateReference(e.target.value)}
                              className="rounded-[9px]"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Estimate Date</Label>
                            <Input
                              type="date"
                              value={estimateDate}
                              onChange={(e) => setEstimateDate(e.target.value)}
                              className="rounded-[9px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Order Totals */}
                      <div className="p-4 lg:p-6 border-b border-gray-200">
                        <div className="space-y-2">
                          <div className="flex justify-between text-lg">
                            <span className="font-medium">{t('subtotal')}</span>
                            <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                          </div>
                          {includeHamali && hamaliCharges > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t('hamaliFreight')}</span>
                              <span className="font-medium">₹{hamaliCharges.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xl border-t pt-2">
                            <span className="font-bold">{t('total')}</span>
                            <span className="font-bold">₹{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 lg:p-6 space-y-3">
                        <Button
                          onClick={clearCart}
                          variant="outline"
                          className="w-full rounded-[9px] border-gray-300 bg-transparent"
                          disabled={orderItems.length === 0}
                        >
                          {t('clearCart')}
                        </Button>
                        <Button
                          onClick={confirmOrder}
                          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px] font-medium"
                          disabled={orderItems.length === 0 || (!isCashSale && !selectedCustomer)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {t('generateEstimate')}
                        </Button>
                      </div>
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="order" className="mt-4">
                <PurchaseOrderModule onBack={() => setActiveMainTab("pos")} />
              </TabsContent>

              <TabsContent value="godown" className="mt-4">
                <InventoryManagement />
              </TabsContent>
            </Tabs>
          </div>
        </header>
      </div>

      {/* Mobile Cart Sheet */}
      <MobileCartSheet />

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
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
              <Button onClick={resetCustomerForm} variant="outline" className="rounded-[9px] bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estimate Dialog */}
      <Dialog
        open={showEstimate}
        onOpenChange={(open) => {
          setShowEstimate(open)
          if (!open) {
            setCurrentView("super")
            setSelectedSuperCategory("")
            setSelectedSubCategory("")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="break-words">Estimate Generated</span>
              <div className=" no-print flex flex-wrap gap-2 no-print">
                <Button
                  onClick={() => editEstimate(currentEstimate!)}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-[9px] text-xs sm:text-sm no-print"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="rounded-[9px] text-xs sm:text-sm bg-transparent no-print"
                  size="sm"
                >
                  <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                  Print
                </Button>
                <Button
                  onClick={printThermalEstimate}
                  variant="outline"
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-[9px] text-xs sm:text-sm no-print"
                  size="sm"
                >
                  <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                  Thermal
                </Button>
                <Button
                  onClick={() => {
                    setShowEstimate(false)
                    setCurrentView("super")
                    setSelectedSuperCategory("")
                    setSelectedSubCategory("")
                  }}
                  variant="outline"
                  className="rounded-[9px] no-print"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {currentEstimate && (
            <div ref={estimateRef} className="estimate bg-white p-4 sm:p-6 lg:p-8">
              {/* Store Header */}
              <div className="header text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-lg sm:text-xl font-bold">{storeInfo.name}</h1> {/* Store name */}
                <p className="text-xs sm:text-sm mt-2 break-words">{storeInfo.address}</p> {/* Store address */}
                <p className="text-xs sm:text-sm mt-1 break-words">
                  Phone: {storeInfo.phone} | Contact: {storeInfo.contact}
                </p>
              </div>

              <div className="flex justify-between mb-6 gap-4">
                {/* Estimate Details Section */}
                <div className="w-1/2">
                  <h2 className="text-sm font-bold estimate-heading">ESTIMATE</h2>
                  <p className="text-sm estimate-details">
                    <strong>Estimate No:</strong> {currentEstimate.estimateNumber}
                  </p>
                  <p className="text-sm estimate-details">
                    <strong>Date:</strong> {currentEstimate.date}
                  </p>
                  {currentEstimate.reference && (
                    <p className="text-sm estimate-details">
                      <strong>Reference:</strong> {currentEstimate.reference}
                    </p>
                  )}
                </div>

                {/* Bill To Section */}
                <div className="w-1/2 text-left sm:text-right">
                  <h3 className="font-bold bill-to-heading">Bill To:</h3>
                  {currentEstimate.isCashSale ? (
                    <p
                      className="text-base sm:text-lg font-bold bill-to-info"
                      style={{ fontSize: "16px", fontWeight: "bold" }}
                    >
                      CASH CUSTOMER
                    </p>
                  ) : (
                    <div>
                      <p className="font-medium break-words bill-to-info">{currentEstimate.customer?.name}</p>
                      <p className="text-sm break-words bill-to-info">{currentEstimate.customer?.address}</p>
                      <p className="text-sm break-words bill-to-info">{currentEstimate.customer?.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left text-xs sm:text-sm">S.No.</th>
                      <th className="border border-black p-2 text-left text-xs sm:text-sm">Particulars</th>
                      <th className="border border-black p-2 text-center text-xs sm:text-sm">QTY</th>
                      <th className="border border-black p-2 text-center text-xs sm:text-sm">Unit</th>
                      <th className="border border-black p-2 text-right text-xs sm:text-sm">Rate </th>
                      <th className="border border-black p-2 text-right text-xs sm:text-sm">Amount </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEstimate.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black p-2 text-xs sm:text-sm">{index + 1}</td>
                        <td className="border border-black p-2 text-xs sm:text-sm break-words hyphens-auto">
                          {item.name}
                        </td>
                        <td className="border border-black p-2 text-center text-xs sm:text-sm">{item.quantity}</td>
                        <td className="border border-black p-2 text-center text-xs sm:text-sm">{item.unit}</td>
                        <td className="border border-black p-2 text-right text-xs sm:text-sm">{item.unitPrice}</td>
                        <td className="border border-black p-2 text-right text-xs sm:text-sm">{item.lineTotal}</td>
                      </tr>
                    ))}
                    {currentEstimate.hamaliCharges > 0 && (
                      <tr>
                        <td colSpan={5} className="border border-black p-2 text-right font-bold text-xs sm:text-sm">
                          Hamali/Freight Charges:
                        </td>
                        <td className="border border-black p-2 text-right font-bold text-xs sm:text-sm">
                          ₹{currentEstimate.hamaliCharges.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td colSpan={5}>Total (INR):</td>
                      <td>₹{currentEstimate.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="footer">
                <p>Thank you for your business!</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Estimate Dialog */}
      <Dialog
        open={showEditEstimate}
        onOpenChange={(open) => {
          setShowEditEstimate(open)
          if (!open) {
            setCurrentView("super")
            setSelectedSuperCategory("")
            setSelectedSubCategory("")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="break-words">Edit Estimate - {editableEstimate?.estimateNumber}</DialogTitle>
          </DialogHeader>

          {editableEstimate && (
            <div className="space-y-6">
              {/* Estimate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-[9px]">
                <div>
                  <Label className="text-sm font-medium">Estimate Number</Label>
                  <p className="text-sm break-words">{editableEstimate.estimateNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm break-words">{editableEstimate.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm break-words">
                    {editableEstimate.isCashSale ? "Cash Customer" : editableEstimate.customer?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm break-words">{editableEstimate.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              {/* Hamali/Freight Charges */}
              <div className="p-4 bg-gray-50 rounded-[9px]">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-hamali-edit"
                      checked={editableEstimate.hamaliCharges > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const autoCalculated = estimateItems.reduce((sum, item) => {
                            const product = products.find((p) => p.id === item.id)
                            return sum + (product?.hamaliValue || 0) * item.quantity
                          }, 0)
                          setEditableEstimate({ ...editableEstimate, hamaliCharges: autoCalculated })
                        } else {
                          setEditableEstimate({ ...editableEstimate, hamaliCharges: 0 })
                        }
                      }}
                    />
                    <Label htmlFor="include-hamali-edit" className="text-sm font-medium">
                      Include Hamali/Freight Charges
                    </Label>
                  </div>
                  {editableEstimate.hamaliCharges > 0 && (
                    <Input
                      type="number"
                      placeholder="Hamali charges"
                      value={editableEstimate.hamaliCharges}
                      onChange={(e) =>
                        setEditableEstimate({
                          ...editableEstimate,
                          hamaliCharges: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="rounded-[9px]"
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
              </div>

              {/* Add New Item Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-semibold">Estimate Items</h3>
                <Button
                  onClick={addNewItemToEstimate}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-[9px] w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Editable Items */}
              <div className="space-y-3">
                {estimateItems.map((item, index) => (
                  <Card key={item.id} className="rounded-[9px]">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-center">
                        <div className="lg:col-span-2">
                          <Label className="text-sm">Product</Label>
                          <p className="font-medium break-words hyphens-auto">{item.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateEstimateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)
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
                              updateEstimateItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                            }
                            className="rounded-[9px]"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Unit</Label>
                          <p className="text-sm text-gray-600 break-words">{item.unit}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Line Total</Label>
                          <p className="font-bold">₹{item.lineTotal.toFixed(2)}</p>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeEstimateItem(item.id)}
                            className="rounded-[9px] text-red-500 hover:text-red-700 w-full sm:w-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Totals */}
              <div className="p-4 bg-gray-50 rounded-[9px]">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold">
                    ₹{estimateItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  onClick={() => setShowEditEstimate(false)}
                  variant="outline"
                  className="rounded-[9px] w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEstimateChanges}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px] w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item to Estimate Dialog */}
      <Dialog open={showAddItemToEstimate} onOpenChange={setShowAddItemToEstimate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Add Item to Estimate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={productSearchForEstimate}
                onChange={(e) => setProductSearchForEstimate(e.target.value)}
                className="pl-10 rounded-[9px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredProductsForEstimate.map((product) => (
                <Card key={product.id} className="rounded-[9px] border-gray-200 cursor-pointer hover:bg-gray-50">
                  <CardContent className="p-3" onClick={() => addProductToEstimate(product)}>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        {product.image && (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-[9px] border border-gray-200 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm break-words hyphens-auto">{product.name}</h3>
                          <div className="text-sm text-gray-600">
                            <p>Price: ₹{product.price.toFixed(2)}</p>
                            <p>Unit: {product.unit}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Transaction History Dialog */}
      <Dialog
        open={showTransactionHistory}
        onOpenChange={(open) => {
          setShowTransactionHistory(open)
          if (!open) {
            setCurrentView("super")
            setSelectedSuperCategory("")
            setSelectedSubCategory("")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="break-words">
              Customer Transaction History - {selectedCustomerData?.name}
            </DialogTitle>
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
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium break-words">{transaction.estimateNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {transaction.paymentMethod.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 break-words">
                        <span>{format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm")}</span>
                        <span className="mx-2">•</span>
                        <span>{transaction.items.length} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-right flex-1 sm:flex-none">
                        <div className="font-bold">{formatCurrency(transaction.total)}</div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const estimate = {
                              estimateNumber: transaction.estimateNumber,
                              date: new Date(transaction.timestamp).toLocaleDateString("en-IN"),
                              customer: selectedCustomerData,
                              items: transaction.items.map((item) => ({
                                id: item.productId,
                                name: item.productName || "Unknown Product",
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                lineTotal: item.quantity * item.unitPrice,
                                unit: item.unit || "unit",
                              })),
                              subtotal: transaction.subtotal,
                              hamaliCharges: transaction.hamaliCharges || 0,
                              total: transaction.total,
                              isCashSale: false,
                              paymentMethod: transaction.paymentMethod,
                              reference: transaction.reference,
                            }
                            setCurrentEstimate(estimate)
                            setShowEstimate(true)
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
                            const estimate = {
                              estimateNumber: transaction.estimateNumber,
                              date: new Date(transaction.timestamp).toLocaleDateString("en-IN"),
                              customer: selectedCustomerData,
                              items: transaction.items.map((item) => ({
                                id: item.productId,
                                name: item.productName || "Unknown Product",
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                lineTotal: item.quantity * item.unitPrice,
                                unit: item.unit || "unit",
                              })),
                              subtotal: transaction.subtotal,
                              hamaliCharges: transaction.hamaliCharges || 0,
                              total: transaction.total,
                              isCashSale: false,
                              paymentMethod: transaction.paymentMethod,
                              reference: transaction.reference,
                            }
                            editEstimate(estimate)
                            setShowTransactionHistory(false)
                          }}
                          className="rounded-[9px]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Sale Transactions Dialog */}
      <Dialog
        open={showCashTransactions}
        onOpenChange={(open) => {
          setShowCashTransactions(open)
          if (!open) {
            setCurrentView("super")
            setSelectedSuperCategory("")
            setSelectedSubCategory("")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
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
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium break-words">{transaction.estimateNumber}</span>
                          <Badge variant={transaction.isCashSale ? "secondary" : "default"} className="text-xs">
                            {transaction.isCashSale ? "Cash" : "Customer"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {transaction.paymentMethod.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 break-words">
                          <span>{format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm")}</span>
                          <span className="mx-2">•</span>
                          <span>{transaction.customerName || "Cash Customer"}</span>
                          <span className="mx-2">•</span>
                          <span>{transaction.items.length} items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="text-right flex-1 sm:flex-none">
                          <div className="font-bold">{formatCurrency(transaction.total)}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const estimate = {
                                estimateNumber: transaction.estimateNumber,
                                date: new Date(transaction.timestamp).toLocaleDateString("en-IN"),
                                customer: transaction.isCashSale
                                  ? null
                                  : {
                                    name: transaction.customerName || "Unknown Customer",
                                    phone: transaction.customerPhone || "",
                                    address: customers.find((c) => c.id === transaction.customerId)?.address || "",
                                  },
                                items: transaction.items.map((item) => ({
                                  id: item.productId,
                                  name: item.productName || "Unknown Product",
                                  quantity: item.quantity,
                                  unitPrice: item.unitPrice,
                                  lineTotal: item.quantity * item.unitPrice,
                                  unit: item.unit || "unit",
                                })),
                                subtotal: transaction.subtotal,
                                hamaliCharges: transaction.hamaliCharges || 0,
                                total: transaction.total,
                                isCashSale: transaction.isCashSale,
                                paymentMethod: transaction.paymentMethod,
                                reference: transaction.reference,
                              }
                              setCurrentEstimate(estimate)
                              setShowEstimate(true)
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
                              const estimate = {
                                estimateNumber: transaction.estimateNumber,
                                date: new Date(transaction.timestamp).toLocaleDateString("en-IN"),
                                customer: transaction.isCashSale
                                  ? null
                                  : {
                                    name: transaction.customerName || "Unknown Customer",
                                    phone: transaction.customerPhone || "",
                                    address: customers.find((c) => c.id === transaction.customerId)?.address || "",
                                  },
                                items: transaction.items.map((item) => ({
                                  id: item.productId,
                                  name: item.productName || "Unknown Product",
                                  quantity: item.quantity,
                                  unitPrice: item.unitPrice,
                                  lineTotal: item.quantity * item.unitPrice,
                                  unit: item.unit || "unit",
                                })),
                                subtotal: transaction.subtotal,
                                hamaliCharges: transaction.hamaliCharges || 0,
                                total: transaction.total,
                                isCashSale: transaction.isCashSale,
                                paymentMethod: transaction.paymentMethod,
                                reference: transaction.reference,
                              }
                              editEstimate(estimate)
                              setShowCashTransactions(false)
                            }}
                            className="rounded-[9px]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
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

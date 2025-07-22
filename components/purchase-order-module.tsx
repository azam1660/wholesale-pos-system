"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  FileText,
  Printer,
  User,
  UserPlus,
  Package,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import "jspdf-autotable"
import { DataManager } from "./data-manager"

interface PurchaseOrderItem {
  id: string
  name: string
  quantity: number
  unit: string
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  date: string
  supplierId?: string
  supplierName?: string
  supplierPhone?: string
  isCashPurchase: boolean
  items: PurchaseOrderItem[]
  subtotal: number
  total: number
  status: "pending" | "completed" | "cancelled"
  reference?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

const storeInfo = {
  name: "SNS",
  address: "Jodbhavi Peth, Solapur",
  phone: "9420490692",
}

// Purchase Order counter
const getPOCounter = () => {
  const stored = localStorage.getItem("poCounter")
  return stored ? Number.parseInt(stored) : 1
}

const setPOCounter = (counter: number) => {
  localStorage.setItem("poCounter", counter.toString())
}

export default function PurchaseOrderModule({ onBack }: { onBack: () => void }) {
  const [currentView, setCurrentView] = useState<"super" | "sub" | "products">("super")
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([])
  const [supplierSearch, setSupplierSearch] = useState("")
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false)
  const [currentPO, setCurrentPO] = useState<PurchaseOrder | null>(null)
  const [isCashPurchase, setIsCashPurchase] = useState(true)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [orderReference, setOrderReference] = useState("")
  const [orderNotes, setOrderNotes] = useState("")
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0])
  const [showPOHistory, setShowPOHistory] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Data states
  const [superCategories, setSuperCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const poRef = useRef<HTMLDivElement>(null)

  const PRINT_UTILITY_API_URL = process.env.NEXT_PUBLIC_PRINT_UTILITY_API_URL || "http://localhost:5000"
  const THERMAL_PRINTER = process.env.NEXT_PUBLIC_THERMAL_PRINTER || "Microsoft Print to PDF"
  const LAZER_PRINTER = process.env.NEXT_PUBLIC_LAZER_PRINTER || "Microsoft Print to PDF"

  // Load data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [superCats, subCats, prods] = await Promise.all([
          DataManager.getSuperCategories(),
          DataManager.getSubCategories(),
          DataManager.getProducts(),
        ])

        setSuperCategories(superCats)
        setSubCategories(subCats)
        setProducts(prods)
        loadSuppliers()
        loadPurchaseOrders()
        setDataLoaded(true)
      } catch (error) {
        console.error("Error loading data:", error)
        setDataLoaded(true)
      }
    }

    loadAllData()
  }, [])

  const loadSuppliers = () => {
    const stored = localStorage.getItem("suppliers")
    if (stored) {
      setSuppliers(JSON.parse(stored))
    }
  }

  const loadPurchaseOrders = () => {
    const stored = localStorage.getItem("purchaseOrders")
    if (stored) {
      setPurchaseOrders(JSON.parse(stored))
    }
  }

  const saveSuppliers = (suppliersData: Supplier[]) => {
    localStorage.setItem("suppliers", JSON.stringify(suppliersData))
    setSuppliers(suppliersData)
  }

  const savePurchaseOrders = (orders: PurchaseOrder[]) => {
    localStorage.setItem("purchaseOrders", JSON.stringify(orders))
    setPurchaseOrders(orders)
  }

  const generatePONumber = () => {
    const counter = getPOCounter()
    const date = new Date(orderDate)
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "")
    const poNumber = `PO/${dateStr}/${counter.toString().padStart(4, "0")}`
    setPOCounter(counter + 1)
    return poNumber
  }

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      supplier.email.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      supplier.phone.includes(supplierSearch),
  )

  const selectedSupplierData = suppliers.find((s) => s.id === selectedSupplier)

  const handleSaveSupplier = () => {
    if (!supplierForm.name.trim()) return

    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: supplierForm.name.trim(),
      email: supplierForm.email.trim(),
      phone: supplierForm.phone.trim(),
      address: supplierForm.address.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedSuppliers = [...suppliers, newSupplier]
    saveSuppliers(updatedSuppliers)
    setSelectedSupplier(newSupplier.id)
    resetSupplierForm()
  }

  const resetSupplierForm = () => {
    setSupplierForm({ name: "", email: "", phone: "", address: "" })
    setShowAddSupplier(false)
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

  const addToOrder = (product: any) => {
    const existingItem = orderItems.find((item) => item.id === product.id)
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: PurchaseOrderItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit,
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId)
      return
    }
    setOrderItems((items) => items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromOrder = (itemId: string) => {
    setOrderItems((items) => items.filter((item) => item.id !== itemId))
  }

  const clearCart = () => {
    setOrderItems([])
    setEditingPO(null)
    setIsEditMode(false)
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const generatePurchaseOrder = () => {
    if (isEditMode && editingPO) {
      // Update existing purchase order
      const updatedPO: PurchaseOrder = {
        ...editingPO,
        date: orderDate,
        supplierId: isCashPurchase ? undefined : selectedSupplier,
        supplierName: isCashPurchase ? "Cash Purchase" : selectedSupplierData?.name,
        supplierPhone: isCashPurchase ? undefined : selectedSupplierData?.phone,
        isCashPurchase,
        items: [...orderItems],
        reference: orderReference,
        notes: orderNotes,
        updatedAt: new Date().toISOString(),
      }

      const updatedOrders = purchaseOrders.map((po) => (po.id === editingPO.id ? updatedPO : po))
      savePurchaseOrders(updatedOrders)
      setCurrentPO(updatedPO)
    } else {
      // Create new purchase order
      const orderNumber = generatePONumber()
      const purchaseOrder: PurchaseOrder = {
        id: Date.now().toString(),
        orderNumber,
        date: orderDate,
        supplierId: isCashPurchase ? undefined : selectedSupplier,
        supplierName: isCashPurchase ? "Cash Purchase" : selectedSupplierData?.name,
        supplierPhone: isCashPurchase ? undefined : selectedSupplierData?.phone,
        isCashPurchase,
        items: [...orderItems],
        subtotal: 0,
        total: 0,
        status: "pending",
        reference: orderReference,
        notes: orderNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedOrders = [...purchaseOrders, purchaseOrder]
      savePurchaseOrders(updatedOrders)
      setCurrentPO(purchaseOrder)
    }

    setShowPurchaseOrder(true)
  }

  const printPurchaseOrder = () => {
    if (!currentPO) return

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order - ${currentPO.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            padding: 8mm;
          }
          .po { max-width: 100%; }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .company-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
          .company-details { font-size: 9px; margin-bottom: 2px; }
          .po-title { font-size: 14px; font-weight: bold; margin-top: 4px; }

          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            gap: 10px;
          }
          .info-left, .info-right { flex: 1; }
          .info-right { text-align: right; }
          .info-label { font-weight: bold; font-size: 10px; }
          .info-value { font-size: 10px; margin-bottom: 2px; }

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

          .footer {
            display: flex;
            justify-content: space-between;
            align-items: end;
            margin-top: 12px;
            font-size: 9px;
          }
          .signature-section {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 2px;
            width: 120px;
            margin-top: 20px;
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
        <div class="po">
          <!-- Header -->
          <div class="header">
            <div class="company-name">${storeInfo.name}</div>
            <div class="company-details">${storeInfo.address}</div>
            <div class="company-details">Contact: ${storeInfo.phone}</div>
            <div class="po-title">PURCHASE ORDER</div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <div class="info-left">
              <div class="info-label">PO Details:</div>
              <div class="info-value">PO No: ${currentPO.orderNumber}</div>
              <div class="info-value">Date: ${currentPO.date}</div>
              <div class="info-value">Status: ${currentPO.status.toUpperCase()}</div>
              ${currentPO.reference ? `<div class="info-value">Ref: ${currentPO.reference}</div>` : ""}
            </div>
            <div class="info-right">
              <div class="info-label">Supplier:</div>
              ${currentPO.isCashPurchase
        ? '<div class="info-value" style="font-weight: bold;">CASH PURCHASE</div>'
        : `<div class="info-value">${currentPO.supplierName || ""}</div>
                 <div class="info-value">${currentPO.supplierPhone || ""}</div>`
      }
            </div>
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 60%;">Item</th>
                <th style="width: 16%;">QTY</th>
                <th style="width: 16%;">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${currentPO.items
        .map(
          (item, index) => `
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

          ${currentPO.notes
        ? `
            <div style="margin-top: 10px;">
              <div class="info-label">Notes:</div>
              <div class="info-value">${currentPO.notes}</div>
            </div>
          `
        : ""
      }

          <!-- Footer -->
          <div class="footer">
            <div>
              <div>Thank you for your service!</div>
              <div>Terms & Conditions Apply</div>
            </div>
            <div class="signature-section">
              <div>Authorized Signature</div>
              <div style="font-size: 8px; margin-top: 2px;">${storeInfo.name}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) {
      alert("Please allow popups for this website to enable printing.")
      return
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()

        // Close window after printing (with delay to ensure print dialog appears)
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    }

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }
    }, 1000)
  }

  const printThermalPurchaseOrder = () => {
    if (!currentPO) return

    const generateTextOutput = (po, store) => {
      const lines = []
      const center = (text) => text.padStart(Math.floor((48 + text.length) / 2), " ")
      const line = (char = "-") => char.repeat(48)

      lines.push(center(store.name))
      lines.push(center(store.address))
      lines.push(center(`Contact: ${store.phone}`))
      lines.push(line("="))
      lines.push(`PO No: ${po.orderNumber}`)
      lines.push(`Date : ${po.date}`)
      lines.push(`Status: ${po.status.toUpperCase()}`)
      if (po.reference) {
        lines.push(`Ref  : ${po.reference}`)
      }
      lines.push(line())

      lines.push("Supplier:")
      if (po.isCashPurchase) {
        lines.push("CASH PURCHASE")
      } else {
        if (po.supplierName) lines.push(po.supplierName)
        if (po.supplierPhone) lines.push(po.supplierPhone)
      }
      lines.push(line())

      lines.push("Item                            Qty Unit")
      lines.push(line())

      po.items.forEach((item) => {
        const name = item.name.substring(0, 30).padEnd(30)
        const qty = String(item.quantity).padStart(4)
        const unit = item.unit.substring(0, 4).padStart(4)
        lines.push(`${name}${qty} ${unit}`)
      })

      lines.push(line())
      if (po.notes) {
        lines.push("Notes:")
        lines.push(po.notes)
        lines.push(line())
      }
      lines.push(center("Thank you for your service!"))
      lines.push(center("Terms & Conditions Apply"))

      return lines.join("\n")
    }

    const textOutput = generateTextOutput(currentPO, storeInfo)

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Thermal PO - ${currentPO.orderNumber}</title>
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
      <body>${textOutput}</body>
    </html>
  `

    const printWindow = window.open("", "_blank", "width=400,height=600")
    if (!printWindow) {
      alert("Please allow popups for this website to enable printing.")
      return
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()

        // Close window after printing (with delay to ensure print dialog appears)
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    }

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }
    }, 1000)
  }

  const editPurchaseOrder = (po: PurchaseOrder) => {
    setEditingPO(po)
    setIsEditMode(true)
    setOrderItems([...po.items])
    setOrderDate(po.date)
    setIsCashPurchase(po.isCashPurchase)
    setSelectedSupplier(po.supplierId || "")
    setOrderReference(po.reference || "")
    setOrderNotes(po.notes || "")
    setCurrentView("super")
  }

  const deletePurchaseOrder = (poId: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      const updatedOrders = purchaseOrders.filter((po) => po.id !== poId)
      savePurchaseOrders(updatedOrders)
    }
  }

  const convertToPOS = (po: PurchaseOrder) => {
    // Store the PO data in localStorage for POS to pick up
    const posData = {
      items: po.items,
      reference: `PO: ${po.orderNumber}`,
    }
    localStorage.setItem("posPrefilledOrder", JSON.stringify(posData))

    // Navigate to POS
    onBack()
    alert("Purchase Order items have been added to POS. Please switch to the POS tab.")
  }

  const updatePOStatus = (poId: string, status: "pending" | "completed" | "cancelled") => {
    const updatedOrders = purchaseOrders.map((po) =>
      po.id === poId ? { ...po, status, updatedAt: new Date().toISOString() } : po,
    )
    savePurchaseOrders(updatedOrders)
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Purchase Order Module...</p>
        </div>
      </div>
    )
  }

  const renderSuperCategories = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-4">
      {superCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleSuperCategorySelect(category.id)}
          className="h-16 sm:h-20 md:h-24 lg:h-28 w-full bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-black rounded-[12px] sm:rounded-[15px] md:rounded-[20px] flex flex-col items-center justify-center gap-1 sm:gap-2 transition-colors p-2 sm:p-3"
          variant="outline"
        >
          <div className="relative flex-shrink-0">
            {category.image ? (
              <div className="relative">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-cover rounded-[6px] sm:rounded-[8px] md:rounded-[10px] border border-gray-200"
                />
                <span className="absolute -bottom-1 -right-1 text-xs sm:text-sm md:text-base">{category.icon}</span>
              </div>
            ) : (
              <span className="text-sm sm:text-lg md:text-xl lg:text-2xl">{category.icon}</span>
            )}
          </div>
          <span className="font-medium text-[10px] sm:text-xs md:text-sm text-center leading-tight break-words hyphens-auto max-w-full">
            {category.name}
          </span>
        </Button>
      ))}
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
          ← Back to Categories
        </Button>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {filteredSubCategories.map((subCategory) => (
            <Button
              key={subCategory.id}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              className="h-14 sm:h-16 md:h-20 lg:h-24 w-full bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-black rounded-[10px] sm:rounded-[12px] md:rounded-[15px] flex flex-col items-center justify-center gap-1 sm:gap-2 transition-colors p-2 sm:p-3"
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
                    <span className="absolute -bottom-1 -right-1 text-[10px] sm:text-xs md:text-sm">
                      {subCategory.icon}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm md:text-lg lg:text-xl">{subCategory.icon}</span>
                )}
              </div>
              <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-center leading-tight break-words hyphens-auto max-w-full">
                {subCategory.name}
              </span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    const filteredProducts = products.filter((prod) => prod.subCategoryId === selectedSubCategory)
    return (
      <div className="space-y-3 sm:space-y-4 p-2 sm:p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleBackToSub}
            variant="outline"
            className="rounded-[9px] border-gray-300 text-xs sm:text-sm bg-transparent"
          >
            ← Back to Subcategories
          </Button>
          <Button
            onClick={handleBackToSuper}
            variant="outline"
            className="rounded-[9px] border-gray-300 text-xs sm:text-sm bg-transparent"
          >
            ← Back to Categories
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="rounded-[11px] border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    {product.image && (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-cover rounded-[8px] sm:rounded-[9px] border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs sm:text-sm md:text-base leading-tight break-words hyphens-auto">
                        {product.name}
                      </h3>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        Stock: {product.stock} {product.unit}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => addToOrder(product)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-[9px] font-medium text-xs sm:text-sm md:text-base py-2"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" className="rounded-[9px] bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to POS
              </Button>
              <h1 className="text-xl font-bold">Purchase Orders</h1>
            </div>
            <Button
              onClick={() => setShowPOHistory(true)}
              variant="outline"
              className="rounded-[9px] border-gray-300 bg-transparent"
            >
              <FileText className="w-4 h-4 mr-2" />
              PO History
            </Button>
          </div>

          {/* Supplier Selection */}
          <div className="flex flex-col gap-3 sm:gap-4 w-full p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cash-purchase"
                checked={isCashPurchase}
                onCheckedChange={(checked) => {
                  setIsCashPurchase(checked as boolean)
                  if (checked) {
                    setSelectedSupplier("")
                    setSupplierSearch("")
                  }
                }}
              />
              <label htmlFor="cash-purchase" className="text-sm font-medium">
                Cash Purchase
              </label>
            </div>

            {!isCashPurchase && (
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search suppliers..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="pl-10 w-full rounded-[9px] text-sm"
                  />
                  {supplierSearch && filteredSuppliers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-[9px] mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
                      {filteredSuppliers.map((supplier) => (
                        <button
                          key={supplier.id}
                          onClick={() => {
                            setSelectedSupplier(supplier.id)
                            setSupplierSearch("")
                          }}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm break-words">{supplier.name}</div>
                          <div className="text-xs text-gray-500 break-words">{supplier.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setShowAddSupplier(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-[9px] flex-shrink-0"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {selectedSupplierData && !isCashPurchase && (
              <Card className="rounded-[11px] border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium break-words">{selectedSupplierData.name}</div>
                      <div className="text-xs text-gray-500 break-words">{selectedSupplierData.phone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isCashPurchase && (
              <Card className="rounded-[11px] border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-blue-800">CASH PURCHASE</div>
                      <div className="text-xs text-blue-600">No supplier required</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Product Selection Area */}
          <main className="flex-1 overflow-y-auto">
            {currentView === "super" && renderSuperCategories()}
            {currentView === "sub" && renderSubCategories()}
            {currentView === "products" && renderProducts()}
          </main>
        </div>

        {/* Order Summary Panel */}
        <div className="w-full lg:w-96 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5" />
              <h2 className="text-lg font-bold">
                {isEditMode ? `Edit PO: ${editingPO?.orderNumber}` : "Purchase Order"}
              </h2>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items in order</p>
            ) : (
              <div className="space-y-3 max-h-48 lg:max-h-96 overflow-y-auto">
                {orderItems.map((item) => (
                  <Card key={item.id} className="rounded-[9px] border-gray-200">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="font-medium text-sm break-words hyphens-auto leading-tight">{item.name}</div>

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

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
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

          {/* Reference and Date Inputs */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Reference (Optional)</Label>
                <Input
                  placeholder="Reference number or note"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  className="rounded-[9px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Order Date</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="rounded-[9px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="rounded-[9px]"
                />
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
              {isEditMode ? "Cancel Edit" : "Clear Order"}
            </Button>
            <Button
              onClick={generatePurchaseOrder}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-[9px] font-medium"
              disabled={orderItems.length === 0 || (!isCashPurchase && !selectedSupplier)}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isEditMode ? "Update Purchase Order" : "Generate Purchase Order"}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier-name">Name *</Label>
              <Input
                id="supplier-name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="supplier-address">Address</Label>
              <Textarea
                id="supplier-address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveSupplier}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-[9px]"
                disabled={!supplierForm.name.trim()}
              >
                Add Supplier
              </Button>
              <Button onClick={resetSupplierForm} variant="outline" className="rounded-[9px] bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog open={showPurchaseOrder} onOpenChange={setShowPurchaseOrder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="break-words">Purchase Order Generated</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={printPurchaseOrder}
                  variant="outline"
                  className="rounded-[9px] text-xs sm:text-sm bg-transparent"
                  size="sm"
                >
                  <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                  Print
                </Button>
                <Button
                  onClick={printThermalPurchaseOrder}
                  variant="outline"
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-[9px] text-xs sm:text-sm"
                  size="sm"
                >
                  <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                  Thermal
                </Button>
                <Button
                  onClick={() => convertToPOS(currentPO!)}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-[9px] text-xs sm:text-sm"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-1 sm:mr-2" />
                  Convert to POS
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {currentPO && (
            <div ref={poRef} className="po bg-white p-4 sm:p-6 lg:p-8">
              {/* Store Header */}
              <div className="header text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">{storeInfo.name}</h1>
                <p className="text-xs sm:text-sm mt-2 break-words">{storeInfo.address}</p>
                <p className="text-xs sm:text-sm mt-1 break-words">Contact: {storeInfo.phone}</p>
              </div>

              {/* PO Details */}
              <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">PURCHASE ORDER</h2>
                  <p className="text-sm break-words">
                    <strong>PO No:</strong> {currentPO.orderNumber}
                  </p>
                  <p className="text-sm break-words">
                    <strong>Date:</strong> {currentPO.date}
                  </p>
                  <p className="text-sm break-words">
                    <strong>Status:</strong>{" "}
                    <Badge
                      variant={
                        currentPO.status === "completed"
                          ? "default"
                          : currentPO.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {currentPO.status.toUpperCase()}
                    </Badge>
                  </p>
                  {currentPO.reference && (
                    <p className="text-sm break-words">
                      <strong>Reference:</strong> {currentPO.reference}
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="font-bold">Supplier:</h3>
                  {currentPO.isCashPurchase ? (
                    <p className="text-base sm:text-lg font-bold">CASH PURCHASE</p>
                  ) : (
                    <div>
                      <p className="font-medium break-words">{currentPO.supplierName}</p>
                      <p className="text-sm break-words">{currentPO.supplierPhone}</p>
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
                      <th className="border border-black p-2 text-left text-xs sm:text-sm">Item</th>
                      <th className="border border-black p-2 text-center text-xs sm:text-sm">QTY</th>
                      <th className="border border-black p-2 text-center text-xs sm:text-sm">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPO.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black p-2 text-xs sm:text-sm">{index + 1}</td>
                        <td className="border border-black p-2 text-xs sm:text-sm break-words hyphens-auto">
                          {item.name}
                        </td>
                        <td className="border border-black p-2 text-center text-xs sm:text-sm">{item.quantity}</td>
                        <td className="border border-black p-2 text-center text-xs sm:text-sm">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {currentPO.notes && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Notes:</h3>
                  <p className="text-sm break-words">{currentPO.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-8 gap-4">
                <div>
                  <p className="text-xs sm:text-sm">Thank you for your service!</p>
                  <p className="text-xs sm:text-sm">Terms & Conditions Apply</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-black pt-2 mt-8 sm:mt-16 w-32 sm:w-48">
                    <p className="text-xs sm:text-sm">Authorized Signature</p>
                    <p className="text-xs break-words">{storeInfo.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Order History Dialog */}
      <Dialog open={showPOHistory} onOpenChange={setShowPOHistory}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No purchase orders found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {purchaseOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((po) => (
                    <div
                      key={po.id}
                      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-[9px] hover:bg-gray-50 gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-medium break-words">{po.orderNumber}</span>
                          <Badge
                            variant={
                              po.status === "completed"
                                ? "default"
                                : po.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {po.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {po.isCashPurchase ? "Cash" : "Supplier"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 break-words">
                          <span>{format(new Date(po.createdAt), "MMM dd, yyyy HH:mm")}</span>
                          <span className="mx-2">•</span>
                          <span>{po.supplierName || "Cash Purchase"}</span>
                          <span className="mx-2">•</span>
                          <span>{po.items.length} items</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentPO(po)
                            setShowPurchaseOrder(true)
                            setShowPOHistory(false)
                          }}
                          className="rounded-[9px] flex-1 lg:flex-none"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            editPurchaseOrder(po)
                            setShowPOHistory(false)
                          }}
                          className="rounded-[9px] flex-1 lg:flex-none"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => convertToPOS(po)}
                          className="rounded-[9px] bg-green-50 hover:bg-green-100 text-green-700 flex-1 lg:flex-none"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          To POS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePurchaseOrder(po.id)}
                          className="rounded-[9px] text-red-500 hover:text-red-700 flex-1 lg:flex-none"
                        >
                          <Trash2 className="w-4 h-4" />
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

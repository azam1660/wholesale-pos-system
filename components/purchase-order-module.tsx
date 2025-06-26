"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  FileText,
  Printer,
  Download,
  User,
  UserPlus,
  Package,
  Eye,
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
import jsPDF from "jspdf"
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
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const generatePurchaseOrder = () => {
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
    setShowPurchaseOrder(true)
  }

  const printPurchaseOrder = () => {
    if (poRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Purchase Order - ${currentPO?.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .po { max-width: 800px; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .header { text-align: center; margin-bottom: 20px; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${poRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const confirmOrder = () => {
    if (orderItems.length === 0) return
    if (!isCashPurchase && !selectedSupplier) return

    generatePurchaseOrder()

    // Clear form
    clearCart()
    setSelectedSupplier("")
    setIsCashPurchase(true)
    setOrderReference("")
    setOrderNotes("")
    setOrderDate(new Date().toISOString().split("T")[0])
  }

  const convertToPOS = () => {
    // Store the order items in localStorage to be picked up by POS
    const posOrderData = {
      items: orderItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      supplier: isCashPurchase ? null : selectedSupplierData,
      reference: orderReference,
      timestamp: Date.now(),
    }

    localStorage.setItem("posPrefilledOrder", JSON.stringify(posOrderData))

    // Redirect to POS
    window.location.href = "/"
  }

  const printThermalPurchaseOrder = (po: PurchaseOrder) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Thermal Purchase Order - ${po.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 5px;
            width: 79mm;
            font-size: 12px;
            line-height: 1.2;
          }
          .thermal-po {
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
        <div class="thermal-po">
          <!-- Store Header -->
          <div class="center header">${storeInfo.name}</div>
          <div class="center sub-header">${storeInfo.address}</div>
          <div class="center sub-header">Ph: ${storeInfo.phone}</div>
          <div class="double-line"></div>

          <!-- PO Details -->
          <div class="center bold">PURCHASE ORDER</div>
          <div class="line"></div>
          <div class="left">
            <div><strong>PO No:</strong> ${po.orderNumber}</div>
            <div><strong>Date:</strong> ${po.date}</div>
            <div><strong>Status:</strong> ${po.status.toUpperCase()}</div>
            ${po.reference ? `<div><strong>Ref:</strong> ${po.reference}</div>` : ""}
          </div>

          <!-- Supplier Details -->
          <div class="line"></div>
          <div class="left">
            <strong>Supplier:</strong>
            ${po.isCashPurchase
        ? "<div>CASH PURCHASE</div>"
        : `<div>${po.supplierName || ""}</div>
                   <div>${po.supplierPhone || ""}</div>`
      }
          </div>
          <div class="line"></div>

          <!-- Items Header -->
          <div class="item-row bold">
            <div class="item-name">Item</div>
            <div class="item-qty">Qty</div>
          </div>
          <div class="line"></div>

          <!-- Items -->
          ${po.items
        .map(
          (item) => `
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
            <div>${po.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
          </div>
          <div class="double-line"></div>

          <!-- Summary -->
          <div class="center sub-header">
            <div>Items: ${po.items.length}</div>
            <div>Type: ${po.isCashPurchase ? "CASH" : "SUPPLIER"}</div>
          </div>

          <!-- Footer -->
          <div class="center footer">
            <div>Terms & Conditions Apply</div>
            <div>${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </body>
    </html>
  `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
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
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-[11px] border border-gray-200"
              />
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
                  <img
                    src={subCategory.image || "/placeholder.svg"}
                    alt={subCategory.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-[9px] border border-gray-200"
                  />
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
                        <span className="text-lg font-bold">₹{product.price.toFixed(2)}</span>
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
                <Button onClick={onBack} variant="outline" className="rounded-[9px] border-gray-300" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold text-black">Purchase Orders</h1>
                <Button
                  onClick={() => setShowPOHistory(true)}
                  variant="outline"
                  className="rounded-[9px] border-gray-300"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  History
                </Button>
              </div>

              {/* Supplier Selection */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
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
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search suppliers..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="pl-10 w-full sm:w-64 rounded-[9px]"
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
                              <div className="font-medium text-sm">{supplier.name}</div>
                              <div className="text-xs text-gray-500">{supplier.phone}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowAddSupplier(true)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                      size="sm"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {selectedSupplierData && !isCashPurchase && (
                  <Card className="rounded-[11px] border-gray-200 w-full sm:w-auto">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{selectedSupplierData.name}</div>
                      <div className="text-xs text-gray-500">{selectedSupplierData.phone}</div>
                    </CardContent>
                  </Card>
                )}

                {isCashPurchase && (
                  <Card className="rounded-[11px] border-yellow-200 bg-yellow-50 w-full sm:w-auto">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium text-yellow-800">CASH PURCHASE</div>
                      <div className="text-xs text-yellow-600">No supplier required</div>
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
              <h2 className="text-lg font-bold">Purchase Order</h2>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items in order</p>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Order Totals */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-xl">
                <span className="font-bold">Total:</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="space-y-3">
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
                <Label className="text-sm font-medium">Reference (Optional)</Label>
                <Input
                  placeholder="Reference number"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  className="rounded-[9px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  placeholder="Order notes"
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
              className="w-full rounded-[9px] border-gray-300"
              disabled={orderItems.length === 0}
            >
              Clear Order
            </Button>
            <Button
              onClick={convertToPOS}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-[9px] font-medium"
              disabled={orderItems.length === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Convert to POS
            </Button>
            <Button
              onClick={confirmOrder}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px] font-medium"
              disabled={orderItems.length === 0 || (!isCashPurchase && !selectedSupplier)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Purchase Order
            </Button>
          </div>
        </div>
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-md">
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
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={!supplierForm.name.trim()}
              >
                Add Supplier
              </Button>
              <Button onClick={resetSupplierForm} variant="outline" className="rounded-[9px]">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog open={showPurchaseOrder} onOpenChange={setShowPurchaseOrder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Purchase Order Generated</span>
              <div className="flex gap-2">
                <Button onClick={printPurchaseOrder} variant="outline" className="rounded-[9px]">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  onClick={() => printThermalPurchaseOrder(currentPO!)}
                  variant="outline"
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-[9px]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Thermal
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {currentPO && (
            <div ref={poRef} className="po bg-white p-8">
              {/* Store Header */}
              <div className="header text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-bold">{storeInfo.name}</h1>
                <p className="text-sm mt-2">{storeInfo.address}</p>
                <p className="text-sm mt-1">Contact: {storeInfo.phone}</p>
              </div>

              {/* PO Details */}
              <div className="flex justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">PURCHASE ORDER</h2>
                  <p>
                    <strong>PO No:</strong> {currentPO.orderNumber}
                  </p>
                  <p>
                    <strong>Date:</strong> {currentPO.date}
                  </p>
                  <p>
                    <strong>Status:</strong> {currentPO.status.toUpperCase()}
                  </p>
                  {currentPO.reference && (
                    <p>
                      <strong>Reference:</strong> {currentPO.reference}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h3 className="font-bold">Supplier:</h3>
                  {currentPO.isCashPurchase ? (
                    <p className="text-lg font-bold">CASH PURCHASE</p>
                  ) : (
                    <div>
                      <p className="font-medium">{currentPO.supplierName}</p>
                      <p className="text-sm">{currentPO.supplierPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left">S.No.</th>
                    <th className="border border-black p-2 text-left">Item</th>
                    <th className="border border-black p-2 text-center">QTY</th>
                    <th className="border border-black p-2 text-center">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPO.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-black p-2">{index + 1}</td>
                      <td className="border border-black p-2">{item.name}</td>
                      <td className="border border-black p-2 text-center">{item.quantity}</td>
                      <td className="border border-black p-2 text-center">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              {currentPO.notes && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Notes:</h3>
                  <p className="text-sm">{currentPO.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-end mt-8">
                <div>
                  <p className="text-sm">Terms & Conditions Apply</p>
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

      {/* Purchase Order History Dialog */}
      <Dialog open={showPOHistory} onOpenChange={setShowPOHistory}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No purchase orders found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {purchaseOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((po) => (
                    <div
                      key={po.id}
                      className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{po.orderNumber}</span>
                          <Badge
                            variant={
                              po.status === "completed"
                                ? "default"
                                : po.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {po.status.toUpperCase()}
                          </Badge>
                          <Badge variant={po.isCashPurchase ? "secondary" : "default"} className="text-xs">
                            {po.isCashPurchase ? "Cash" : "Supplier"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>{format(new Date(po.createdAt), "MMM dd, yyyy")}</span>
                          <span className="mx-2">•</span>
                          <span>{po.supplierName || "Cash Purchase"}</span>
                          <span className="mx-2">•</span>
                          <span>{po.items.length} items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold">₹{po.total.toFixed(2)}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentPO(po)
                            setShowPurchaseOrder(true)
                          }}
                          className="rounded-[9px]"
                        >
                          <Eye className="w-4 h-4" />
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

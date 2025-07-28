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
  const [superCategories, setSuperCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const poRef = useRef<HTMLDivElement>(null)
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

  const generatePurchaseOrder = () => {
    if (isEditMode && editingPO) {

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
    if (!poRef.current) return;

    const printContent = poRef.current.innerHTML;
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${currentPO?.orderNumber || ""}</title>
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

            .no-print {
              display: none !important;
            }

            .po {
              max-width: 100%;
            }

            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }

            .company-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .company-details {
              font-size: 12px;
              margin-bottom: 2px;
            }

            .po-title {
              font-size: 16px;
              font-weight: bold;
              margin-top: 8px;
            }

            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 14px;
              gap: 12px;
            }

            .info-left, .info-right {
              flex: 1;
            }

            .info-right {
              text-align: right;
            }

            .info-label {
              font-weight: bold;
              font-size: 13px;
            }

            .info-value {
              font-size: 13px;
              margin-bottom: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 13px;
            }

            th, td {
              border: 1px solid #000;
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background-color: #f2f2f2;
              font-weight: bold;
              font-size: 14px;
              text-align: center;
            }

            .text-center {
              text-align: center;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 14px;
              font-size: 12px;
            }

            .signature-section {
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 8px;
              width: 180px;
              margin-top: 24px;
              font-size: 13px;
            }

            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <div class="signature-section">
            <p>Authorized Signature</p>
            <p style="font-size: 12px; margin-top: 4px;">${storeInfo.name}</p>
          </div>
        </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      alert("Please allow popups for this website to enable printing.");
    }
  };


  const printThermalPurchaseOrder = () => {
    if (!poRef.current) return;

    const printContent = poRef.current.innerHTML;
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Purchase Order</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              font-size: 9px;
              color: #000;
              background: #fff;
              padding: 6px;
              width: 72mm;
              max-width: 72mm;
              line-height: 1.3;
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
              font-weight: bold;
              margin-bottom: 2px;
            }

            .header p {
              font-size: 8px;
              line-height: 1.2;
            }

            .section {
              margin-bottom: 5px;
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
              margin-top: 4px;
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

            tr {
              page-break-inside: avoid;
            }

            .footer {
              text-align: center;
              margin-top: 8px;
              font-size: 8px;
            }

            .signature {
              border-top: 1px solid #000;
              width: 100px;
              margin: 10px auto 0;
              text-align: center;
              font-size: 8px;
            }

            @media print {
              @page {
                size: 80mm auto;
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
          <div class="signature">
            Authorized Signature
          </div>
        </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        if (!printWindow.closed) printWindow.close();
      }, 1000);
    } else {
      alert("Please allow popups for this website to enable printing.");
    }
  };
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

    const posData = {
      items: po.items,
      reference: `PO: ${po.orderNumber}`,
    }
    localStorage.setItem("posPrefilledOrder", JSON.stringify(posData))
    onBack()
    alert("Purchase Order items have been added to POS. Please switch to the POS tab.")
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
                    placeholder="Search customers..."
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
                            {po.isCashPurchase ? "Cash" : "Customer"}
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

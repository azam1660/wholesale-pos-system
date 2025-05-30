"use client"

import { useState, useMemo, useRef } from "react"
import { Trash2, Plus, Minus, User, ShoppingCart, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

// Indian General Store Data
const sampleData = {
  superCategories: [
    { id: "groceries", name: "Groceries & Staples", icon: "🌾" },
    { id: "beverages", name: "Beverages", icon: "🥤" },
    { id: "snacks", name: "Snacks & Confectionery", icon: "🍪" },
    { id: "personal-care", name: "Personal Care", icon: "🧴" },
    { id: "household", name: "Household Items", icon: "🧽" },
    { id: "dairy", name: "Dairy & Frozen", icon: "🥛" },
  ],
  subCategories: {
    groceries: [
      { id: "rice-grains", name: "Rice & Grains", icon: "🍚" },
      { id: "pulses-lentils", name: "Pulses & Lentils", icon: "🫘" },
      { id: "spices", name: "Spices & Masalas", icon: "🌶️" },
      { id: "oil-ghee", name: "Oil & Ghee", icon: "🛢️" },
      { id: "flour-atta", name: "Flour & Atta", icon: "🌾" },
    ],
    beverages: [
      { id: "tea-coffee", name: "Tea & Coffee", icon: "☕" },
      { id: "soft-drinks", name: "Soft Drinks", icon: "🥤" },
      { id: "juices", name: "Juices", icon: "🧃" },
      { id: "energy-drinks", name: "Energy Drinks", icon: "⚡" },
    ],
    snacks: [
      { id: "biscuits", name: "Biscuits & Cookies", icon: "🍪" },
      { id: "namkeen", name: "Namkeen & Chips", icon: "🥨" },
      { id: "chocolates", name: "Chocolates & Sweets", icon: "🍫" },
      { id: "dry-fruits", name: "Dry Fruits & Nuts", icon: "🥜" },
    ],
    "personal-care": [
      { id: "soaps", name: "Soaps & Handwash", icon: "🧼" },
      { id: "shampoo", name: "Shampoo & Hair Care", icon: "🧴" },
      { id: "toothpaste", name: "Oral Care", icon: "🦷" },
      { id: "skincare", name: "Skincare", icon: "🧴" },
    ],
    household: [
      { id: "detergent", name: "Detergents", icon: "🧽" },
      { id: "cleaning", name: "Cleaning Supplies", icon: "🧹" },
      { id: "kitchen", name: "Kitchen Items", icon: "🍽️" },
      { id: "stationery", name: "Stationery", icon: "✏️" },
    ],
    dairy: [
      { id: "milk", name: "Milk & Curd", icon: "🥛" },
      { id: "butter-cheese", name: "Butter & Cheese", icon: "🧈" },
      { id: "ice-cream", name: "Ice Cream", icon: "🍦" },
      { id: "frozen", name: "Frozen Foods", icon: "🧊" },
    ],
  },
  products: {
    "rice-grains": [
      { id: "basmati-rice", name: "Basmati Rice 5kg", price: 450.0, stock: 100, unit: "bag" },
      { id: "sona-masoori", name: "Sona Masoori Rice 25kg", price: 1200.0, stock: 50, unit: "bag" },
      { id: "wheat", name: "Wheat 10kg", price: 280.0, stock: 75, unit: "bag" },
    ],
    "pulses-lentils": [
      { id: "toor-dal", name: "Toor Dal 1kg", price: 120.0, stock: 200, unit: "kg" },
      { id: "moong-dal", name: "Moong Dal 1kg", price: 110.0, stock: 150, unit: "kg" },
      { id: "chana-dal", name: "Chana Dal 1kg", price: 90.0, stock: 180, unit: "kg" },
    ],
    spices: [
      { id: "turmeric", name: "Turmeric Powder 500g", price: 80.0, stock: 100, unit: "pack" },
      { id: "red-chilli", name: "Red Chilli Powder 500g", price: 120.0, stock: 80, unit: "pack" },
      { id: "garam-masala", name: "Garam Masala 100g", price: 45.0, stock: 120, unit: "pack" },
    ],
    "oil-ghee": [
      { id: "sunflower-oil", name: "Sunflower Oil 1L", price: 140.0, stock: 60, unit: "bottle" },
      { id: "mustard-oil", name: "Mustard Oil 1L", price: 160.0, stock: 40, unit: "bottle" },
      { id: "ghee", name: "Pure Ghee 500ml", price: 280.0, stock: 30, unit: "jar" },
    ],
    "flour-atta": [
      { id: "wheat-flour", name: "Wheat Flour 10kg", price: 320.0, stock: 80, unit: "bag" },
      { id: "maida", name: "Maida 1kg", price: 35.0, stock: 100, unit: "pack" },
      { id: "besan", name: "Besan 1kg", price: 85.0, stock: 70, unit: "pack" },
    ],
    "tea-coffee": [
      { id: "tea-leaves", name: "Premium Tea 1kg", price: 320.0, stock: 50, unit: "pack" },
      { id: "coffee-powder", name: "Coffee Powder 500g", price: 180.0, stock: 40, unit: "pack" },
      { id: "tea-bags", name: "Tea Bags 100pcs", price: 85.0, stock: 60, unit: "box" },
    ],
    biscuits: [
      { id: "parle-g", name: "Parle-G Biscuits 1kg", price: 80.0, stock: 200, unit: "pack" },
      { id: "marie-biscuits", name: "Marie Biscuits 500g", price: 45.0, stock: 150, unit: "pack" },
      { id: "cream-biscuits", name: "Cream Biscuits 300g", price: 60.0, stock: 100, unit: "pack" },
    ],
  },
}

const customers = [
  {
    id: "cust1",
    name: "Sharma General Store",
    email: "sharma@gmail.com",
    phone: "+91-98765-43210",
    address: "123 Main Market, Delhi",
  },
  {
    id: "cust2",
    name: "Patel Wholesale Traders",
    email: "patel.traders@gmail.com",
    phone: "+91-87654-32109",
    address: "456 Commercial Street, Mumbai",
  },
  {
    id: "cust3",
    name: "Singh Retail Hub",
    email: "singh.retail@gmail.com",
    phone: "+91-76543-21098",
    address: "789 Market Road, Pune",
  },
  {
    id: "cust4",
    name: "Gupta Enterprises",
    email: "gupta.ent@gmail.com",
    phone: "+91-65432-10987",
    address: "321 Trade Center, Bangalore",
  },
]

const storeInfo = {
  name: "SL SALAR",
  address: "60/61, Jodhbhavi Peth Chatla Chowk, Main Road, Main Road-413001",
  phone: "9420490692",
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  unit: string
}

interface Invoice {
  invoiceNumber: string
  date: string
  customer: any
  items: OrderItem[]
  subtotal: number
  total: number
  isCashSale: boolean
}

// Invoice counter - in a real app, this would be stored in a database
let invoiceCounter = 1

export default function POSSystem() {
  const [currentView, setCurrentView] = useState<"super" | "sub" | "products">("super")
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [showInvoice, setShowInvoice] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [isCashSale, setIsCashSale] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearch.toLowerCase()),
    )
  }, [customerSearch])

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer)

  const generateInvoiceNumber = () => {
    const invoiceNumber = `SL-${invoiceCounter.toString().padStart(4, "0")}`
    invoiceCounter++
    return invoiceNumber
  }

  const handleSuperCategorySelect = (categoryId: string) => {
    setSelectedSuperCategory(categoryId)
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
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        lineTotal: product.price,
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
    setOrderItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity, lineTotal: newQuantity * item.unitPrice } : item,
      ),
    )
  }

  const updateUnitPrice = (itemId: string, newPrice: number) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, unitPrice: newPrice, lineTotal: item.quantity * newPrice } : item,
      ),
    )
  }

  const removeFromOrder = (itemId: string) => {
    setOrderItems((items) => items.filter((item) => item.id !== itemId))
  }

  const clearCart = () => {
    setOrderItems([])
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const generateInvoice = () => {
    const invoiceNumber = generateInvoiceNumber()
    const invoice: Invoice = {
      invoiceNumber,
      date: new Date().toLocaleDateString("en-IN"),
      customer: isCashSale ? null : selectedCustomerData,
      items: [...orderItems],
      subtotal,
      total: subtotal,
      isCashSale,
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

  const confirmOrder = () => {
    if (orderItems.length === 0) return
    if (!isCashSale && !selectedCustomer) return

    generateInvoice()
    clearCart()
    setSelectedCustomer("")
    setIsCashSale(false)
  }

  const renderSuperCategories = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {sampleData.superCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleSuperCategorySelect(category.id)}
          className="h-32 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-black rounded-[23px] flex flex-col items-center justify-center gap-3 transition-colors"
          variant="outline"
        >
          <span className="text-3xl">{category.icon}</span>
          <span className="font-medium text-sm text-center">{category.name}</span>
        </Button>
      ))}
    </div>
  )

  const renderSubCategories = () => {
    const subCategories = sampleData.subCategories[selectedSuperCategory] || []
    return (
      <div className="space-y-4">
        <Button onClick={handleBackToSuper} variant="outline" className="rounded-[9px] border-gray-300">
          ← Back to Categories
        </Button>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {subCategories.map((subCategory) => (
            <Button
              key={subCategory.id}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              className="h-28 w-full bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-black rounded-[18px] flex flex-col items-center justify-center gap-2 transition-colors"
              variant="outline"
            >
              <span className="text-2xl">{subCategory.icon}</span>
              <span className="font-medium text-sm text-center">{subCategory.name}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    const products = sampleData.products[selectedSubCategory] || []
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleBackToSub} variant="outline" className="rounded-[9px] border-gray-300">
            ← Back to Subcategories
          </Button>
          <Button onClick={handleBackToSuper} variant="outline" className="rounded-[9px] border-gray-300">
            ← Back to Categories
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="rounded-[11px] border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">₹{product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">
                      Stock: {product.stock} {product.unit}
                    </span>
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

      <div className="relative z-10 flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-black">SL SALAR POS</h1>

              {/* Customer Selection */}
              <div className="flex items-center gap-4">
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
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-10 w-64 rounded-[9px]"
                    />
                    {customerSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-[9px] mt-1 max-h-40 overflow-y-auto z-20">
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
                )}

                {selectedCustomerData && !isCashSale && (
                  <Card className="rounded-[11px] border-gray-200">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{selectedCustomerData.name}</div>
                      <div className="text-xs text-gray-500">{selectedCustomerData.phone}</div>
                    </CardContent>
                  </Card>
                )}

                {isCashSale && (
                  <Card className="rounded-[11px] border-yellow-200 bg-yellow-50">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium text-yellow-800">CASH SALE</div>
                      <div className="text-xs text-yellow-600">No customer required</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </header>

          {/* Product Selection Area */}
          <main className="flex-1 p-6 overflow-y-auto">
            {currentView === "super" && renderSuperCategories()}
            {currentView === "sub" && renderSubCategories()}
            {currentView === "products" && renderProducts()}
          </main>
        </div>

        {/* Order Summary Panel */}
        <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-bold">Order Summary</h2>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items in cart</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
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

          {/* Order Totals */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="font-bold">Total:</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
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

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Generated</span>
              <Button onClick={printInvoice} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
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
                </div>
                <div className="text-right">
                  <h3 className="font-bold">Bill To:</h3>
                  {currentInvoice.isCashSale ? (
                    <p className="text-lg font-bold">CASH</p>
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
    </div>
  )
}

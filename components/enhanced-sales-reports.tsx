"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  Download,
  Printer,
  FileText,
  Share2,
  Filter,
  Search,
  Eye,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { DataManager } from "./data-manager"

interface EnhancedSalesReportsProps {
  onBack: () => void
}

interface Sale {
  id: string
  invoiceNumber: string
  date: string
  timestamp: number
  customerId?: string
  customerName?: string
  customerPhone?: string
  isCashSale: boolean
  items: any[]
  subtotal: number
  total: number
  paymentMethod: "cash" | "card" | "upi" | "credit"
  createdAt: string
  updatedAt: string
}

interface ReportData {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  topProducts: any[]
  topCustomers: any[]
  categoryPerformance: any[]
  dailySales: any[]
  paymentMethodBreakdown: any[]
  hourlyTrends: any[]
}

export default function EnhancedSalesReports({ onBack }: EnhancedSalesReportsProps) {
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year" | "custom">("month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [analytics, setAnalytics] = useState<ReportData | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "card" | "upi" | "credit">("all")
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showEditSale, setShowEditSale] = useState(false)
  const [editableSale, setEditableSale] = useState<Sale | null>(null)

  const reportRef = useRef<HTMLDivElement>(null)

  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (dateRange) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        start = new Date(now.getFullYear(), 0, 1)
        break
      case "custom":
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate)
          end = new Date(customEndDate)
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), 1)
        }
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { start, end }
  }

  useEffect(() => {
    loadSalesData()
  }, [])

  useEffect(() => {
    const { start, end } = getDateRange()
    const analyticsData = DataManager.getSalesAnalytics({ start, end })
    setAnalytics(analyticsData)
    applyFilters()
  }, [dateRange, customStartDate, customEndDate, sales, searchQuery, paymentFilter])

  const loadSalesData = () => {
    const salesData = DataManager.getSales()
    setSales(salesData)
  }

  const applyFilters = () => {
    const { start, end } = getDateRange()
    let filtered = sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp)
      return saleDate >= start && saleDate <= end
    })

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          sale.invoiceNumber.toLowerCase().includes(query) ||
          sale.customerName?.toLowerCase().includes(query) ||
          sale.customerPhone?.includes(query),
      )
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter((sale) => sale.paymentMethod === paymentFilter)
    }

    setFilteredSales(filtered.sort((a, b) => b.timestamp - a.timestamp))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const exportReportToPDF = () => {
    if (!analytics) return

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text("SL SALAR", 105, 20, { align: "center" })

    doc.setFontSize(16)
    doc.text("Sales Report", 105, 30, { align: "center" })

    doc.setFontSize(10)
    const { start, end } = getDateRange()
    const dateRangeText = `${format(start, "MMM dd, yyyy")} to ${format(end, "MMM dd, yyyy")}`
    doc.text(`Period: ${dateRangeText}`, 105, 40, { align: "center" })
    doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 105, 45, { align: "center" })

    // Summary
    doc.setFontSize(12)
    doc.text("Summary", 20, 60)

    doc.setFontSize(10)
    doc.text(`Total Sales: ${analytics.totalSales}`, 20, 70)
    doc.text(`Total Revenue: ${formatCurrency(analytics.totalRevenue)}`, 20, 75)
    doc.text(`Average Order Value: ${formatCurrency(analytics.averageOrderValue)}`, 20, 80)

    // Top Products Table
    doc.setFontSize(12)
    doc.text("Top Products", 20, 95)

    const topProductsData = analytics.topProducts
      .slice(0, 10)
      .map((product, index) => [
        index + 1,
        product.productName,
        product.totalQuantity,
        formatCurrency(product.totalRevenue),
      ])

    doc.autoTable({
      head: [["Rank", "Product Name", "Quantity Sold", "Revenue"]],
      body: topProductsData,
      startY: 100,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    })

    // Sales List
    const currentY = (doc as any).lastAutoTable.finalY + 20

    doc.setFontSize(12)
    doc.text("Recent Sales", 20, currentY)

    const salesData = filteredSales
      .slice(0, 20)
      .map((sale) => [
        sale.invoiceNumber,
        format(new Date(sale.timestamp), "MMM dd, yyyy"),
        sale.customerName || "Cash Customer",
        sale.paymentMethod.toUpperCase(),
        formatCurrency(sale.total),
      ])

    doc.autoTable({
      head: [["Invoice", "Date", "Customer", "Payment", "Amount"]],
      body: salesData,
      startY: currentY + 5,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    })

    doc.save(`Sales_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const shareReportPDF = async () => {
    if (!analytics) return

    const doc = new jsPDF()
    // ... (same PDF generation code as above)

    const pdfBlob = doc.output("blob")

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([pdfBlob], `Sales_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`, {
          type: "application/pdf",
        })
        await navigator.share({
          title: "Sales Report",
          text: `Sales report from SL SALAR for ${format(new Date(), "MMM dd, yyyy")}`,
          files: [file],
        })
      } catch (error) {
        console.error("Error sharing:", error)
        exportReportToPDF()
      }
    } else {
      exportReportToPDF()
    }
  }

  const printReport = () => {
    if (reportRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Sales Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${reportRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const editSale = (sale: Sale) => {
    setEditableSale({ ...sale })
    setShowEditSale(true)
  }

  const saveSaleChanges = () => {
    if (!editableSale) return

    // Update the sale in DataManager
    DataManager.updateSale(editableSale.id, editableSale)
    loadSalesData()
    setShowEditSale(false)
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Sales Reports...</p>
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

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" className="rounded-[9px]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-black">Enhanced Sales Reports</h1>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={printReport} variant="outline" className="rounded-[9px]">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={exportReportToPDF} variant="outline" className="rounded-[9px]">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={shareReportPDF} className="bg-green-500 hover:bg-green-600 text-white rounded-[9px]">
              <Share2 className="w-4 h-4 mr-2" />
              Share PDF
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="rounded-[11px] mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Report Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-40 rounded-[9px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-[9px]"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-[9px]"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div ref={reportRef}>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-[11px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSales}</div>
                <p className="text-xs text-muted-foreground">Number of transactions</p>
              </CardContent>
            </Card>

            <Card className="rounded-[11px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Total sales amount</p>
              </CardContent>
            </Card>

            <Card className="rounded-[11px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>

            <Card className="rounded-[11px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.topCustomers.length}</div>
                <p className="text-xs text-muted-foreground">Unique customers</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="sales">Sales List</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Payment Method Breakdown */}
              <Card className="rounded-[11px]">
                <CardHeader>
                  <CardTitle>Payment Method Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.paymentMethodBreakdown?.map((method: any) => (
                      <div key={method.method} className="text-center p-4 bg-gray-50 rounded-[9px]">
                        <div className="text-2xl font-bold">{method.count}</div>
                        <div className="text-sm text-gray-600">{method.method.toUpperCase()}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(method.total)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Sales Trend */}
              <Card className="rounded-[11px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Daily Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.dailySales.slice(-7).map((day: any) => (
                      <div key={day.date} className="flex items-center justify-between p-3 border rounded-[9px]">
                        <div>
                          <p className="font-medium">
                            {new Date(day.date).toLocaleDateString("en-IN", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-gray-500">{day.totalSales} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(day.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <Card className="rounded-[11px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topProducts.slice(0, 10).map((product: any, index: number) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between p-3 border rounded-[9px]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.productName}</p>
                            <p className="text-xs text-gray-500">{product.totalQuantity} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <Card className="rounded-[11px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topCustomers.slice(0, 10).map((customer: any, index: number) => (
                      <div
                        key={customer.customerId}
                        className="flex items-center justify-between p-3 border rounded-[9px]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{customer.customerName}</p>
                            <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(customer.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-6">
              {/* Filters */}
              <Card className="rounded-[11px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Invoice, customer..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 rounded-[9px]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={paymentFilter} onValueChange={(value: any) => setPaymentFilter(value)}>
                        <SelectTrigger className="rounded-[9px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales List */}
              <Card className="rounded-[11px]">
                <CardHeader>
                  <CardTitle>Sales Records ({filteredSales.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{sale.invoiceNumber}</span>
                            <Badge variant={sale.isCashSale ? "secondary" : "default"} className="text-xs">
                              {sale.isCashSale ? "Cash" : "Customer"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {sale.paymentMethod.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span>{format(new Date(sale.timestamp), "MMM dd, yyyy HH:mm")}</span>
                            <span className="mx-2">•</span>
                            <span>{sale.customerName || "Cash Customer"}</span>
                            <span className="mx-2">•</span>
                            <span>{sale.items.length} items</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(sale.total)}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale)
                              setShowSaleDetails(true)
                            }}
                            className="rounded-[9px]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => editSale(sale)} className="rounded-[9px]">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredSales.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No sales records found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details - {selectedSale?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">{format(new Date(selectedSale.timestamp), "MMM dd, yyyy HH:mm:ss")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm">{selectedSale.paymentMethod.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedSale.customerName || "Cash Customer"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedSale.total)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Items Purchased</Label>
                <div className="mt-2 space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-[9px]">
                      <div>
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} {item.unit} × ₹{item.unitPrice}
                        </p>
                      </div>
                      <p className="font-bold">₹{item.lineTotal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={showEditSale} onOpenChange={setShowEditSale}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sale - {editableSale?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {editableSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={editableSale.paymentMethod}
                    onValueChange={(value: any) => setEditableSale({ ...editableSale, paymentMethod: value })}
                  >
                    <SelectTrigger className="rounded-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={editableSale.customerName || ""}
                    onChange={(e) => setEditableSale({ ...editableSale, customerName: e.target.value })}
                    className="rounded-[9px]"
                    placeholder="Customer name"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowEditSale(false)} variant="outline" className="rounded-[9px]">
                  Cancel
                </Button>
                <Button
                  onClick={saveSaleChanges}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

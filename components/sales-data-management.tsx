"use client"

import { useState, useEffect } from "react"
import {
  Download,
  Trash2,
  Clock,
  FileText,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileSpreadsheet,
  FileJson,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { DataManager } from "./data-manager"

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

export default function SalesDataManagement() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [selectedSales, setSelectedSales] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<"all" | "cash" | "card" | "upi" | "credit">("all")
  const [customerTypeFilter, setCustomerTypeFilter] = useState<"all" | "cash" | "customer">("all")

  // Export states
  const [exportProgress, setExportProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "excel">("excel")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportSelections, setExportSelections] = useState({
    salesData: true,
    customerDetails: true,
    productDetails: true,
    categoryDetails: true,
    paymentInfo: true,
    itemBreakdown: true,
  })

  // Day-end operations states
  const [showDayEndDialog, setShowDayEndDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteOperation, setDeleteOperation] = useState<"selected" | "dateRange" | null>(null)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  // Sale details dialog
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<Sale | null>(null)

  useEffect(() => {
    loadSalesData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [sales, searchQuery, dateFilter, customStartDate, customEndDate, paymentMethodFilter, customerTypeFilter])

  const loadSalesData = () => {
    const salesData = DataManager.getSales()
    setSales(salesData)
  }

  const applyFilters = () => {
    let filtered = [...sales]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          sale.invoiceNumber.toLowerCase().includes(query) ||
          sale.customerName?.toLowerCase().includes(query) ||
          sale.customerPhone?.includes(query) ||
          sale.items.some((item) => item.productName.toLowerCase().includes(query)),
      )
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate: Date
      let endDate: Date = now

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "custom":
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate)
            endDate = new Date(customEndDate)
            endDate.setHours(23, 59, 59, 999) // Include the entire end date
          } else {
            startDate = new Date(0) // No filter if dates not set
          }
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.timestamp)
        return saleDate >= startDate && saleDate <= endDate
      })
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((sale) => sale.paymentMethod === paymentMethodFilter)
    }

    // Customer type filter
    if (customerTypeFilter !== "all") {
      if (customerTypeFilter === "cash") {
        filtered = filtered.filter((sale) => sale.isCashSale)
      } else {
        filtered = filtered.filter((sale) => !sale.isCashSale)
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    setFilteredSales(filtered)
  }

  const handleSelectSale = (saleId: string, checked: boolean) => {
    if (checked) {
      setSelectedSales((prev) => [...prev, saleId])
    } else {
      setSelectedSales((prev) => prev.filter((id) => id !== saleId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSales(filteredSales.map((sale) => sale.id))
    } else {
      setSelectedSales([])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportData = async () => {
    setExportProgress(0)
    setShowExportDialog(false)

    try {
      // Prepare data based on selections
      const exportData: any = {}

      if (exportSelections.salesData) {
        exportData.sales = filteredSales.map((sale) => ({
          invoiceNumber: sale.invoiceNumber,
          date: sale.date,
          timestamp: sale.timestamp,
          customerType: sale.isCashSale ? "Cash Sale" : "Customer",
          customerName: sale.customerName || "Cash Customer",
          customerPhone: sale.customerPhone || "",
          paymentMethod: sale.paymentMethod,
          subtotal: sale.subtotal,
          total: sale.total,
          itemCount: sale.items.length,
          createdAt: sale.createdAt,
        }))
        setExportProgress(20)
      }

      if (exportSelections.itemBreakdown) {
        exportData.saleItems = []
        filteredSales.forEach((sale) => {
          sale.items.forEach((item) => {
            exportData.saleItems.push({
              invoiceNumber: sale.invoiceNumber,
              saleDate: sale.date,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              unit: item.unit,
              subCategory: item.subCategoryName,
              superCategory: item.superCategoryName,
            })
          })
        })
        setExportProgress(40)
      }

      if (exportSelections.customerDetails) {
        const customers = DataManager.getCustomers()
        exportData.customers = customers
        setExportProgress(60)
      }

      if (exportSelections.productDetails) {
        const products = DataManager.getProducts()
        exportData.products = products
        setExportProgress(80)
      }

      if (exportSelections.categoryDetails) {
        const superCategories = DataManager.getSuperCategories()
        const subCategories = DataManager.getSubCategories()
        exportData.superCategories = superCategories
        exportData.subCategories = subCategories
        setExportProgress(90)
      }

      // Generate file based on format
      const currentDate = format(new Date(), "yyyy-MM-dd_HH-mm-ss")
      const filename = `Sales_Export_${currentDate}`

      if (exportFormat === "json") {
        const jsonData = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonData], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (exportFormat === "csv") {
        // Export main sales data as CSV
        if (exportData.sales) {
          const csv = convertToCSV(exportData.sales)
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${filename}.csv`
          a.click()
          URL.revokeObjectURL(url)
        }
      } else {
        // Excel format with multiple sheets
        const wb = XLSX.utils.book_new()

        Object.entries(exportData).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            const ws = XLSX.utils.json_to_sheet(value)
            XLSX.utils.book_append_sheet(wb, ws, key)
          }
        })

        XLSX.writeFile(wb, `${filename}.xlsx`)
      }

      setExportProgress(100)

      // Reset progress after delay
      setTimeout(() => {
        setExportProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Export error:", error)
      setExportProgress(0)
    }
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    return csvContent
  }

  const handleDeleteSelected = async () => {
    if (selectedSales.length === 0) return

    setDeleteProgress(0)
    setShowDeleteConfirm(false)

    try {
      const totalToDelete = selectedSales.length
      let deleted = 0

      for (const saleId of selectedSales) {
        await DataManager.deleteSale(saleId)
        deleted++
        setDeleteProgress((deleted / totalToDelete) * 100)
      }

      loadSalesData()
      setSelectedSales([])
      setShowDeleteSuccess(true)

      setTimeout(() => {
        setShowDeleteSuccess(false)
        setDeleteProgress(0)
      }, 3000)
    } catch (error) {
      console.error("Delete error:", error)
      setDeleteProgress(0)
    }
  }

  const handleDeleteDateRange = async () => {
    if (!customStartDate || !customEndDate) return

    setDeleteProgress(0)
    setShowDeleteConfirm(false)

    try {
      const startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)

      const salesToDelete = sales.filter((sale) => {
        const saleDate = new Date(sale.timestamp)
        return saleDate >= startDate && saleDate <= endDate
      })

      const totalToDelete = salesToDelete.length
      let deleted = 0

      for (const sale of salesToDelete) {
        await DataManager.deleteSale(sale.id)
        deleted++
        setDeleteProgress((deleted / totalToDelete) * 100)
      }

      loadSalesData()
      setShowDeleteSuccess(true)

      setTimeout(() => {
        setShowDeleteSuccess(false)
        setDeleteProgress(0)
      }, 3000)
    } catch (error) {
      console.error("Delete error:", error)
      setDeleteProgress(0)
    }
  }

  const openDeleteConfirm = (operation: "selected" | "dateRange") => {
    setDeleteOperation(operation)
    setShowDeleteConfirm(true)
  }

  const viewSaleDetails = (sale: Sale) => {
    setSelectedSaleDetails(sale)
    setShowSaleDetails(true)
  }

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0

  return (
    <div className="space-y-6">
      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="management">Sales Management</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="dayend">Day-End Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="rounded-[11px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold">{filteredSales.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[11px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <Database className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[11px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Order</p>
                    <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="rounded-[11px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Invoice, customer, product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-[9px]"
                    />
                  </div>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                    <SelectTrigger className="rounded-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethodFilter} onValueChange={(value: any) => setPaymentMethodFilter(value)}>
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

                <div>
                  <Label>Customer Type</Label>
                  <Select value={customerTypeFilter} onValueChange={(value: any) => setCustomerTypeFilter(value)}>
                    <SelectTrigger className="rounded-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="cash">Cash Sales</SelectItem>
                      <SelectItem value="customer">Registered Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {dateFilter === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="rounded-[9px]"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="rounded-[9px]"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales List */}
          <Card className="rounded-[11px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Records ({filteredSales.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Select All</Label>
                  {selectedSales.length > 0 && <Badge variant="secondary">{selectedSales.length} selected</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 border rounded-[9px] hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedSales.includes(sale.id)}
                        onCheckedChange={(checked) => handleSelectSale(sale.id, checked as boolean)}
                      />
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
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(sale.total)}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewSaleDetails(sale)}
                        className="rounded-[9px]"
                      >
                        <Eye className="w-4 h-4" />
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

        <TabsContent value="export" className="space-y-4">
          <Card className="rounded-[11px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Sales Data
              </CardTitle>
              <CardDescription>Export filtered sales data with customizable options and formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Export Format</Label>
                    <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                      <SelectTrigger className="rounded-[9px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel (.xlsx)
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            CSV (.csv)
                          </div>
                        </SelectItem>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <FileJson className="w-4 h-4" />
                            JSON (.json)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Data to Export</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="export-sales"
                          checked={exportSelections.salesData}
                          onCheckedChange={(checked) =>
                            setExportSelections({ ...exportSelections, salesData: !!checked })
                          }
                        />
                        <Label htmlFor="export-sales">Sales Summary Data</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="export-items"
                          checked={exportSelections.itemBreakdown}
                          onCheckedChange={(checked) =>
                            setExportSelections({ ...exportSelections, itemBreakdown: !!checked })
                          }
                        />
                        <Label htmlFor="export-items">Item-wise Breakdown</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="export-customers"
                          checked={exportSelections.customerDetails}
                          onCheckedChange={(checked) =>
                            setExportSelections({ ...exportSelections, customerDetails: !!checked })
                          }
                        />
                        <Label htmlFor="export-customers">Customer Details</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="export-products"
                          checked={exportSelections.productDetails}
                          onCheckedChange={(checked) =>
                            setExportSelections({ ...exportSelections, productDetails: !!checked })
                          }
                        />
                        <Label htmlFor="export-products">Product Details</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="export-categories"
                          checked={exportSelections.categoryDetails}
                          onCheckedChange={(checked) =>
                            setExportSelections({ ...exportSelections, categoryDetails: !!checked })
                          }
                        />
                        <Label htmlFor="export-categories">Category Details</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-[9px]">
                    <h3 className="font-medium mb-2">Export Summary</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Records to export: <span className="font-medium">{filteredSales.length}</span>
                      </p>
                      <p>
                        Total revenue: <span className="font-medium">{formatCurrency(totalRevenue)}</span>
                      </p>
                      <p>
                        Date range:{" "}
                        <span className="font-medium">
                          {dateFilter === "all"
                            ? "All time"
                            : dateFilter === "custom" && customStartDate && customEndDate
                              ? `${customStartDate} to ${customEndDate}`
                              : dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
                        </span>
                      </p>
                      <p>
                        Format: <span className="font-medium">{exportFormat.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  {exportProgress > 0 && (
                    <div className="space-y-2">
                      <Label>Export Progress</Label>
                      <Progress value={exportProgress} className="h-2" />
                      <p className="text-sm text-gray-600">{exportProgress}% complete</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setShowExportDialog(true)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={exportProgress > 0 || !Object.values(exportSelections).some((v) => v)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Sales Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dayend" className="space-y-4">
          <Card className="rounded-[11px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Day-End Operations
              </CardTitle>
              <CardDescription>Manage and clean up sales data at the end of business day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Day-end operations will permanently delete sales data. Make sure to export/backup important data
                  before proceeding.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[9px] border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Delete Selected Sales</CardTitle>
                    <CardDescription>Delete individually selected sales records</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-[9px]">
                      <p className="text-sm">
                        <span className="font-medium">{selectedSales.length}</span> sales records selected
                      </p>
                      {selectedSales.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">Go to Sales Management tab to select records</p>
                      )}
                    </div>

                    <Button
                      onClick={() => openDeleteConfirm("selected")}
                      variant="destructive"
                      className="w-full rounded-[9px]"
                      disabled={selectedSales.length === 0 || deleteProgress > 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedSales.length})
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-[9px] border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Delete by Date Range</CardTitle>
                    <CardDescription>Delete all sales within a specific date range</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="rounded-[9px]"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="rounded-[9px]"
                        />
                      </div>
                    </div>

                    {customStartDate && customEndDate && (
                      <div className="p-3 bg-red-50 rounded-[9px]">
                        <p className="text-sm text-red-800">
                          This will delete all sales from {customStartDate} to {customEndDate}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => openDeleteConfirm("dateRange")}
                      variant="destructive"
                      className="w-full rounded-[9px]"
                      disabled={!customStartDate || !customEndDate || deleteProgress > 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Date Range
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {deleteProgress > 0 && (
                <div className="space-y-2">
                  <Label>Deletion Progress</Label>
                  <Progress value={deleteProgress} className="h-2" />
                  <p className="text-sm text-gray-600">{deleteProgress.toFixed(0)}% complete</p>
                </div>
              )}

              {showDeleteSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Deletion Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Selected sales records have been permanently deleted.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Confirmation Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Export</DialogTitle>
            <DialogDescription>
              Are you sure you want to export {filteredSales.length} sales records in {exportFormat.toUpperCase()}{" "}
              format?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} className="rounded-[9px]">
              Cancel
            </Button>
            <Button onClick={handleExportData} className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]">
              Export Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteOperation === "selected"
                ? `Are you sure you want to permanently delete ${selectedSales.length} selected sales records?`
                : `Are you sure you want to permanently delete all sales records from ${customStartDate} to ${customEndDate}?`}
              <br />
              <br />
              <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-[9px]">
              Cancel
            </Button>
            <Button
              onClick={deleteOperation === "selected" ? handleDeleteSelected : handleDeleteDateRange}
              variant="destructive"
              className="rounded-[9px]"
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Details Dialog */}
      <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Details - {selectedSaleDetails?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedSaleDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">{format(new Date(selectedSaleDetails.timestamp), "MMM dd, yyyy HH:mm:ss")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm">{selectedSaleDetails.paymentMethod.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedSaleDetails.customerName || "Cash Customer"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedSaleDetails.total)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Items Purchased</Label>
                <div className="mt-2 space-y-2">
                  {selectedSaleDetails.items.map((item, index) => (
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
    </div>
  )
}

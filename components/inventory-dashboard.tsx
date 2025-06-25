"use client"

import { useState, useEffect } from "react"
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataManager } from "./data-manager"

interface InventoryDashboardProps {
  onRefresh?: () => void
}

export default function InventoryDashboard({ onRefresh }: InventoryDashboardProps) {
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [stockTransactions, setStockTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadDashboardData = () => {
    setLoading(true)
    try {
      const items = DataManager.getInventoryItems()
      const transactions = DataManager.getStockTransactions()
      const prods = DataManager.getProducts()

      setInventoryItems(items)
      setStockTransactions(transactions)
      setProducts(prods)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "inventory_items" || e.key === "stock_transactions" || e.key === "products" || e.key === "sales") {
        loadDashboardData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleRefresh = () => {
    loadDashboardData()
    onRefresh?.()
  }

  // Calculate metrics
  const totalProducts = products.length
  const totalInventoryItems = inventoryItems.length
  const lowStockItems = inventoryItems.filter((item) => item.closingStock <= item.reorderLevel).length
  const outOfStockItems = inventoryItems.filter((item) => item.closingStock <= 0).length
  const totalStockValue = inventoryItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + item.closingStock * (product?.price || 0)
  }, 0)

  // Recent transactions (last 10)
  const recentTransactions = stockTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Products without inventory tracking
  const productsWithoutInventory = products.filter(
    (product) => !inventoryItems.some((item) => item.productId === product.id),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStockStatus = (item: any) => {
    if (item.closingStock <= 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (item.closingStock <= item.reorderLevel) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { status: "In Stock", color: "bg-green-100 text-green-800" }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <span className="ml-2 text-gray-600">Loading inventory data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h2>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="rounded-[9px]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-[11px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[11px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tracked Items</p>
                <p className="text-2xl font-bold">{totalInventoryItems}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[11px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
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
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
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
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems > 0 || outOfStockItems > 0 || productsWithoutInventory.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Alerts</h3>

          {outOfStockItems > 0 && (
            <Card className="rounded-[11px] border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">{outOfStockItems} items are out of stock</span>
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockItems > 0 && (
            <Card className="rounded-[11px] border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">{lowStockItems} items are running low on stock</span>
                </div>
              </CardContent>
            </Card>
          )}

          {productsWithoutInventory.length > 0 && (
            <Card className="rounded-[11px] border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {productsWithoutInventory.length} products are not being tracked in inventory
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="rounded-[11px]">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent transactions</p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 border rounded-[9px]">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="font-medium text-sm">{transaction.productName}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {transaction.quantity > 0 ? "+" : ""}
                        {transaction.quantity}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Status Overview */}
        <Card className="rounded-[11px]">
          <CardHeader>
            <CardTitle>Stock Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {inventoryItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No inventory items tracked</p>
              ) : (
                inventoryItems
                  .filter((item) => item.closingStock <= item.reorderLevel)
                  .slice(0, 10)
                  .map((item) => {
                    const stockStatus = getStockStatus(item)
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded-[9px]">
                        <div className="flex items-center gap-3">
                          <Badge className={`text-xs ${stockStatus.color}`}>{stockStatus.status}</Badge>
                          <div>
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {item.closingStock} {item.unit}
                          </p>
                          <p className="text-xs text-gray-500">Reorder: {item.reorderLevel}</p>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

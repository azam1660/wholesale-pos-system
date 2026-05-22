export interface SuperCategory {
  id: string
  _id?: string
  name: string
  nameMr?: string
  icon: string
  image?: string
  createdAt: string
  updatedAt: string
}

export interface SubCategory {
  id: string
  _id?: string
  name: string
  nameMr?: string
  icon: string
  image?: string
  superCategoryId: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  _id?: string
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

export interface Customer {
  id: string
  _id?: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  _id?: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  id: string
  _id?: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  unit: string
  subCategoryId: string
  subCategoryName: string
  superCategoryId: string
  superCategoryName: string
}

export interface Sale {
  id: string
  _id?: string
  estimateNumber: string
  date: string
  timestamp: number
  customerId?: string
  customerName?: string
  customerPhone?: string
  isCashSale: boolean
  items: SaleItem[]
  subtotal: number
  hamaliCharges: number
  total: number
  paymentMethod: "cash" | "card" | "upi" | "credit"
  reference?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: string
  _id?: string
  productId?: string
  name: string
  quantity: number
  unit: string
}

export interface PurchaseOrder {
  id: string
  _id?: string
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

export interface InventoryItem {
  id: string
  _id?: string
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

export interface StockTransaction {
  id: string
  _id?: string
  transactionNumber: string
  productId: string
  productName: string
  type: "opening" | "purchase" | "sale" | "adjustment"
  quantity: number
  date: string
  reference?: string
  notes?: string
  createdAt: string
  batchId?: string
}

export interface TransactionBatch {
  id: string
  _id?: string
  batchNumber: string
  type: "purchase" | "sale" | "adjustment"
  date: string
  reference?: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unit: string
  }>
  totalItems: number
  totalQuantity: number
  createdAt: string
  notes?: string
}

export interface SalesAnalytics {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  topProducts: Array<{
    productId: string
    productName: string
    totalQuantity: number
    totalRevenue: number
  }>
  topCustomers: Array<{
    customerId: string
    customerName: string
    totalOrders: number
    totalRevenue: number
  }>
  categoryPerformance: Array<{
    superCategoryId: string
    superCategoryName: string
    totalQuantity: number
    totalRevenue: number
    subCategories: Array<{
      subCategoryId: string
      subCategoryName: string
      totalQuantity: number
      totalRevenue: number
    }>
  }>
  dailySales: Array<{
    date: string
    totalSales: number
    totalRevenue: number
  }>
  monthlySales: Array<{
    month: string
    totalSales: number
    totalRevenue: number
  }>
  paymentMethodBreakdown: Array<{
    method: string
    count: number
    total: number
  }>
  hourlyTrends: Array<{
    hour: number
    count: number
    total: number
  }>
}

export class DataManager {
  // Validation
  static validateSuperCategory(data: any): string[] {
    const errors: string[] = []
    if (!data.name?.trim()) errors.push("Name is required")
    if (!data.icon?.trim() && !data.image) errors.push("Icon or Image is required")
    return errors
  }

  static validateSubCategory(data: any): string[] {
    const errors: string[] = []
    if (!data.name?.trim()) errors.push("Name is required")
    if (!data.superCategoryId) errors.push("Super Category is required")
    return errors
  }

  static validateProduct(data: any): string[] {
    const errors: string[] = []
    if (!data.name?.trim()) errors.push("Product name is required")
    if (data.price === undefined || data.price < 0) errors.push("Valid price is required")
    if (data.stock === undefined || data.stock < 0) errors.push("Valid stock is required")
    if (!data.unit?.trim()) errors.push("Unit is required")
    if (!data.subCategoryId) errors.push("Sub Category is required")
    return errors
  }

  static validateCustomer(data: any): string[] {
    const errors: string[] = []
    if (!data.name?.trim()) errors.push("Customer name is required")
    if (!data.phone?.trim()) errors.push("Phone number is required")
    return errors
  }

  private static async apiRequest(path: string, method = "GET", body?: any) {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    }
    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(path, options)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch data")
    }
    return response.json()
  }

  private static mapId<T>(item: any): T {
    if (!item) return item
    return { ...item, id: item._id || item.id } as T
  }

  private static mapIds<T>(items: any[]): T[] {
    if (!Array.isArray(items)) return []
    return items.map((item) => this.mapId<T>(item))
  }

  // Super Categories
  static async getSuperCategories(): Promise<SuperCategory[]> {
    const data = await this.apiRequest("/api/super-categories")
    return this.mapIds<SuperCategory>(data)
  }

  static async addSuperCategory(data: Omit<SuperCategory, "id" | "createdAt" | "updatedAt">): Promise<SuperCategory> {
    const result = await this.apiRequest("/api/super-categories", "POST", data)
    return this.mapId<SuperCategory>(result)
  }

  static async updateSuperCategory(id: string, data: Partial<Omit<SuperCategory, "id" | "createdAt">>): Promise<SuperCategory | null> {
    const result = await this.apiRequest(`/api/super-categories/${id}`, "PUT", data)
    return this.mapId<SuperCategory>(result)
  }

  static async deleteSuperCategory(id: string): Promise<boolean> {
    await this.apiRequest(`/api/super-categories/${id}`, "DELETE")
    return true
  }

  // Sub Categories
  static async getSubCategories(): Promise<SubCategory[]> {
    const data = await this.apiRequest("/api/sub-categories")
    return this.mapIds<SubCategory>(data)
  }

  static async addSubCategory(data: Omit<SubCategory, "id" | "createdAt" | "updatedAt">): Promise<SubCategory> {
    const result = await this.apiRequest("/api/sub-categories", "POST", data)
    return this.mapId<SubCategory>(result)
  }

  static async updateSubCategory(id: string, data: Partial<Omit<SubCategory, "id" | "createdAt">>): Promise<SubCategory | null> {
    const result = await this.apiRequest(`/api/sub-categories/${id}`, "PUT", data)
    return this.mapId<SubCategory>(result)
  }

  static async deleteSubCategory(id: string): Promise<boolean> {
    await this.apiRequest(`/api/sub-categories/${id}`, "DELETE")
    return true
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    const data = await this.apiRequest("/api/products")
    return this.mapIds<Product>(data)
  }

  static async addProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const result = await this.apiRequest("/api/products", "POST", data)
    return this.mapId<Product>(result)
  }

  static async updateProduct(id: string, data: Partial<Omit<Product, "id" | "createdAt">>): Promise<Product | null> {
    const result = await this.apiRequest(`/api/products/${id}`, "PUT", data)
    return this.mapId<Product>(result)
  }

  static async deleteProduct(id: string): Promise<boolean> {
    await this.apiRequest(`/api/products/${id}`, "DELETE")
    return true
  }

  static async updateProductStock(id: string, newStock: number): Promise<Product | null> {
    const result = await this.apiRequest(`/api/products/${id}`, "PATCH", { stock: newStock })
    return this.mapId<Product>(result)
  }

  static async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts()
    const lowercaseQuery = query.toLowerCase()
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) || product.unit.toLowerCase().includes(lowercaseQuery),
    )
  }

  // Customers
  static async getCustomers(): Promise<Customer[]> {
    const data = await this.apiRequest("/api/customers")
    return this.mapIds<Customer>(data)
  }

  static async addCustomer(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const result = await this.apiRequest("/api/customers", "POST", data)
    return this.mapId<Customer>(result)
  }

  static async updateCustomer(id: string, data: Partial<Omit<Customer, "id" | "createdAt">>): Promise<Customer | null> {
    const result = await this.apiRequest(`/api/customers/${id}`, "PUT", data)
    return this.mapId<Customer>(result)
  }

  static async deleteCustomer(id: string): Promise<boolean> {
    await this.apiRequest(`/api/customers/${id}`, "DELETE")
    return true
  }

  static async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers()
    const lowercaseQuery = query.toLowerCase()
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        customer.email.toLowerCase().includes(lowercaseQuery) ||
        customer.phone.includes(query),
    )
  }

  // Suppliers
  static async getSuppliers(): Promise<Supplier[]> {
    const data = await this.apiRequest("/api/suppliers")
    return this.mapIds<Supplier>(data)
  }

  static async addSupplier(data: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<Supplier> {
    const result = await this.apiRequest("/api/suppliers", "POST", data)
    return this.mapId<Supplier>(result)
  }

  static async updateSupplier(id: string, data: Partial<Omit<Supplier, "id" | "createdAt">>): Promise<Supplier | null> {
    const result = await this.apiRequest(`/api/suppliers/${id}`, "PUT", data)
    return this.mapId<Supplier>(result)
  }

  static async deleteSupplier(id: string): Promise<boolean> {
    await this.apiRequest(`/api/suppliers/${id}`, "DELETE")
    return true
  }

  // Sales
  static async getSales(): Promise<Sale[]> {
    const data = await this.apiRequest("/api/sales")
    return this.mapIds<Sale>(data)
  }

  static async getSalesWithEstimateNumber(): Promise<Sale[]> {
    const sales = await this.getSales()
    return sales.map((sale) => ({
      ...sale,
      id: sale.id || sale._id || "unknown",
      estimateNumber: sale.estimateNumber || (sale as any).invoiceNumber || "Unknown",
    })) as Sale[]
  }

  static async recordSale(saleData: any): Promise<Sale> {
    const result = await this.apiRequest("/api/sales", "POST", saleData)
    return this.mapId<Sale>(result)
  }

  static async updateSale(id: string, data: Partial<Omit<Sale, "id" | "createdAt">>): Promise<Sale | null> {
    const result = await this.apiRequest(`/api/sales/${id}`, "PUT", data)
    return this.mapId<Sale>(result)
  }

  static async deleteSale(id: string): Promise<boolean> {
    await this.apiRequest(`/api/sales/${id}`, "DELETE")
    return true
  }

  static async searchSales(query: string): Promise<Sale[]> {
    const sales = await this.getSales()
    const lowercaseQuery = query.toLowerCase()
    return sales.filter((sale) => 
      sale.estimateNumber.toLowerCase().includes(lowercaseQuery) || 
      (sale.customerName && sale.customerName.toLowerCase().includes(lowercaseQuery))
    )
  }

  static async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    const sales = await this.getSales()
    return sales.filter(s => s.customerId === customerId)
  }

  private static mapPurchaseOrder(po: any): PurchaseOrder {
    if (!po) return po
    const mapped = { ...po, id: po._id || po.id } as PurchaseOrder
    if (Array.isArray(mapped.items)) {
      mapped.items = mapped.items.map((item: any) => ({
        ...item,
        id: item.productId || item.id || item._id,
      }))
    }
    return mapped
  }

  // Purchase Orders
  static async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const data = await this.apiRequest("/api/purchase-orders")
    if (!Array.isArray(data)) return []
    return data.map((po) => this.mapPurchaseOrder(po))
  }

  static async addPurchaseOrder(data: any): Promise<PurchaseOrder> {
    const result = await this.apiRequest("/api/purchase-orders", "POST", data)
    return this.mapPurchaseOrder(result)
  }

  static async updatePurchaseOrder(id: string, data: any): Promise<PurchaseOrder | null> {
    const result = await this.apiRequest(`/api/purchase-orders/${id}`, "PUT", data)
    return this.mapPurchaseOrder(result)
  }

  static async deletePurchaseOrder(id: string): Promise<boolean> {
    await this.apiRequest(`/api/purchase-orders/${id}`, "DELETE")
    return true
  }

  // Inventory
  static async getInventoryItems(): Promise<InventoryItem[]> {
    const data = await this.apiRequest("/api/inventory/items")
    return this.mapIds<InventoryItem>(data)
  }

  static async setInventoryItems(items: InventoryItem[]): Promise<void> {
    for (const item of items) {
      await this.apiRequest("/api/inventory/items", "POST", item)
    }
  }

  static async getStockTransactions(): Promise<StockTransaction[]> {
    const data = await this.apiRequest("/api/inventory/transactions")
    return this.mapIds<StockTransaction>(data)
  }

  static async setStockTransactions(transactions: StockTransaction[]): Promise<void> {
    for (const t of transactions) {
      await this.apiRequest("/api/inventory/transactions", "POST", t)
    }
  }

  static async getTransactionBatches(): Promise<TransactionBatch[]> {
    const data = await this.apiRequest("/api/inventory/batches")
    return this.mapIds<TransactionBatch>(data)
  }

  static async setTransactionBatches(batches: TransactionBatch[]): Promise<void> {
    for (const b of batches) {
      await this.apiRequest("/api/inventory/batches", "POST", b)
    }
  }

  // Counters
  static async getNextEstimateNumber(): Promise<number> {
    const result = await this.apiRequest("/api/counters/estimateCounter", "POST")
    return result.seq
  }

  static async getNextPONumber(): Promise<number> {
    const result = await this.apiRequest("/api/counters/poCounter", "POST")
    return result.seq
  }

  // Analytics
  static async getSalesAnalytics(dateRange?: { start: Date; end: Date }): Promise<SalesAnalytics> {
    const sales = await this.getSales()
    let filteredSales = sales

    if (dateRange) {
      filteredSales = sales.filter((sale) => {
        const saleDate = new Date(sale.timestamp)
        return saleDate >= dateRange.start && saleDate <= dateRange.end
      })
    }

    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    const productStats = new Map<string, { name: string; quantity: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productStats.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.lineTotal
        productStats.set(item.productId, existing)
      })
    })

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        totalQuantity: stats.quantity,
        totalRevenue: stats.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    const customerStats = new Map<string, { name: string; orders: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      if (!sale.isCashSale && sale.customerId) {
        const existing = customerStats.get(sale.customerId) || { name: sale.customerName || "", orders: 0, revenue: 0 }
        existing.orders += 1
        existing.revenue += sale.total
        customerStats.set(sale.customerId, existing)
      }
    })

    const topCustomers = Array.from(customerStats.entries())
      .map(([customerId, stats]) => ({
        customerId,
        customerName: stats.name,
        totalOrders: stats.orders,
        totalRevenue: stats.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    const categoryStats = new Map<
      string,
      {
        name: string
        quantity: number
        revenue: number
        subCategories: Map<string, { name: string; quantity: number; revenue: number }>
      }
    >()

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const superCatId = item.superCategoryId.toString()
        const superCat = categoryStats.get(superCatId) || {
          name: item.superCategoryName,
          quantity: 0,
          revenue: 0,
          subCategories: new Map(),
        }
        superCat.quantity += item.quantity
        superCat.revenue += item.lineTotal

        const subCatId = item.subCategoryId.toString()
        const subCat = superCat.subCategories.get(subCatId) || {
          name: item.subCategoryName,
          quantity: 0,
          revenue: 0,
        }
        subCat.quantity += item.quantity
        subCat.revenue += item.lineTotal
        superCat.subCategories.set(subCatId, subCat)

        categoryStats.set(superCatId, superCat)
      })
    })

    const categoryPerformance = Array.from(categoryStats.entries())
      .map(([superCategoryId, stats]) => ({
        superCategoryId,
        superCategoryName: stats.name,
        totalQuantity: stats.quantity,
        totalRevenue: stats.revenue,
        subCategories: Array.from(stats.subCategories.entries())
          .map(([subCategoryId, subStats]) => ({
            subCategoryId,
            subCategoryName: subStats.name,
            totalQuantity: subStats.quantity,
            totalRevenue: subStats.revenue,
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    const dailyStats = new Map<string, { sales: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      const date = new Date(sale.timestamp).toLocaleDateString("en-IN")
      const existing = dailyStats.get(date) || { sales: 0, revenue: 0 }
      existing.sales += 1
      existing.revenue += sale.total
      dailyStats.set(date, existing)
    })

    const dailySales = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        totalSales: stats.sales,
        totalRevenue: stats.revenue,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const monthlyStats = new Map<string, { sales: number; revenue: number }>()
    const paymentStats = new Map<string, { count: number; total: number }>()
    const hourlyStats = new Array(24).fill(null).map(() => ({ count: 0, total: 0 }))

    filteredSales.forEach((sale) => {
      // Payment Method
      const method = sale.paymentMethod || "unknown"
      const pExisting = paymentStats.get(method) || { count: 0, total: 0 }
      pExisting.count += 1
      pExisting.total += sale.total
      paymentStats.set(method, pExisting)

      // Hourly Trends
      const hour = new Date(sale.timestamp || sale.date).getHours()
      if (hour >= 0 && hour < 24) {
        hourlyStats[hour].count += 1
        hourlyStats[hour].total += sale.total
      }
    })

    const paymentMethodBreakdown = Array.from(paymentStats.entries()).map(([method, stats]) => ({
      method,
      count: stats.count,
      total: stats.total,
    }))

    const hourlyTrends = hourlyStats.map((stats, hour) => ({
      hour,
      count: stats.count,
      total: stats.total,
    }))
    filteredSales.forEach((sale) => {
      const date = new Date(sale.timestamp)
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
      const existing = monthlyStats.get(month) || { sales: 0, revenue: 0 }
      existing.sales += 1
      existing.revenue += sale.total
      monthlyStats.set(month, existing)
    })


    const monthlySales = Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({
        month,
        totalSales: stats.sales,
        totalRevenue: stats.revenue,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      topProducts,
      topCustomers,
      categoryPerformance,
      dailySales,
      monthlySales,
      paymentMethodBreakdown,
      hourlyTrends,
    }
  }

  // Migration
  static async migrateToMongoDB(): Promise<void> {
    const data: any = {}
    const keys = [
      "superCategories",
      "subCategories",
      "products",
      "customers",
      "suppliers",
      "sales",
      "purchaseOrders",
      "inventory_items",
      "stock_transactions",
      "transaction_batches",
      "estimateCounter",
      "poCounter",
    ]

    for (const key of keys) {
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          data[key] = JSON.parse(stored)
        } catch (e) {
          data[key] = stored
        }
      }
    }

    await this.apiRequest("/api/migrate", "POST", data)
    localStorage.setItem("mongodb_migrated", "true")
  }

  // Utilities
  static formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  static getAllDataTypes(): any[] {
    return [
      { key: "superCategories", name: "Super Categories", description: "Main categories" },
      { key: "subCategories", name: "Sub Categories", description: "Secondary categories" },
      { key: "products", name: "Products", description: "Inventory items" },
      { key: "customers", name: "Customers", description: "Client records" },
      { key: "suppliers", name: "Suppliers", description: "Vendor records" },
      { key: "sales", name: "Sales", description: "Transaction history" },
      { key: "purchaseOrders", name: "Purchase Orders", description: "Order history" },
    ].map(t => ({ ...t, count: 0, size: "MongoDB" }))
  }

  static getStorageInfo() {
    return {
      usedFormatted: "MongoDB",
      totalFormatted: "Cloud",
      percentage: 0,
      availableFormatted: "Scalable"
    }
  }
  static async exportSelectedData(types: string[], format: "json" | "csv"): Promise<any> {
    const data: any = {}
    for (const type of types) {
      switch (type) {
        case "superCategories": data.superCategories = await this.getSuperCategories(); break
        case "subCategories": data.subCategories = await this.getSubCategories(); break
        case "products": data.products = await this.getProducts(); break
        case "customers": data.customers = await this.getCustomers(); break
        case "suppliers": data.suppliers = await this.getSuppliers(); break
        case "sales": data.sales = await this.getSales(); break
        case "purchaseOrders": data.purchaseOrders = await this.getPurchaseOrders(); break
        case "inventory_items": data.inventory_items = await this.getInventoryItems(); break
        case "stock_transactions": data.stock_transactions = await this.getStockTransactions(); break
        case "transaction_batches": data.transaction_batches = await this.getTransactionBatches(); break
      }
    }

    if (format === "json") return data

    let csv = ""
    for (const [type, items] of Object.entries(data)) {
      if (Array.isArray(items) && items.length > 0) {
        const headers = Object.keys(items[0]).join(",")
        const rows = items.map((item: any) => 
          Object.values(item).map(v => JSON.stringify(v)).join(",")
        ).join("\n")
        csv += `${type.toUpperCase()}\n${headers}\n${rows}\n\n`
      }
    }
    return csv
  }

  static async importSelectedData(data: string, types: string[], format: "json" | "csv"): Promise<void> {
    let parsedData: any = {}
    if (format === "json") {
      parsedData = JSON.parse(data)
    } else {
      // Very basic CSV parsing for a single type if needed
      // But migrate expects full object
      throw new Error("CSV import not implemented for MongoDB migration yet")
    }
    await this.apiRequest("/api/migrate", "POST", parsedData)
  }

  static async clearSelectedData(types: string[]): Promise<void> {
    const clearData: any = {}
    types.forEach(t => clearData[t] = [])
    await this.apiRequest("/api/migrate", "POST", clearData)
  }
}

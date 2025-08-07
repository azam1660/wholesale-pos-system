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

interface SaleItem {
  id: string
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

interface Sale {
  id: string
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

interface SalesAnalytics {
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
}
const defaultData = {
  superCategories: [
    {
      id: "groceries",
      name: "Groceries & Staples",
      icon: "🌾",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "beverages",
      name: "Beverages",
      icon: "🥤",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "snacks",
      name: "Snacks & Confectionery",
      icon: "🍪",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "personal-care",
      name: "Personal Care",
      icon: "🧴",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "household",
      name: "Household Items",
      icon: "🧽",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "dairy",
      name: "Dairy & Frozen",
      icon: "🥛",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  subCategories: [
    {
      id: "rice-grains",
      name: "Rice & Grains",
      icon: "🍚",
      superCategoryId: "groceries",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pulses-lentils",
      name: "Pulses & Lentils",
      icon: "🫘",
      superCategoryId: "groceries",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "spices",
      name: "Spices & Masalas",
      icon: "🌶️",
      superCategoryId: "groceries",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tea-coffee",
      name: "Tea & Coffee",
      icon: "☕",
      superCategoryId: "beverages",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "biscuits",
      name: "Biscuits & Cookies",
      icon: "🍪",
      superCategoryId: "snacks",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: "basmati-rice",
      name: "Basmati Rice 5kg",
      price: 450.0,
      stock: 100,
      unit: "bag",
      subCategoryId: "rice-grains",
      hamaliValue: 5.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "toor-dal",
      name: "Toor Dal 1kg",
      price: 120.0,
      stock: 200,
      unit: "kg",
      subCategoryId: "pulses-lentils",
      hamaliValue: 2.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "turmeric",
      name: "Turmeric Powder 500g",
      price: 80.0,
      stock: 100,
      unit: "pack",
      subCategoryId: "spices",
      hamaliValue: 1.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tea-leaves",
      name: "Premium Tea 1kg",
      price: 320.0,
      stock: 50,
      unit: "pack",
      subCategoryId: "tea-coffee",
      hamaliValue: 3.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "parle-g",
      name: "Parle-G Biscuits 1kg",
      price: 80.0,
      stock: 200,
      unit: "pack",
      subCategoryId: "biscuits",
      hamaliValue: 1.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  customers: [
    {
      id: "cust1",
      name: "Sharma General Store",
      email: "sharma@gmail.com",
      phone: "+91-98765-43210",
      address: "123 Main Market, Delhi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cust2",
      name: "Patel Wholesale Traders",
      email: "patel.traders@gmail.com",
      phone: "+91-87654-32109",
      address: "456 Commercial Street, Mumbai",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
}

export class DataManager {
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  private static getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
  private static setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))

      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: JSON.stringify(data),
          storageArea: localStorage,
        }),
      )
    } catch (error) {
      console.error(`Error saving ${key}:`, error)
      throw new Error(`Failed to save ${key}`)
    }
  }

  private static getItem<T>(key: string, defaultData: T[]): T[] {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)

        if (Array.isArray(parsed)) {
          return parsed
        }
      }

      this.setItem(key, defaultData)
      return defaultData
    } catch (error) {
      console.error(`Error loading ${key}:`, error)

      this.setItem(key, defaultData)
      return defaultData
    }
  }
  static getSuperCategories(): SuperCategory[] {
    return this.getItem<SuperCategory>("superCategories", defaultData.superCategories)
  }

  static async addSuperCategory(data: Omit<SuperCategory, "id" | "createdAt" | "updatedAt">): Promise<SuperCategory> {
    const categories = this.getSuperCategories()
    const newCategory: SuperCategory = {
      ...data,
      id: this.generateId(),
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    }

    const updated = [...categories, newCategory]
    this.setItem("superCategories", updated)
    return newCategory
  }

  static async updateSuperCategory(
    id: string,
    data: Partial<Omit<SuperCategory, "id" | "createdAt">>,
  ): Promise<SuperCategory | null> {
    const categories = this.getSuperCategories()
    const index = categories.findIndex((cat) => cat.id === id)

    if (index === -1) return null

    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, ...data, updatedAt: this.getCurrentTimestamp() } : cat,
    )

    this.setItem("superCategories", updated)
    return updated[index]
  }

  static async deleteSuperCategory(id: string): Promise<boolean> {
    const categories = this.getSuperCategories()
    const filtered = categories.filter((cat) => cat.id !== id)

    if (filtered.length === categories.length) return false

    this.setItem("superCategories", filtered)
    const subCategories = this.getSubCategories()
    const filteredSubs = subCategories.filter((sub) => sub.superCategoryId !== id)
    this.setItem("subCategories", filteredSubs)

    const products = this.getProducts()
    const subIds = subCategories.filter((sub) => sub.superCategoryId === id).map((sub) => sub.id)
    const filteredProducts = products.filter((prod) => !subIds.includes(prod.subCategoryId))
    this.setItem("products", filteredProducts)

    return true
  }
  static getSubCategories(): SubCategory[] {
    return this.getItem<SubCategory>("subCategories", defaultData.subCategories)
  }

  static async addSubCategory(data: Omit<SubCategory, "id" | "createdAt" | "updatedAt">): Promise<SubCategory> {
    const categories = this.getSubCategories()
    const newCategory: SubCategory = {
      ...data,
      id: this.generateId(),
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    }

    const updated = [...categories, newCategory]
    this.setItem("subCategories", updated)
    return newCategory
  }

  static async updateSubCategory(
    id: string,
    data: Partial<Omit<SubCategory, "id" | "createdAt">>,
  ): Promise<SubCategory | null> {
    const categories = this.getSubCategories()
    const index = categories.findIndex((cat) => cat.id === id)

    if (index === -1) return null

    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, ...data, updatedAt: this.getCurrentTimestamp() } : cat,
    )

    this.setItem("subCategories", updated)
    return updated[index]
  }

  static async deleteSubCategory(id: string): Promise<boolean> {
    const categories = this.getSubCategories()
    const filtered = categories.filter((cat) => cat.id !== id)

    if (filtered.length === categories.length) return false

    this.setItem("subCategories", filtered)
    const products = this.getProducts()
    const filteredProducts = products.filter((prod) => prod.subCategoryId !== id)
    this.setItem("products", filteredProducts)

    return true
  }
  static getProducts(): Product[] {
    return this.getItem<Product>("products", defaultData.products)
  }

  static async addProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const products = this.getProducts()
    const newProduct: Product = {
      ...data,
      id: this.generateId(),
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    }

    const updated = [...products, newProduct]
    this.setItem("products", updated)
    return newProduct
  }

  static async updateProduct(id: string, data: Partial<Omit<Product, "id" | "createdAt">>): Promise<Product | null> {
    const products = this.getProducts()
    const index = products.findIndex((prod) => prod.id === id)

    if (index === -1) return null

    const updated = products.map((prod) =>
      prod.id === id ? { ...prod, ...data, updatedAt: this.getCurrentTimestamp() } : prod,
    )

    this.setItem("products", updated)
    return updated[index]
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const products = this.getProducts()
    const filtered = products.filter((prod) => prod.id !== id)

    if (filtered.length === products.length) return false

    this.setItem("products", filtered)
    return true
  }

  static async updateProductStock(id: string, newStock: number): Promise<Product | null> {
    return this.updateProduct(id, { stock: newStock })
  }
  static getCustomers(): Customer[] {
    return this.getItem<Customer>("customers", defaultData.customers)
  }

  static async addCustomer(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const customers = this.getCustomers()
    const newCustomer: Customer = {
      ...data,
      id: this.generateId(),
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    }

    const updated = [...customers, newCustomer]
    this.setItem("customers", updated)
    return newCustomer
  }

  static async updateCustomer(id: string, data: Partial<Omit<Customer, "id" | "createdAt">>): Promise<Customer | null> {
    const customers = this.getCustomers()
    const index = customers.findIndex((cust) => cust.id === id)

    if (index === -1) return null

    const updated = customers.map((cust) =>
      cust.id === id ? { ...cust, ...data, updatedAt: this.getCurrentTimestamp() } : cust,
    )

    this.setItem("customers", updated)
    return updated[index]
  }

  static async deleteCustomer(id: string): Promise<boolean> {
    const customers = this.getCustomers()
    const filtered = customers.filter((cust) => cust.id !== id)

    if (filtered.length === customers.length) return false

    this.setItem("customers", filtered)
    return true
  }
  static getSales(): Sale[] {
    return this.getItem<Sale>("sales", [])
  }
  static getSalesWithEstimateNumber(): Sale[] {
    const sales = this.getSales()

    return sales.map((sale) => ({
      ...sale,
      estimateNumber: sale.estimateNumber || (sale as any).invoiceNumber || "Unknown",
    }))
  }

  static async recordSale(saleData: {
    estimateNumber: string
    customerId?: string
    isCashSale: boolean
    items: Array<{
      productId: string
      quantity: number
      unitPrice: number
    }>
    paymentMethod?: "cash" | "card" | "upi" | "credit"
    timestamp?: number
    customerName?: string
    customerPhone?: string
    subtotal: number
    hamaliCharges: number
    total: number
    reference?: string
  }): Promise<Sale> {
    const sales = this.getSales()
    const products = this.getProducts()
    const subCategories = this.getSubCategories()
    const superCategories = this.getSuperCategories()
    const customers = this.getCustomers()
    const customer = saleData.customerId ? customers.find((c) => c.id === saleData.customerId) : null
    const saleItems: SaleItem[] = saleData.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) throw new Error(`Product not found: ${item.productId}`)

      const subCategory = subCategories.find((sc) => sc.id === product.subCategoryId)
      if (!subCategory) throw new Error(`Sub category not found: ${product.subCategoryId}`)

      const superCategory = superCategories.find((sc) => sc.id === subCategory.superCategoryId)
      if (!superCategory) throw new Error(`Super category not found: ${subCategory.superCategoryId}`)

      return {
        id: this.generateId(),
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        unit: product.unit,
        subCategoryId: subCategory.id,
        subCategoryName: subCategory.name,
        superCategoryId: superCategory.id,
        superCategoryName: superCategory.name,
      }
    })

    const newSale: Sale = {
      id: this.generateId(),
      estimateNumber: saleData.estimateNumber,
      date: new Date().toLocaleDateString("en-IN"),
      timestamp: saleData.timestamp || Date.now(),
      customerId: customer?.id,
      customerName: saleData.customerName || customer?.name,
      customerPhone: saleData.customerPhone || customer?.phone,
      isCashSale: saleData.isCashSale,
      items: saleItems,
      subtotal: saleData.subtotal,
      hamaliCharges: saleData.hamaliCharges,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod || "cash",
      reference: saleData.reference,
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    }
    for (const item of saleData.items) {
      const product = products.find((p) => p.id === item.productId)
      if (product) {
        await this.updateProductStock(product.id, Math.max(0, product.stock - item.quantity))
      }
    }

    const updated = [...sales, newSale]
    this.setItem("sales", updated)
    return newSale
  }

  static async updateSale(id: string, data: Partial<Omit<Sale, "id" | "createdAt">>): Promise<Sale | null> {
    const sales = this.getSales()
    const index = sales.findIndex((sale) => sale.id === id)

    if (index === -1) return null

    const updated = sales.map((sale) =>
      sale.id === id ? { ...sale, ...data, updatedAt: this.getCurrentTimestamp() } : sale,
    )

    this.setItem("sales", updated)
    return updated[index]
  }

  static async deleteSale(id: string): Promise<boolean> {
    const sales = this.getSales()
    const filtered = sales.filter((sale) => sale.id !== id)

    if (filtered.length === sales.length) return false

    this.setItem("sales", filtered)
    return true
  }
  static getSalesAnalytics(dateRange?: { start: Date; end: Date }): SalesAnalytics {
    const sales = this.getSales()
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
        const superCat = categoryStats.get(item.superCategoryId) || {
          name: item.superCategoryName,
          quantity: 0,
          revenue: 0,
          subCategories: new Map(),
        }
        superCat.quantity += item.quantity
        superCat.revenue += item.lineTotal
        const subCat = superCat.subCategories.get(item.subCategoryId) || {
          name: item.subCategoryName,
          quantity: 0,
          revenue: 0,
        }
        subCat.quantity += item.quantity
        subCat.revenue += item.lineTotal
        superCat.subCategories.set(item.subCategoryId, subCat)

        categoryStats.set(item.superCategoryId, superCat)
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
    }
  }
  static searchProducts(query: string): Product[] {
    const products = this.getProducts()
    const lowercaseQuery = query.toLowerCase()

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) || product.unit.toLowerCase().includes(lowercaseQuery),
    )
  }

  static searchCustomers(query: string): Customer[] {
    const customers = this.getCustomers()
    const lowercaseQuery = query.toLowerCase()

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        customer.email.toLowerCase().includes(lowercaseQuery) ||
        customer.phone.includes(query),
    )
  }

  static searchSales(query: string): Sale[] {
    const sales = this.getSales()
    const lowercaseQuery = query.toLowerCase()

    return sales.filter(
      (sale) =>
        sale.estimateNumber.toLowerCase().includes(lowercaseQuery) ||
        sale.customerName?.toLowerCase().includes(lowercaseQuery) ||
        sale.items.some((item) => item.productName.toLowerCase().includes(lowercaseQuery)),
    )
  }

  static getProductsBySubCategory(subCategoryId: string): Product[] {
    const products = this.getProducts()
    return products.filter((product) => product.subCategoryId === subCategoryId)
  }

  static getSubCategoriesBySuperCategory(superCategoryId: string): SubCategory[] {
    const subCategories = this.getSubCategories()
    return subCategories.filter((subCategory) => subCategory.superCategoryId === superCategoryId)
  }

  static getSalesByCustomer(customerId: string): Sale[] {
    const sales = this.getSales()
    return sales.filter((sale) => sale.customerId === customerId)
  }

  static getSalesByDateRange(start: Date, end: Date): Sale[] {
    const sales = this.getSales()
    return sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp)
      return saleDate >= start && saleDate <= end
    })
  }
  static validateSuperCategory(data: Partial<SuperCategory>): string[] {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push("Name is required")
    }

    if (!data.icon?.trim()) {
      errors.push("Icon is required")
    }

    return errors
  }

  static validateSubCategory(data: Partial<SubCategory>): string[] {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push("Name is required")
    }

    if (!data.icon?.trim()) {
      errors.push("Icon is required")
    }

    if (!data.superCategoryId?.trim()) {
      errors.push("Super category is required")
    }

    return errors
  }

  static validateProduct(data: Partial<Product>): string[] {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push("Name is required")
    }

    if (typeof data.price !== "number" || data.price < 0) {
      errors.push("Valid price is required")
    }

    if (typeof data.stock !== "number" || data.stock < 0) {
      errors.push("Valid stock quantity is required")
    }

    if (!data.unit?.trim()) {
      errors.push("Unit is required")
    }

    if (!data.subCategoryId?.trim()) {
      errors.push("Sub category is required")
    }

    if (typeof data.hamaliValue !== "number" || data.hamaliValue < 0) {
      errors.push("Valid hamali value is required")
    }

    return errors
  }

  static validateCustomer(data: Partial<Customer>): string[] {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push("Name is required")
    }

    if (!data.phone?.trim()) {
      errors.push("Phone is required")
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Valid email is required")
    }

    return errors
  }
  static async importData(data: {
    superCategories?: SuperCategory[]
    subCategories?: SubCategory[]
    products?: Product[]
    customers?: Customer[]
    sales?: Sale[]
  }): Promise<void> {
    try {
      if (data.superCategories) {
        this.setItem("superCategories", data.superCategories)
      }

      if (data.subCategories) {
        this.setItem("subCategories", data.subCategories)
      }

      if (data.products) {
        this.setItem("products", data.products)
      }

      if (data.customers) {
        this.setItem("customers", data.customers)
      }

      if (data.sales) {
        this.setItem("sales", data.sales)
      }
    } catch (error) {
      console.error("Error importing data:", error)
      throw new Error("Failed to import data")
    }
  }

  static exportData(): {
    superCategories: SuperCategory[]
    subCategories: SubCategory[]
    products: Product[]
    customers: Customer[]
    sales: Sale[]
  } {
    return {
      superCategories: this.getSuperCategories(),
      subCategories: this.getSubCategories(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      sales: this.getSales(),
    }
  }
  static getDataStats(): {
    superCategories: number
    subCategories: number
    products: number
    customers: number
    sales: number
    totalStock: number
    totalValue: number
    totalRevenue: number
  } {
    const superCategories = this.getSuperCategories()
    const subCategories = this.getSubCategories()
    const products = this.getProducts()
    const customers = this.getCustomers()
    const sales = this.getSales()

    const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
    const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)

    return {
      superCategories: superCategories.length,
      subCategories: subCategories.length,
      products: products.length,
      customers: customers.length,
      sales: sales.length,
      totalStock,
      totalValue,
      totalRevenue,
    }
  }
  static clearAllData(): void {
    localStorage.removeItem("superCategories")
    localStorage.removeItem("subCategories")
    localStorage.removeItem("products")
    localStorage.removeItem("customers")
    localStorage.removeItem("sales")
    localStorage.removeItem("estimateCounter")
    window.dispatchEvent(new StorageEvent("storage", { key: "superCategories", storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent("storage", { key: "subCategories", storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent("storage", { key: "products", storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent("storage", { key: "customers", storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent("storage", { key: "sales", storageArea: localStorage }))
  }
  static setInventoryItems(items: any[]): void {
    this.setItem("inventory_items", items)
  }

  static getInventoryItems(): any[] {
    return this.getItem("inventory_items", [])
  }

  static setStockTransactions(transactions: any[]): void {
    this.setItem("stock_transactions", transactions)
  }

  static getStockTransactions(): any[] {
    return this.getItem("stock_transactions", [])
  }

  static getAllDataTypes(): Array<{
    key: string
    name: string
    description: string
    count: number
    size: string
  }> {
    const dataTypes = [
      { key: "superCategories", name: "Super Categories", description: "Main product categories" },
      { key: "subCategories", name: "Sub Categories", description: "Product subcategories" },
      { key: "products", name: "Products", description: "Product inventory items" },
      { key: "customers", name: "Customers", description: "Customer information" },
      { key: "sales", name: "Sales Records", description: "Sales transactions" },
      { key: "inventory_items", name: "Inventory Items", description: "Inventory management data" },
      { key: "stock_transactions", name: "Stock Transactions", description: "Stock movement history" },
      { key: "estimateCounter", name: "Estimate Counter", description: "Invoice/estimate numbering" },
      { key: "pos_backups", name: "Backup History", description: "System backup records" },
      { key: "salesRecords", name: "Legacy Sales", description: "Legacy sales data" },
    ]

    return dataTypes.map((type) => {
      const data = this.getRawData(type.key)
      const dataStr = JSON.stringify(data)
      const sizeInBytes = new Blob([dataStr]).size
      const sizeFormatted = this.formatBytes(sizeInBytes)

      return {
        ...type,
        count: Array.isArray(data) ? data.length : data ? 1 : 0,
        size: sizeFormatted,
      }
    })
  }

  static getRawData(key: string): any {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error(`Error loading ${key}:`, error)
      return null
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  static exportSelectedData(selectedTypes: string[], format: "json" | "csv"): { [key: string]: any } | string {
    const exportData: { [key: string]: any } = {}

    selectedTypes.forEach((type) => {
      const data = this.getRawData(type)
      if (data !== null) {
        exportData[type] = data
      }
    })

    if (format === "json") {
      return exportData
    } else {

      return this.convertToCSV(exportData)
    }
  }

  static convertToCSV(data: { [key: string]: any }): string {
    let csvContent = ""

    Object.entries(data).forEach(([key, value]) => {
      csvContent += `\n\n=== ${key.toUpperCase()} ===\n`

      if (Array.isArray(value) && value.length > 0) {

        const headers = Object.keys(value[0])
        csvContent += headers.join(",") + "\n"

        value.forEach((item) => {
          const row = headers.map((header) => {
            const cellValue = item[header]

            if (typeof cellValue === "string" && (cellValue.includes(",") || cellValue.includes('"'))) {
              return `"${cellValue.replace(/"/g, '""')}"`
            }
            return cellValue || ""
          })
          csvContent += row.join(",") + "\n"
        })
      } else if (value && typeof value === "object") {

        const headers = Object.keys(value)
        csvContent += headers.join(",") + "\n"
        const row = headers.map((header) => value[header] || "")
        csvContent += row.join(",") + "\n"
      } else {
        csvContent += `${value}\n`
      }
    })

    return csvContent
  }

  static async importSelectedData(data: any, selectedTypes: string[], format: "json" | "csv"): Promise<void> {
    try {
      let importData: { [key: string]: any } = {}

      if (format === "json") {
        importData = typeof data === "string" ? JSON.parse(data) : data
      } else {

        importData = this.parseCSV(data)
      }

      selectedTypes.forEach((type) => {
        if (importData[type] !== undefined) {
          localStorage.setItem(type, JSON.stringify(importData[type]))

          window.dispatchEvent(
            new StorageEvent("storage", {
              key: type,
              newValue: JSON.stringify(importData[type]),
              storageArea: localStorage,
            }),
          )
        }
      })
    } catch (error) {
      console.error("Error importing data:", error)
      throw new Error("Failed to import data")
    }
  }

  static parseCSV(csvData: string): { [key: string]: any } {
    const result: { [key: string]: any } = {}
    const sections = csvData.split(/\n\n=== (\w+) ===\n/)

    for (let i = 1; i < sections.length; i += 2) {
      const sectionName = sections[i].toLowerCase()
      const sectionData = sections[i + 1]

      if (sectionData && sectionData.trim()) {
        const lines = sectionData.trim().split("\n")
        if (lines.length > 1) {
          const headers = lines[0].split(",")
          const rows = lines.slice(1).map((line) => {
            const values = line.split(",")
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ""
            })
            return obj
          })
          result[sectionName] = rows
        }
      }
    }

    return result
  }

  static getStorageInfo(): {
    used: number
    total: number
    available: number
    usedFormatted: string
    totalFormatted: string
    availableFormatted: string
    percentage: number
  } {
    let used = 0

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    const total = 5 * 1024 * 1024
    const available = total - used
    const percentage = (used / total) * 100

    return {
      used,
      total,
      available,
      usedFormatted: this.formatBytes(used),
      totalFormatted: this.formatBytes(total),
      availableFormatted: this.formatBytes(available),
      percentage: Math.min(percentage, 100),
    }
  }

  static clearSelectedData(selectedTypes: string[]): void {
    selectedTypes.forEach((type) => {
      localStorage.removeItem(type)
      window.dispatchEvent(new StorageEvent("storage", { key: type, storageArea: localStorage }))
    })
  }
}

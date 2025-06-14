"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Database, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DataManagement from "./data-management"
import ImageUpload from "./image-upload"
import SalesAnalytics from "./sales-analytics"
import { DataManager } from "./data-manager"
import SalesDataManagement from "./sales-data-management"

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
  createdAt: string
  updatedAt: string
  hamaliValue: number
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

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "super" | "sub" | "products" | "customers" | "data" | "analytics" | "sales"
  >("super")
  const [superCategories, setSuperCategories] = useState<SuperCategory[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  // Dialog states
  const [showSuperDialog, setShowSuperDialog] = useState(false)
  const [showSubDialog, setShowSubDialog] = useState(false)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)

  // Edit states
  const [editingSuperCategory, setEditingSuperCategory] = useState<SuperCategory | null>(null)
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    unit: "",
    image: "",
    subCategoryId: "",
    hamaliValue: 0,
  })
  const [superForm, setSuperForm] = useState({ name: "", icon: "", image: "" })
  const [subForm, setSubForm] = useState({ name: "", icon: "", image: "", superCategoryId: "" })
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  // Error states
  const [errors, setErrors] = useState<string[]>([])

  // Load data from DataManager on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setSuperCategories(DataManager.getSuperCategories())
    setSubCategories(DataManager.getSubCategories())
    setProducts(DataManager.getProducts())
    setCustomers(DataManager.getCustomers())
  }

  // Super Category CRUD
  const handleSaveSuperCategory = async () => {
    const validationErrors = DataManager.validateSuperCategory(superForm)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (editingSuperCategory) {
        await DataManager.updateSuperCategory(editingSuperCategory.id, superForm)
      } else {
        await DataManager.addSuperCategory(superForm)
      }

      loadData()
      resetSuperForm()
      setErrors([])
    } catch (error) {
      console.error("Error saving super category:", error)
      setErrors(["Failed to save super category"])
    }
  }

  const handleDeleteSuperCategory = async (id: string) => {
    try {
      await DataManager.deleteSuperCategory(id)
      loadData()
    } catch (error) {
      console.error("Error deleting super category:", error)
      setErrors(["Failed to delete super category"])
    }
  }

  const resetSuperForm = () => {
    setSuperForm({ name: "", icon: "", image: "" })
    setEditingSuperCategory(null)
    setShowSuperDialog(false)
  }

  // Sub Category CRUD
  const handleSaveSubCategory = async () => {
    const validationErrors = DataManager.validateSubCategory(subForm)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (editingSubCategory) {
        await DataManager.updateSubCategory(editingSubCategory.id, subForm)
      } else {
        await DataManager.addSubCategory(subForm)
      }

      loadData()
      resetSubForm()
      setErrors([])
    } catch (error) {
      console.error("Error saving sub category:", error)
      setErrors(["Failed to save sub category"])
    }
  }

  const handleDeleteSubCategory = async (id: string) => {
    try {
      await DataManager.deleteSubCategory(id)
      loadData()
    } catch (error) {
      console.error("Error deleting sub category:", error)
      setErrors(["Failed to delete sub category"])
    }
  }

  const resetSubForm = () => {
    setSubForm({ name: "", icon: "", image: "", superCategoryId: "" })
    setEditingSubCategory(null)
    setShowSubDialog(false)
  }

  // Product CRUD
  const handleSaveProduct = async () => {
    const validationErrors = DataManager.validateProduct(productForm)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (editingProduct) {
        await DataManager.updateProduct(editingProduct.id, productForm)
      } else {
        await DataManager.addProduct(productForm)
      }

      loadData()
      resetProductForm()
      setErrors([])
    } catch (error) {
      console.error("Error saving product:", error)
      setErrors(["Failed to save product"])
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await DataManager.deleteProduct(id)
      loadData()
    } catch (error) {
      console.error("Error deleting product:", error)
      setErrors(["Failed to delete product"])
    }
  }

  const resetProductForm = () => {
    setProductForm({
      name: "",
      price: 0,
      stock: 0,
      unit: "",
      image: "",
      subCategoryId: "",
      hamaliValue: 0,
    })
    setEditingProduct(null)
    setShowProductDialog(false)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      image: product.image || "",
      subCategoryId: product.subCategoryId,
      hamaliValue: product.hamaliValue || 0,
    })
    setShowProductDialog(true)
    setErrors([])
  }

  // Customer CRUD
  const handleSaveCustomer = async () => {
    const validationErrors = DataManager.validateCustomer(customerForm)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (editingCustomer) {
        await DataManager.updateCustomer(editingCustomer.id, customerForm)
      } else {
        await DataManager.addProduct(customerForm)
      }

      loadData()
      resetCustomerForm()
      setErrors([])
    } catch (error) {
      console.error("Error saving customer:", error)
      setErrors(["Failed to save customer"])
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    try {
      await DataManager.deleteCustomer(id)
      loadData()
    } catch (error) {
      console.error("Error deleting customer:", error)
      setErrors(["Failed to delete customer"])
    }
  }

  const resetCustomerForm = () => {
    setCustomerForm({ name: "", email: "", phone: "", address: "" })
    setEditingCustomer(null)
    setShowCustomerDialog(false)
  }

  const openEditSuperCategory = (category: SuperCategory) => {
    setEditingSuperCategory(category)
    setSuperForm({ name: category.name, icon: category.icon, image: category.image || "" })
    setShowSuperDialog(true)
    setErrors([])
  }

  const openEditSubCategory = (category: SubCategory) => {
    setEditingSubCategory(category)
    setSubForm({
      name: category.name,
      icon: category.icon,
      image: category.image || "",
      superCategoryId: category.superCategoryId,
    })
    setShowSubDialog(true)
    setErrors([])
  }

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    })
    setShowCustomerDialog(true)
    setErrors([])
  }

  // Show analytics view
  if (activeTab === "analytics") {
    return <SalesAnalytics onBack={() => setActiveTab("super")} />
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
              Back to POS
            </Button>
            <h1 className="text-3xl font-bold text-black">Admin Panel</h1>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("super")}
            variant={activeTab === "super" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "super" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}`}
          >
            Super Categories
          </Button>
          <Button
            onClick={() => setActiveTab("sub")}
            variant={activeTab === "sub" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "sub" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}`}
          >
            Sub Categories
          </Button>
          <Button
            onClick={() => setActiveTab("products")}
            variant={activeTab === "products" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "products" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""
              }`}
          >
            Products
          </Button>
          <Button
            onClick={() => setActiveTab("customers")}
            variant={activeTab === "customers" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "customers" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""
              }`}
          >
            Customers
          </Button>
          <Button
            onClick={() => setActiveTab("analytics")}
            variant={activeTab === "analytics" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "analytics" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Sales Analytics
          </Button>
          <Button
            onClick={() => setActiveTab("data")}
            variant={activeTab === "data" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "data" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}`}
          >
            <Database className="w-4 h-4 mr-2" />
            Data Management
          </Button>
          <Button
            onClick={() => setActiveTab("sales")}
            variant={activeTab === "sales" ? "default" : "outline"}
            className={`rounded-[9px] ${activeTab === "sales" ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Sales Management
          </Button>
        </div>

        {/* Super Categories Tab */}
        {activeTab === "super" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Super Categories</h2>
              <Button
                onClick={() => {
                  setShowSuperDialog(true)
                  setErrors([])
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Super Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {superCategories.map((category) => (
                <Card key={category.id} className="rounded-[11px]">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {category.image ? (
                              <img
                                src={category.image || "/placeholder.svg"}
                                alt={category.name}
                                className="w-12 h-12 object-cover rounded-[9px] border-2 border-gray-200"
                              />
                            ) : (
                              <span className="text-2xl">{category.icon}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditSuperCategory(category)}
                            className="rounded-[9px]"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSuperCategory(category.id)}
                            className="rounded-[9px] text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sub Categories Tab */}
        {activeTab === "sub" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Sub Categories</h2>
              <Button
                onClick={() => {
                  setShowSubDialog(true)
                  setErrors([])
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sub Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subCategories.map((category) => {
                const superCategory = superCategories.find((s) => s.id === category.superCategoryId)
                return (
                  <Card key={category.id} className="rounded-[11px]">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {category.image ? (
                                <img
                                  src={category.image || "/placeholder.svg"}
                                  alt={category.name}
                                  className="w-12 h-12 object-cover rounded-[9px] border-2 border-gray-200"
                                />
                              ) : (
                                <span className="text-2xl">{category.icon}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{category.name}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditSubCategory(category)}
                              className="rounded-[9px]"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSubCategory(category.id)}
                              className="rounded-[9px] text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">Parent: {superCategory?.name || "Unknown"}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Products</h2>
              <Button
                onClick={() => {
                  setShowProductDialog(true)
                  setErrors([])
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const subCategory = subCategories.find((s) => s.id === product.subCategoryId)
                return (
                  <Card key={product.id} className="rounded-[11px]">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {product.image && (
                                <img
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-[9px] border-2 border-gray-200"
                                />
                              )}
                              <div>
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Price: ₹{product.price}</p>
                              <p className={product.stock <= 10 ? "text-red-600 font-medium" : ""}>
                                Stock: {product.stock} {product.unit}
                              </p>
                              <p>Category: {subCategory?.name || "Unknown"}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditProduct(product)}
                              className="rounded-[9px]"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="rounded-[9px] text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Customers</h2>
              <Button
                onClick={() => {
                  setShowCustomerDialog(true)
                  setErrors([])
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <Card key={customer.id} className="rounded-[11px]">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{customer.name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditCustomer(customer)}
                            className="rounded-[9px]"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="rounded-[9px] text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{customer.phone}</p>
                        <p>{customer.email}</p>
                        <p className="truncate">{customer.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === "data" && <DataManagement />}

        {/* Sales Management Tab */}
        {activeTab === "sales" && <SalesDataManagement />}
      </div>

      {/* Super Category Dialog */}
      <Dialog open={showSuperDialog} onOpenChange={setShowSuperDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSuperCategory ? "Edit" : "Add"} Super Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="super-name">Name</Label>
              <Input
                id="super-name"
                value={superForm.name}
                onChange={(e) => setSuperForm({ ...superForm, name: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="super-icon">Icon (Emoji)</Label>
              <Input
                id="super-icon"
                value={superForm.icon}
                onChange={(e) => setSuperForm({ ...superForm, icon: e.target.value })}
                className="rounded-[9px]"
                placeholder="🌾"
              />
            </div>
            <ImageUpload
              currentImage={superForm.image || undefined}
              onImageChange={(imageData) => setSuperForm({ ...superForm, image: imageData || "" })}
              aspectRatio={1}
              maxWidth={200}
              maxHeight={200}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveSuperCategory}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={resetSuperForm} variant="outline" className="rounded-[9px]">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub Category Dialog */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubCategory ? "Edit" : "Add"} Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div>
              <Label htmlFor="sub-icon">Icon (Emoji)</Label>
              <Input
                id="sub-icon"
                value={subForm.icon}
                onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })}
                className="rounded-[9px]"
                placeholder="🍚"
              />
            </div>
            <div>
              <Label htmlFor="sub-parent">Parent Super Category</Label>
              <Select
                value={subForm.superCategoryId}
                onValueChange={(value) => setSubForm({ ...subForm, superCategoryId: value })}
              >
                <SelectTrigger className="rounded-[9px]">
                  <SelectValue placeholder="Select super category" />
                </SelectTrigger>
                <SelectContent>
                  {superCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ImageUpload
              currentImage={subForm.image || undefined}
              onImageChange={(imageData) => setSubForm({ ...subForm, image: imageData || "" })}
              aspectRatio={1}
              maxWidth={200}
              maxHeight={200}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveSubCategory}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={resetSubForm} variant="outline" className="rounded-[9px]">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit" : "Add"} Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="rounded-[9px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="product-price">Price (₹)</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number.parseFloat(e.target.value) || 0 })}
                  className="rounded-[9px]"
                />
              </div>
              <div>
                <Label htmlFor="product-stock">Stock</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number.parseInt(e.target.value) || 0 })}
                  className="rounded-[9px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="product-unit">Unit</Label>
                <Input
                  id="product-unit"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  className="rounded-[9px]"
                  placeholder="kg, pack, bottle, etc."
                />
              </div>
              <div>
                <Label htmlFor="product-hamali">Hamali Value (₹)</Label>
                <Input
                  id="product-hamali"
                  type="number"
                  step="0.01"
                  value={productForm.hamaliValue}
                  onChange={(e) =>
                    setProductForm({ ...productForm, hamaliValue: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-[9px]"
                  placeholder="Per unit hamali charge"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="product-category">Sub Category</Label>
              <Select
                value={productForm.subCategoryId}
                onValueChange={(value) => setProductForm({ ...productForm, subCategoryId: value })}
              >
                <SelectTrigger className="rounded-[9px]">
                  <SelectValue placeholder="Select sub category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ImageUpload
              currentImage={productForm.image || undefined}
              onImageChange={(imageData) => setProductForm({ ...productForm, image: imageData || "" })}
              aspectRatio={4 / 3}
              maxWidth={300}
              maxHeight={225}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveProduct}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={resetProductForm} variant="outline" className="rounded-[9px]">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit" : "Add"} Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Name</Label>
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
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={resetCustomerForm} variant="outline" className="rounded-[9px]">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Download, Upload, Save, FileSpreadsheet, AlertCircle, CheckCircle, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { SalesDataManagement } from "@/components/sales-data-management"

interface BackupRecord {
  timestamp: number
  date: string
  superCategories: any[]
  subCategories: any[]
  products: any[]
  customers: any[]
  salesRecords: any[]
}

export default function DataManagement() {
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [backupProgress, setBackupProgress] = useState(0)
  const [showBackupPrompt, setShowBackupPrompt] = useState(false)
  const [showBackupSuccess, setShowBackupSuccess] = useState(false)
  const [showImportSuccess, setShowImportSuccess] = useState(false)
  const [showImportError, setShowImportError] = useState(false)
  const [importErrorMessage, setImportErrorMessage] = useState("")
  const [lastBackup, setLastBackup] = useState<BackupRecord | null>(null)
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showRestoreSuccess, setShowRestoreSuccess] = useState(false)
  const [exportSelections, setExportSelections] = useState({
    superCategories: true,
    subCategories: true,
    products: true,
    customers: true,
    salesRecords: true,
  })
  const [importFile, setImportFile] = useState<File | null>(null)

  // Check for daily backup on component mount
  useEffect(() => {
    loadBackupHistory()
    checkDailyBackup()
  }, [])

  const loadBackupHistory = () => {
    const storedBackups = localStorage.getItem("pos_backups")
    if (storedBackups) {
      const parsedBackups = JSON.parse(storedBackups) as BackupRecord[]
      setBackups(parsedBackups)

      // Set last backup
      if (parsedBackups.length > 0) {
        const lastBackupRecord = parsedBackups.sort((a, b) => b.timestamp - a.timestamp)[0]
        setLastBackup(lastBackupRecord)
      }
    }
  }

  const checkDailyBackup = () => {
    const today = new Date().toLocaleDateString()
    const lastBackupDate = lastBackup ? new Date(lastBackup.timestamp).toLocaleDateString() : null

    // If no backup today, show prompt
    if (lastBackupDate !== today) {
      setShowBackupPrompt(true)
    }
  }

  const handleExportData = async () => {
    setExportProgress(0)

    try {
      // Collect data based on selections
      const data: Record<string, any[]> = {}

      if (exportSelections.superCategories) {
        const superCategories = localStorage.getItem("superCategories")
        data.superCategories = superCategories ? JSON.parse(superCategories) : []
        setExportProgress(20)
      }

      if (exportSelections.subCategories) {
        const subCategories = localStorage.getItem("subCategories")
        data.subCategories = subCategories ? JSON.parse(subCategories) : []
        setExportProgress(40)
      }

      if (exportSelections.products) {
        const products = localStorage.getItem("products")
        data.products = products ? JSON.parse(products) : []
        setExportProgress(60)
      }

      if (exportSelections.customers) {
        const customers = localStorage.getItem("customers")
        data.customers = customers ? JSON.parse(customers) : []
        setExportProgress(80)
      }

      if (exportSelections.salesRecords) {
        const salesRecords = localStorage.getItem("salesRecords")
        data.salesRecords = salesRecords ? JSON.parse(salesRecords) : []
        setExportProgress(100)
      }

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new()

      // Add each data type as a separate sheet
      Object.entries(data).forEach(([key, value]) => {
        const ws = XLSX.utils.json_to_sheet(value)
        XLSX.utils.book_append_sheet(wb, ws, key)
      })

      // Generate Excel file
      const currentDate = format(new Date(), "yyyy-MM-dd")
      XLSX.writeFile(wb, `POS_Data_Export_${currentDate}.xlsx`)

      // Reset progress after a delay
      setTimeout(() => {
        setExportProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Export error:", error)
      setExportProgress(0)
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImportData = async () => {
    if (!importFile) return

    setImportProgress(10)
    setShowImportError(false)

    try {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          setImportProgress(20)
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })

          setImportProgress(40)

          // Process each sheet
          const importedData: Record<string, any[]> = {}

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            importedData[sheetName] = jsonData
          })

          setImportProgress(60)

          // Validate data structure
          validateAndSaveImportedData(importedData)

          setImportProgress(100)
          setShowImportSuccess(true)

          // Reset after success
          setTimeout(() => {
            setImportProgress(0)
            setImportFile(null)
            setShowImportSuccess(false)
            // Reset file input
            const fileInput = document.getElementById("import-file") as HTMLInputElement
            if (fileInput) fileInput.value = ""
          }, 3000)
        } catch (error) {
          console.error("Import processing error:", error)
          setImportErrorMessage("Failed to process the Excel file. Please check the file format.")
          setShowImportError(true)
          setImportProgress(0)
        }
      }

      reader.onerror = () => {
        setImportErrorMessage("Failed to read the file. Please try again.")
        setShowImportError(true)
        setImportProgress(0)
      }

      reader.readAsArrayBuffer(importFile)
    } catch (error) {
      console.error("Import error:", error)
      setImportErrorMessage("An unexpected error occurred during import.")
      setShowImportError(true)
      setImportProgress(0)
    }
  }

  const validateAndSaveImportedData = (data: Record<string, any[]>) => {
    // Check if at least one valid data type exists
    const validKeys = ["superCategories", "subCategories", "products", "customers", "salesRecords"]
    const hasValidData = validKeys.some((key) => Array.isArray(data[key]) && data[key].length > 0)

    if (!hasValidData) {
      throw new Error("No valid data found in the import file")
    }

    // Save each data type to localStorage
    Object.entries(data).forEach(([key, value]) => {
      if (validKeys.includes(key) && Array.isArray(value)) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    })
  }

  const createBackup = () => {
    setBackupProgress(10)

    try {
      // Collect all data
      const superCategories = localStorage.getItem("superCategories")
      const subCategories = localStorage.getItem("subCategories")
      const products = localStorage.getItem("products")
      const customers = localStorage.getItem("customers")
      const salesRecords = localStorage.getItem("salesRecords")

      setBackupProgress(50)

      const now = new Date()
      const backup: BackupRecord = {
        timestamp: now.getTime(),
        date: format(now, "yyyy-MM-dd HH:mm:ss"),
        superCategories: superCategories ? JSON.parse(superCategories) : [],
        subCategories: subCategories ? JSON.parse(subCategories) : [],
        products: products ? JSON.parse(products) : [],
        customers: customers ? JSON.parse(customers) : [],
        salesRecords: salesRecords ? JSON.parse(salesRecords) : [],
      }

      // Add to backup history
      const updatedBackups = [...backups, backup]

      // Keep only the last 10 backups
      if (updatedBackups.length > 10) {
        updatedBackups.sort((a, b) => b.timestamp - a.timestamp)
        updatedBackups.splice(10)
      }

      setBackups(updatedBackups)
      setLastBackup(backup)
      localStorage.setItem("pos_backups", JSON.stringify(updatedBackups))

      setBackupProgress(100)
      setShowBackupSuccess(true)

      // Reset after success
      setTimeout(() => {
        setBackupProgress(0)
        setShowBackupSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Backup error:", error)
      setBackupProgress(0)
    }

    setShowBackupPrompt(false)
  }

  const skipDailyBackup = () => {
    setShowBackupPrompt(false)
  }

  const openRestoreDialog = (backup: BackupRecord) => {
    setSelectedBackup(backup)
    setShowRestoreDialog(true)
  }

  const handleRestoreBackup = () => {
    if (!selectedBackup) return

    try {
      // Restore all data types
      localStorage.setItem("superCategories", JSON.stringify(selectedBackup.superCategories))
      localStorage.setItem("subCategories", JSON.stringify(selectedBackup.subCategories))
      localStorage.setItem("products", JSON.stringify(selectedBackup.products))
      localStorage.setItem("customers", JSON.stringify(selectedBackup.customers))
      localStorage.setItem("salesRecords", JSON.stringify(selectedBackup.salesRecords))

      setShowRestoreDialog(false)
      setShowRestoreSuccess(true)

      // Reset after success
      setTimeout(() => {
        setShowRestoreSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Restore error:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="backup">Backups</TabsTrigger>
          <TabsTrigger value="sales">Sales Management</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Data to Excel
              </CardTitle>
              <CardDescription>Select which data you want to export and download as an Excel file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-super"
                    checked={exportSelections.superCategories}
                    onCheckedChange={(checked) =>
                      setExportSelections({ ...exportSelections, superCategories: !!checked })
                    }
                  />
                  <Label htmlFor="export-super">Super Categories</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-sub"
                    checked={exportSelections.subCategories}
                    onCheckedChange={(checked) =>
                      setExportSelections({ ...exportSelections, subCategories: !!checked })
                    }
                  />
                  <Label htmlFor="export-sub">Sub Categories</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-products"
                    checked={exportSelections.products}
                    onCheckedChange={(checked) => setExportSelections({ ...exportSelections, products: !!checked })}
                  />
                  <Label htmlFor="export-products">Products</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-customers"
                    checked={exportSelections.customers}
                    onCheckedChange={(checked) => setExportSelections({ ...exportSelections, customers: !!checked })}
                  />
                  <Label htmlFor="export-customers">Customers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-sales"
                    checked={exportSelections.salesRecords}
                    onCheckedChange={(checked) => setExportSelections({ ...exportSelections, salesRecords: !!checked })}
                  />
                  <Label htmlFor="export-sales">Sales Records</Label>
                </div>
              </div>

              {exportProgress > 0 && <Progress value={exportProgress} className="h-2 w-full" />}

              <Button
                onClick={handleExportData}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={exportProgress > 0 || !Object.values(exportSelections).some((v) => v)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Data from Excel
              </CardTitle>
              <CardDescription>Upload an Excel file to import data into the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="import-file">Excel File</Label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleImportFile}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-[9px] file:border-0
                      file:text-sm file:font-semibold
                      file:bg-yellow-50 file:text-yellow-700
                      hover:file:bg-yellow-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The file should contain sheets named: superCategories, subCategories, products, customers, or
                    salesRecords
                  </p>
                </div>

                {importProgress > 0 && <Progress value={importProgress} className="h-2 w-full" />}

                {showImportSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Import Successful</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Data has been successfully imported into the system.
                    </AlertDescription>
                  </Alert>
                )}

                {showImportError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Import Failed</AlertTitle>
                    <AlertDescription>{importErrorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleImportData}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                  disabled={importProgress > 0 || !importFile}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Data Backup
              </CardTitle>
              <CardDescription>Create and manage backups of your POS data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-[9px]">
                <div>
                  <h3 className="font-medium">Last Backup</h3>
                  {lastBackup ? (
                    <div className="text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                        {format(new Date(lastBackup.timestamp), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                        {format(new Date(lastBackup.timestamp), "HH:mm:ss")}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">No backups yet</p>
                  )}
                </div>

                <div>
                  <Button
                    onClick={createBackup}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                    disabled={backupProgress > 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Backup Now
                  </Button>
                </div>
              </div>

              {backupProgress > 0 && <Progress value={backupProgress} className="h-2 w-full" />}

              {showBackupSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Backup Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your data has been successfully backed up.
                  </AlertDescription>
                </Alert>
              )}

              {showRestoreSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Restore Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your data has been successfully restored from the backup.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Backup History</h3>
                <div className="border rounded-[9px] overflow-hidden">
                  {backups.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {backups
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .map((backup, index) => (
                              <tr key={backup.timestamp} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {format(new Date(backup.timestamp), "MMM dd, yyyy")}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {format(new Date(backup.timestamp), "HH:mm:ss")}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <Button
                                    onClick={() => openRestoreDialog(backup)}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-[9px]"
                                  >
                                    Restore
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No backup history available</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesDataManagement />
        </TabsContent>
      </Tabs>

      {/* Daily Backup Prompt Dialog */}
      <Dialog open={showBackupPrompt} onOpenChange={setShowBackupPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Daily Backup Reminder</DialogTitle>
            <DialogDescription>
              It's recommended to create a backup of your data daily. Would you like to create a backup now?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={skipDailyBackup} className="rounded-[9px]">
              Skip Today
            </Button>
            <Button onClick={createBackup} className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]">
              Create Backup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Restore</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore data from the backup created on{" "}
              {selectedBackup && format(new Date(selectedBackup.timestamp), "MMM dd, yyyy HH:mm:ss")}? This will replace
              all current data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)} className="rounded-[9px]">
              Cancel
            </Button>
            <Button onClick={handleRestoreBackup} variant="destructive" className="rounded-[9px]">
              Restore Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

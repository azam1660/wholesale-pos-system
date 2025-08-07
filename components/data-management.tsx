"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Download,
  Upload,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  HardDrive,
  Trash2,
  FileText,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { DataManager } from "./data-manager"
import SalesDataManagement from "@/components/sales-data-management"

interface BackupRecord {
  timestamp: number
  date: string
  selectedTypes: string[]
  format: "json" | "csv"
  size: string
}

interface DataTypeInfo {
  key: string
  name: string
  description: string
  count: number
  size: string
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
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([])
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json")
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [selectedTypesToClear, setSelectedTypesToClear] = useState<string[]>([])

  useEffect(() => {
    loadDataTypes()
    loadBackupHistory()
    loadStorageInfo()
    checkDailyBackup()
  }, [])

  const loadDataTypes = () => {
    const types = DataManager.getAllDataTypes()
    setDataTypes(types)

    setSelectedDataTypes(types.map((t) => t.key))
  }

  const loadStorageInfo = () => {
    const info = DataManager.getStorageInfo()
    setStorageInfo(info)
  }

  const loadBackupHistory = () => {
    const storedBackups = localStorage.getItem("enhanced_pos_backups")
    if (storedBackups) {
      const parsedBackups = JSON.parse(storedBackups) as BackupRecord[]
      setBackups(parsedBackups)
      if (parsedBackups.length > 0) {
        const lastBackupRecord = parsedBackups.sort((a, b) => b.timestamp - a.timestamp)[0]
        setLastBackup(lastBackupRecord)
      }
    }
  }

  const checkDailyBackup = () => {
    const today = new Date().toLocaleDateString()
    const lastBackupDate = lastBackup ? new Date(lastBackup.timestamp).toLocaleDateString() : null
    if (lastBackupDate !== today) {
      setShowBackupPrompt(true)
    }
  }

  const handleExportData = async () => {
    if (selectedDataTypes.length === 0) return

    setExportProgress(10)

    try {
      const exportData = DataManager.exportSelectedData(selectedDataTypes, exportFormat)
      setExportProgress(50)

      const currentDate = format(new Date(), "yyyy-MM-dd_HH-mm-ss")
      const filename = `POS_Data_Export_${currentDate}.${exportFormat}`

      if (exportFormat === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const blob = new Blob([exportData as string], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }

      setExportProgress(100)
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
    if (!importFile || selectedDataTypes.length === 0) return

    setImportProgress(10)
    setShowImportError(false)

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          setImportProgress(30)
          const fileContent = e.target?.result as string

          setImportProgress(60)
          await DataManager.importSelectedData(fileContent, selectedDataTypes, importFormat)

          setImportProgress(100)
          setShowImportSuccess(true)
          loadDataTypes()
          loadStorageInfo()

          setTimeout(() => {
            setImportProgress(0)
            setImportFile(null)
            setShowImportSuccess(false)
            const fileInput = document.getElementById("import-file") as HTMLInputElement
            if (fileInput) fileInput.value = ""
          }, 3000)
        } catch (error) {
          console.error("Import processing error:", error)
          setImportErrorMessage(
            `Failed to process the ${importFormat.toUpperCase()} file. Please check the file format.`,
          )
          setShowImportError(true)
          setImportProgress(0)
        }
      }

      reader.onerror = () => {
        setImportErrorMessage("Failed to read the file. Please try again.")
        setShowImportError(true)
        setImportProgress(0)
      }

      reader.readAsText(importFile)
    } catch (error) {
      console.error("Import error:", error)
      setImportErrorMessage("An unexpected error occurred during import.")
      setShowImportError(true)
      setImportProgress(0)
    }
  }

  const createBackup = () => {
    if (selectedDataTypes.length === 0) return

    setBackupProgress(10)

    try {
      const exportData = DataManager.exportSelectedData(selectedDataTypes, exportFormat)
      setBackupProgress(50)

      const now = new Date()
      const dataStr = typeof exportData === "string" ? exportData : JSON.stringify(exportData)
      const sizeInBytes = new Blob([dataStr]).size

      const backup: BackupRecord = {
        timestamp: now.getTime(),
        date: format(now, "yyyy-MM-dd HH:mm:ss"),
        selectedTypes: [...selectedDataTypes],
        format: exportFormat,
        size: DataManager.formatBytes(sizeInBytes),
      }

      const backupKey = `backup_${backup.timestamp}`
      localStorage.setItem(backupKey, dataStr)

      const updatedBackups = [...backups, backup]
      if (updatedBackups.length > 20) {

        updatedBackups.sort((a, b) => b.timestamp - a.timestamp)
        const toRemove = updatedBackups.splice(20)
        toRemove.forEach((oldBackup) => {
          localStorage.removeItem(`backup_${oldBackup.timestamp}`)
        })
      }

      setBackups(updatedBackups)
      setLastBackup(backup)
      localStorage.setItem("enhanced_pos_backups", JSON.stringify(updatedBackups))

      setBackupProgress(100)
      setShowBackupSuccess(true)
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

  const openRestoreDialog = (backup: BackupRecord) => {
    setSelectedBackup(backup)
    setSelectedDataTypes(backup.selectedTypes)
    setShowRestoreDialog(true)
  }

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return

    try {
      const backupData = localStorage.getItem(`backup_${selectedBackup.timestamp}`)
      if (!backupData) {
        throw new Error("Backup data not found")
      }

      await DataManager.importSelectedData(backupData, selectedDataTypes, selectedBackup.format)

      setShowRestoreDialog(false)
      setShowRestoreSuccess(true)
      loadDataTypes()
      loadStorageInfo()

      setTimeout(() => {
        setShowRestoreSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Restore error:", error)
      setImportErrorMessage("Failed to restore backup data.")
      setShowImportError(true)
    }
  }

  const handleClearData = () => {
    if (selectedTypesToClear.length === 0) return

    try {
      DataManager.clearSelectedData(selectedTypesToClear)
      setShowClearDialog(false)
      setSelectedTypesToClear([])
      loadDataTypes()
      loadStorageInfo()
    } catch (error) {
      console.error("Clear data error:", error)
    }
  }

  const toggleDataType = (typeKey: string) => {
    setSelectedDataTypes((prev) => (prev.includes(typeKey) ? prev.filter((t) => t !== typeKey) : [...prev, typeKey]))
  }

  const toggleClearType = (typeKey: string) => {
    setSelectedTypesToClear((prev) => (prev.includes(typeKey) ? prev.filter((t) => t !== typeKey) : [...prev, typeKey]))
  }

  const selectAllDataTypes = () => {
    setSelectedDataTypes(dataTypes.map((t) => t.key))
  }

  const selectNoneDataTypes = () => {
    setSelectedDataTypes([])
  }

  return (
    <div className="space-y-6">
      {/* Storage Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageInfo && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Storage Used:</span>
                <span className="font-medium">
                  {storageInfo.usedFormatted} / {storageInfo.totalFormatted}
                </span>
              </div>
              <Progress value={storageInfo.percentage} className="h-2" />
              <div className="text-sm text-gray-600">
                Available: {storageInfo.availableFormatted} ({(100 - storageInfo.percentage).toFixed(1)}%)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="backup">Backups</TabsTrigger>
          <TabsTrigger value="manage">Manage Data</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Data
              </CardTitle>
              <CardDescription>Select data types and format to export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={selectAllDataTypes} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={selectNoneDataTypes} variant="outline" size="sm">
                  Select None
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataTypes.map((type) => (
                  <div key={type.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`export-${type.key}`}
                      checked={selectedDataTypes.includes(type.key)}
                      onCheckedChange={() => toggleDataType(type.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`export-${type.key}`} className="font-medium">
                        {type.name}
                      </Label>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{type.count} items</Badge>
                        <Badge variant="outline">{type.size}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Label>Export Format:</Label>
                <Select value={exportFormat} onValueChange={(value: "json" | "csv") => setExportFormat(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportProgress > 0 && <Progress value={exportProgress} className="h-2 w-full" />}

              <Button
                onClick={handleExportData}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={exportProgress > 0 || selectedDataTypes.length === 0}
              >
                {exportFormat === "json" ? (
                  <Database className="w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Export as {exportFormat.toUpperCase()}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Data
              </CardTitle>
              <CardDescription>Upload a file to import selected data types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={selectAllDataTypes} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={selectNoneDataTypes} variant="outline" size="sm">
                  Select None
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataTypes.map((type) => (
                  <div key={type.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`import-${type.key}`}
                      checked={selectedDataTypes.includes(type.key)}
                      onCheckedChange={() => toggleDataType(type.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`import-${type.key}`} className="font-medium">
                        {type.name}
                      </Label>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{type.count} items</Badge>
                        <Badge variant="outline">{type.size}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Label>Import Format:</Label>
                <Select value={importFormat} onValueChange={(value: "json" | "csv") => setImportFormat(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="import-file">Select File</Label>
                <input
                  id="import-file"
                  type="file"
                  accept={importFormat === "json" ? ".json" : ".csv"}
                  onChange={handleImportFile}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-[9px] file:border-0
                    file:text-sm file:font-semibold
                    file:bg-yellow-50 file:text-yellow-700
                    hover:file:bg-yellow-100"
                />
              </div>

              {importProgress > 0 && <Progress value={importProgress} className="h-2 w-full" />}

              {showImportSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Import Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Selected data has been successfully imported.
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
                disabled={importProgress > 0 || !importFile || selectedDataTypes.length === 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Data Backup & Restore
              </CardTitle>
              <CardDescription>Create and manage backups of selected data</CardDescription>
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
                      <Badge variant="outline">{lastBackup.size}</Badge>
                      <Badge variant="secondary">{lastBackup.format.toUpperCase()}</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">No backups yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button onClick={selectAllDataTypes} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={selectNoneDataTypes} variant="outline" size="sm">
                  Select None
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataTypes.map((type) => (
                  <div key={type.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`backup-${type.key}`}
                      checked={selectedDataTypes.includes(type.key)}
                      onCheckedChange={() => toggleDataType(type.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`backup-${type.key}`} className="font-medium">
                        {type.name}
                      </Label>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{type.count} items</Badge>
                        <Badge variant="outline">{type.size}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Label>Backup Format:</Label>
                <Select value={exportFormat} onValueChange={(value: "json" | "csv") => setExportFormat(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {backupProgress > 0 && <Progress value={backupProgress} className="h-2 w-full" />}

              {showBackupSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Backup Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Selected data has been successfully backed up.
                  </AlertDescription>
                </Alert>
              )}

              {showRestoreSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Restore Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Data has been successfully restored from backup.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={createBackup}
                className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-[9px]"
                disabled={backupProgress > 0 || selectedDataTypes.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Create Backup
              </Button>

              <div className="space-y-2">
                <h3 className="font-medium">Backup History</h3>
                <div className="border rounded-[9px] overflow-hidden">
                  {backups.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Details
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
                                <td className="px-4 py-2 text-sm">
                                  <div>{format(new Date(backup.timestamp), "MMM dd, yyyy")}</div>
                                  <div className="text-gray-500">{format(new Date(backup.timestamp), "HH:mm:ss")}</div>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <div className="flex gap-1 mb-1">
                                    <Badge variant="outline">{backup.size}</Badge>
                                    <Badge variant="secondary">{backup.format.toUpperCase()}</Badge>
                                  </div>
                                  <div className="text-xs text-gray-500">{backup.selectedTypes.length} data types</div>
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

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Manage Data
              </CardTitle>
              <CardDescription>View and manage individual data types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataTypes.map((type) => (
                  <Card key={type.key} className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{type.count} items</Badge>
                        <Badge variant="outline">{type.size}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <Checkbox
                          id={`clear-${type.key}`}
                          checked={selectedTypesToClear.includes(type.key)}
                          onCheckedChange={() => toggleClearType(type.key)}
                        />
                        <Label htmlFor={`clear-${type.key}`} className="text-sm">
                          Select for clearing
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => setShowClearDialog(true)}
                  variant="destructive"
                  disabled={selectedTypesToClear.length === 0}
                  className="rounded-[9px]"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selected Data ({selectedTypesToClear.length})
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <Button variant="outline" onClick={() => setShowBackupPrompt(false)} className="rounded-[9px]">
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
              the selected data types.
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Data types to restore:</p>
              <div className="flex flex-wrap gap-1">
                {selectedDataTypes.map((typeKey) => {
                  const type = dataTypes.find((t) => t.key === typeKey)
                  return type ? (
                    <Badge key={typeKey} variant="secondary" className="text-xs">
                      {type.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}

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

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Data Clearing</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the selected data types? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium">Data types to clear:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTypesToClear.map((typeKey) => {
                const type = dataTypes.find((t) => t.key === typeKey)
                return type ? (
                  <Badge key={typeKey} variant="destructive" className="text-xs">
                    {type.name}
                  </Badge>
                ) : null
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowClearDialog(false)} className="rounded-[9px]">
              Cancel
            </Button>
            <Button onClick={handleClearData} variant="destructive" className="rounded-[9px]">
              Clear Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; counts?: any } | null>(null)
  const [data, setData] = useState<any>({})
  const [hasData, setHasData] = useState(false)
  const [isMigrated, setIsMigrated] = useState(false)

  const collectLocalStorageData = () => {
    if (typeof window === "undefined") return {}
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
          // If it's not JSON, try to parse as number for counters
          if (key.includes("Counter")) {
            data[key] = parseInt(stored) || 0
          } else {
            data[key] = stored
          }
        }
      }
    }

    return data
  }

  useEffect(() => {
    const localData = collectLocalStorageData()
    setData(localData)
    setHasData(Object.keys(localData).length > 0)
    setIsMigrated(localStorage.getItem("mongodb_migrated") === "true")
  }, [])

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Collect data from localStorage
      const data = collectLocalStorageData()

      // Check if there's any data to migrate
      const hasData = Object.keys(data).length > 0
      if (!hasData) {
        setResult({
          success: false,
          message: "No data found in localStorage to migrate.",
        })
        setLoading(false)
        return
      }

      // Send to seed endpoint
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: "Data successfully migrated to MongoDB!",
          counts: result.counts,
        })

        // Mark migration as complete
        localStorage.setItem("mongodb_migrated", "true")
        setIsMigrated(true)

        // Optionally clear localStorage data after successful migration
        // Uncomment the following lines if you want to clear localStorage after migration:
        /*
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
        keys.forEach(key => localStorage.removeItem(key))
        */
      } else {
        setResult({
          success: false,
          message: result.error || "Failed to migrate data.",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred during migration.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Removed direct SSR localStorage access lines

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Seed MongoDB from localStorage</CardTitle>
          <CardDescription>
            Migrate all data from localStorage to MongoDB database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMigrated && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Migration Complete</AlertTitle>
              <AlertDescription>
                Data has been migrated to MongoDB. The application is now using MongoDB for all data storage.
              </AlertDescription>
            </Alert>
          )}

          {!hasData && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data Found</AlertTitle>
              <AlertDescription>
                No data found in localStorage to migrate. If you've already migrated, you can start using the application.
              </AlertDescription>
            </Alert>
          )}

          {hasData && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Found data in localStorage:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {Object.entries(data).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong>{" "}
                    {Array.isArray(value)
                      ? `${value.length} items`
                      : typeof value === "number"
                      ? value
                      : typeof value === "object"
                      ? `${Object.keys(value).length} properties`
                      : "present"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.counts && (
                  <div className="mt-2 text-sm">
                    <p className="font-semibold">Database counts:</p>
                    <ul className="list-disc list-inside mt-1">
                      {Object.entries(result.counts).map(([key, value]) => (
                        <li key={key}>
                          {key}: {value as number}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSeed}
            disabled={loading || !hasData}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              "Migrate to MongoDB"
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            This will migrate all data from localStorage to MongoDB. The data will be preserved in MongoDB
            and you can continue using the application normally.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

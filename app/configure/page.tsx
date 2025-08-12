"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CapacityConfiguration } from "@/components/capacity-configuration"
import { getDistinctLocationTypes } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function ConfigurePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [locationTypes, setLocationTypes] = useState<string[]>([])
  const [capacitySettings, setCapacitySettings] = useState<Record<string, any>>({})
  const [warehouseData, setWarehouseData] = useState<any[]>([])
  const [typeColumnKey, setTypeColumnKey] = useState<string>("type")
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (isInitialized) return

    const extractLocationTypes = () => {
      // Try to get data from localStorage first
      let warehouseData: any = null
      let columnMappings: any = null
      let additionalData: any = null

      try {
        const warehouseDataStr = localStorage.getItem('warehouseData')
        const columnMappingsStr = localStorage.getItem('columnMappings')
        const additionalDataStr = localStorage.getItem('additionalData')

        if (warehouseDataStr && columnMappingsStr && additionalDataStr) {
          warehouseData = JSON.parse(warehouseDataStr)
          columnMappings = JSON.parse(columnMappingsStr)
          additionalData = JSON.parse(additionalDataStr)
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error)
      }

      // Fallback to URL parameters if localStorage data is not available
      if (!warehouseData || !columnMappings) {
        const warehouseDataParam = searchParams.get("warehouseData")
        const columnMappingsParam = searchParams.get("columnMappings")
        const additionalDataParam = searchParams.get("additionalData")

        if (additionalDataParam) {
          try {
            additionalData = JSON.parse(decodeURIComponent(additionalDataParam))
          } catch (error) {
            console.error("Error parsing additional data:", error)
          }
        }

        if (warehouseDataParam && columnMappingsParam) {
          try {
            warehouseData = JSON.parse(decodeURIComponent(warehouseDataParam))
            columnMappings = JSON.parse(decodeURIComponent(columnMappingsParam))
          } catch (error) {
            console.error("Error parsing data:", error)
          }
        }
      }

      // Process the data
      if (additionalData?.detectedLocationTypes && additionalData.detectedLocationTypes.length > 0) {
        setLocationTypes(additionalData.detectedLocationTypes)
        setIsInitialized(true)
        return
      }

      if (warehouseData && columnMappings) {
        const warehouseMapping = columnMappings.warehouseLocations
        if (warehouseMapping && warehouseData.warehouseLocations) {
          const typeColumnName = warehouseMapping.type
          const { headers, rows } = warehouseData.warehouseLocations

          if (typeColumnName && Array.isArray(headers) && Array.isArray(rows)) {
            // Convert rows to objects with header keys
            const dataObjects = rows.map((row: any[]) => {
              const obj: Record<string, any> = {}
              headers.forEach((header: string, index: number) => {
                obj[header] = row[index]
              })
              return obj
            })

            // Use the single source of truth function
            const detectedTypes = getDistinctLocationTypes(dataObjects, typeColumnName)
            setLocationTypes(detectedTypes)
            setWarehouseData(dataObjects)
            setTypeColumnKey(typeColumnName)
          }
        }
      }
      setIsInitialized(true)
    }

    extractLocationTypes()
  }, [searchParams, isInitialized])

  const handleCapacityChange = (locationType: string, settings: any) => {
    setCapacitySettings((prev) => ({
      ...prev,
      [locationType]: settings,
    }))
  }

  const handleRescanTypes = () => {
    if (warehouseData.length > 0 && typeColumnKey) {
      const detectedTypes = getDistinctLocationTypes(warehouseData, typeColumnKey)
      setLocationTypes(detectedTypes)
    }
  }

  const handleAddTypeManually = (typeName: string) => {
    if (typeName.trim() && !locationTypes.includes(typeName.trim())) {
      setLocationTypes((prev) => [...prev, typeName.trim()].sort())
    }
  }

  const isValidConfiguration = (locationType: string) => {
    const settings = capacitySettings[locationType]
    return settings && (settings.cubicInches > 0 || settings.units > 0)
  }

  const validConfiguredCount = locationTypes.filter((type) => isValidConfiguration(type)).length
  const allConfigured = locationTypes.length > 0 && validConfiguredCount === locationTypes.length

  const handleProceed = () => {
    console.log("Capacity settings:", capacitySettings)
    router.push("/analyze")
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-seafoam-light via-card-surface to-seafoam-mid">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="album-heading text-5xl mb-6">Configure Location Capacity</h1>
            <p className="text-xl text-deep-teal leading-relaxed font-semibold">
              Define storage capacity for each location type found in your warehouse data
            </p>
          </div>

          <Card className="album-card p-8 rounded-2xl">
            <CapacityConfiguration
              locationTypes={locationTypes}
              onCapacityChange={handleCapacityChange}
              capacitySettings={capacitySettings}
              onRescanTypes={handleRescanTypes}
              onAddTypeManually={handleAddTypeManually}
              warehouseData={warehouseData}
              typeColumnKey={typeColumnKey}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-border-soft">
              <Button variant="outline" onClick={handleBack} className="album-tab rounded-full bg-transparent">
                <ArrowLeft className="mr-2 w-5 h-5" />
                Back to Upload
              </Button>

              <Button onClick={handleProceed} disabled={!allConfigured} size="lg" className="album-button rounded-full">
                Analyze Space Usage
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {locationTypes.length > 0 && (
              <div className="text-center mt-4">
                <p className="text-deep-teal font-semibold">
                  {validConfiguredCount} of {locationTypes.length} types configured
                </p>
                {!allConfigured && (
                  <p className="text-copper-mid text-sm mt-1">Configure all location types to proceed to analysis</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

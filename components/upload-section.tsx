"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { CheckCircle, Upload, ArrowRight } from "lucide-react"
import { ColumnMapping } from "@/components/column-mapping"
import { getLocationTypes } from "@/lib/types"

interface UploadedFile {
  name: string
  size: number
  data: any[]
  headers: string[]
}

interface MappedFile extends UploadedFile {
  mapping?: Record<string, string>
}

interface UploadState {
  warehouseLocations: MappedFile | null
  productLocations: MappedFile | null
  productInfo: MappedFile | null
}

interface MappingSelections {
  locations?: {
    nameKey?: string
    typeKey?: string // NEW: use typeKey instead of type
    pickableKey?: string
    sellableKey?: string
    typeCol?: number // NEW: store column index for type detection
  }
  productLocations?: Record<string, string>
  productInfo?: Record<string, string>
}

export function UploadSection() {
  const router = useRouter()
  const [uploads, setUploads] = useState<UploadState>({
    warehouseLocations: null,
    productLocations: null,
    productInfo: null,
  })

  const [mappingConfirmed, setMappingConfirmed] = useState<Record<string, boolean>>({})
  const [mappingSelections, setMappingSelections] = useState<MappingSelections>({})
  const [locationTypes, setLocationTypes] = useState<string[]>([])
  const [locationTypeCounts, setLocationTypeCounts] = useState<Record<string, number>>({})
  const [typeDetectionError, setTypeDetectionError] = useState<string>("")
  const [showDataAudit, setShowDataAudit] = useState(false)

  const allFilesUploaded = Object.values(uploads).every((file) => file !== null)
  const allFilesMapped = Object.values(uploads).every((file) => file?.mapping !== undefined)
  const allMappingsConfirmed = Object.keys(uploads).every((key) =>
    uploads[key as keyof UploadState] ? mappingConfirmed[key] : true,
  )

  const requiredFields = {
    warehouseLocations: [
      { key: "location_name", label: "Location Name", description: "Unique identifier for each location" },
      { key: "type", label: "Type", description: "Location type (e.g., shelf, bin, pallet)" },
      { key: "pickable", label: "Pickable", description: "Whether items can be picked from this location" },
      { key: "sellable", label: "Sellable", description: "Whether items in this location are sellable" },
    ],
    productLocations: [
      { key: "location", label: "Location", description: "Where the product is currently stored" },
      { key: "sku", label: "SKU", description: "Product identifier" },
      { key: "quantity", label: "Quantity", description: "Number of units at this location" },
    ],
    productInfo: [
      { key: "sku", label: "SKU", description: "Product identifier (required)" },
      { key: "length", label: "Length", description: "Product length in inches (optional)" },
      { key: "width", label: "Width", description: "Product width in inches (optional)" },
      { key: "height", label: "Height", description: "Product height in inches (optional)" },
      { key: "weight", label: "Weight", description: "Product weight (optional)" },
    ],
  }

  const handleFileUpload = (type: keyof UploadState, file: UploadedFile) => {
    setUploads((prev) => ({ ...prev, [type]: file }))
  }

  const handleMappingComplete = (type: keyof UploadState, mapping: Record<string, string>) => {
    if (type === "warehouseLocations") {
      const headers = uploads.warehouseLocations?.headers || []
      const typeColIndex = headers.indexOf(mapping.type)

      setMappingSelections((prev) => ({
        ...prev,
        locations: {
          nameKey: mapping.location_name,
          typeKey: mapping.type, // Header string for display
          typeCol: typeColIndex, // Column index for reliable extraction
          pickableKey: mapping.pickable,
          sellableKey: mapping.sellable,
        },
      }))

      if (typeColIndex >= 0 && uploads.warehouseLocations) {
        const locationsFile = {
          headers: uploads.warehouseLocations.headers,
          rows: uploads.warehouseLocations.data,
        }
        const { types, counts } = getLocationTypes(locationsFile, typeColIndex)
        setLocationTypes(types)
        setLocationTypeCounts(counts)
      }
    } else {
      setMappingSelections((prev) => ({ ...prev, [type]: mapping }))
    }

    setUploads((prev) => ({
      ...prev,
      [type]: { ...prev[type]!, mapping },
    }))
  }

  const handleMappingConfirm = (type: keyof UploadState) => {
    setMappingConfirmed((prev) => ({ ...prev, [type]: true }))
  }

  const handleMappingClear = (type: keyof UploadState) => {
    setMappingConfirmed((prev) => ({ ...prev, [type]: false }))
    setUploads((prev) => ({
      ...prev,
      [type]: { ...prev[type]!, mapping: undefined },
    }))
    setMappingSelections((prev) => ({ ...prev, [type]: undefined }))
  }

  const handleProceed = () => {
    const dataToPass = {
      warehouseLocations: {
        headers: uploads.warehouseLocations?.headers || [],
        rows: uploads.warehouseLocations?.data || [],
      },
      productLocations: {
        headers: uploads.productLocations?.headers || [],
        rows: uploads.productLocations?.data || [],
      },
      productInfo: {
        headers: uploads.productInfo?.headers || [],
        rows: uploads.productInfo?.data || [],
      },
    }

    const mappingsToPass = {
      warehouseLocations: uploads.warehouseLocations?.mapping,
      productLocations: uploads.productLocations?.mapping,
      productInfo: uploads.productInfo?.mapping,
    }

    const additionalData = {
      detectedLocationTypes: locationTypes,
      locationTypeCounts: locationTypeCounts,
      mappedRowCounts: {
        warehouseLocations: uploads.warehouseLocations?.data?.length || 0,
        productLocations: uploads.productLocations?.data?.length || 0,
        productInfo: uploads.productInfo?.data?.length || 0,
      },
    }

    // Store data in localStorage instead of URL parameters to avoid browser blocking
    try {
      localStorage.setItem('warehouseData', JSON.stringify(dataToPass))
      localStorage.setItem('columnMappings', JSON.stringify(mappingsToPass))
      localStorage.setItem('additionalData', JSON.stringify(additionalData))
      
      // Navigate to configure page without data in URL
      router.push('/configure')
    } catch (error) {
      console.error('Error storing data:', error)
      // Fallback to URL parameters if localStorage fails (for smaller datasets)
      const queryParams = new URLSearchParams({
        warehouseData: encodeURIComponent(JSON.stringify(dataToPass)),
        columnMappings: encodeURIComponent(JSON.stringify(mappingsToPass)),
        additionalData: encodeURIComponent(JSON.stringify(additionalData)),
      })
      router.push(`/configure?${queryParams.toString()}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="album-heading text-2xl">Upload Your Warehouse Data</h2>
        <p className="text-muted-ink text-sm">Upload three CSV files to analyze your warehouse space utilization</p>
      </div>

      {(locationTypes.length > 0 || typeDetectionError) && (
        <Card className="album-card p-4 bg-seafoam-light/10 border-seafoam-mid/30">
          <div className="space-y-2">
            {typeDetectionError ? (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                <strong>Error:</strong> {typeDetectionError}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-deep-teal">
                  <strong>Detected types:</strong> {locationTypes.join(", ")} ({locationTypes.length} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDataAudit(!showDataAudit)}
                    className="text-xs text-muted-ink hover:text-deep-teal underline"
                  >
                    Data Audit
                  </button>
                </div>
              </div>
            )}

            {showDataAudit && mappingSelections.locations?.typeKey && uploads.warehouseLocations && (
              <div className="text-xs text-muted-ink bg-white/50 p-3 rounded border space-y-1">
                <div>
                  <strong>Type key:</strong> {mappingSelections.locations.typeKey}
                </div>
                <div>
                  <strong>Headers:</strong> {uploads.warehouseLocations.headers?.slice(0, 8).join(", ")}
                  {uploads.warehouseLocations.headers && uploads.warehouseLocations.headers.length > 8 && "..."}
                </div>
                <div>
                  <strong>First 5 raw values:</strong> [
                  {uploads.warehouseLocations.data
                    ?.slice(0, 5)
                    .map((row) => JSON.stringify(row[mappingSelections.locations!.typeKey!]))
                    .join(", ")}
                  ]
                </div>
                <div>
                  <strong>Detected types:</strong> {locationTypes.join(", ")} ({locationTypes.length} total)
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {/* Warehouse Locations Upload */}
        <Card
          className={`album-card p-4 transition-all duration-300 ${
            uploads.warehouseLocations?.mapping && mappingConfirmed.warehouseLocations
              ? "border-seafoam-dark/60 bg-seafoam-light/10"
              : uploads.warehouseLocations?.mapping
                ? "border-copper-mid/60 bg-copper-light/10"
                : "hover:shadow-lg"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {uploads.warehouseLocations?.mapping && mappingConfirmed.warehouseLocations ? (
                <CheckCircle className="w-5 h-5 text-seafoam-dark" />
              ) : uploads.warehouseLocations?.mapping ? (
                <div className="w-5 h-5 rounded-full border-2 border-copper-mid flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-copper-mid"></div>
                </div>
              ) : uploads.warehouseLocations ? (
                <div className="w-5 h-5 rounded-full border-2 border-muted-ink flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-ink"></div>
                </div>
              ) : (
                <Upload className="w-5 h-5 text-muted-ink" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-deep-teal mb-1">Warehouse Locations</h3>
              <p className="text-muted-ink text-sm mb-3">CSV with location details</p>
              <FileUpload
                onFileUpload={(file) => handleFileUpload("warehouseLocations", file)}
                uploadedFile={uploads.warehouseLocations}
                expectedColumns={[]}
              />

              {uploads.warehouseLocations && !mappingConfirmed.warehouseLocations && (
                <div className="mt-3 pt-3 border-t border-border-soft">
                  <ColumnMapping
                    fileType="Warehouse Locations"
                    headers={uploads.warehouseLocations?.headers || []}
                    requiredFields={requiredFields.warehouseLocations}
                    onMappingComplete={(mapping) => handleMappingComplete("warehouseLocations", mapping)}
                    onMappingConfirm={() => handleMappingConfirm("warehouseLocations")}
                    onClearMapping={() => handleMappingClear("warehouseLocations")}
                    isConfirmed={mappingConfirmed.warehouseLocations}
                    rowCount={uploads.warehouseLocations?.data?.length || 0}
                  />
                </div>
              )}

              {mappingConfirmed.warehouseLocations && uploads.warehouseLocations && false && (
                <div className="mt-4 p-4 bg-seafoam/10 rounded-lg border border-seafoam/20">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-deep-teal mb-2">
                      📊 Location Type Diagnostics
                    </summary>
                    <div className="space-y-2 text-deep-teal/80">
                      <div>
                        <strong>Type header:</strong> {mappingSelections.locations?.typeKey || "None"}
                      </div>
                      <div>
                        <strong>First 8 headers:</strong> {uploads.warehouseLocations?.headers.slice(0, 8).join(", ")}
                      </div>
                      <div>
                        <strong>First 5 raw values:</strong>{" "}
                        {uploads.warehouseLocations?.data
                          .slice(0, 5)
                          .map((row) => row[mappingSelections.locations?.typeKey || ""] || "")
                          .join(", ")}
                      </div>
                      <div>
                        <strong>Detected types:</strong> {locationTypes.join(", ")} ({locationTypes.length} total)
                      </div>
                      <button
                        onClick={() => {
                          if (uploads.warehouseLocations && mappingSelections.locations?.typeCol !== undefined) {
                            const locationsFile = {
                              headers: uploads.warehouseLocations.headers,
                              rows: uploads.warehouseLocations.data,
                            }
                            const { types, counts } = getLocationTypes(locationsFile, mappingSelections.locations.typeCol)
                            setLocationTypes(types)
                            setLocationTypeCounts(counts)
                            console.log(`🔄 Rescanned ${types.length} location types:`, types)
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-copper text-white rounded text-xs hover:bg-copper/80"
                      >
                        🔄 Rescan Types
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Product Locations Upload */}
        <Card
          className={`album-card p-4 transition-all duration-300 ${
            uploads.productLocations?.mapping && mappingConfirmed.productLocations
              ? "border-seafoam-dark/60 bg-seafoam-light/10"
              : uploads.productLocations?.mapping
                ? "border-copper-mid/60 bg-copper-light/10"
                : "hover:shadow-lg"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {uploads.productLocations?.mapping && mappingConfirmed.productLocations ? (
                <CheckCircle className="w-5 h-5 text-seafoam-dark" />
              ) : uploads.productLocations?.mapping ? (
                <div className="w-5 h-5 rounded-full border-2 border-copper-mid flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-copper-mid"></div>
                </div>
              ) : uploads.productLocations ? (
                <div className="w-5 h-5 rounded-full border-2 border-muted-ink flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-ink"></div>
                </div>
              ) : (
                <Upload className="w-5 h-5 text-muted-ink" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-deep-teal mb-1">Product Locations</h3>
              <p className="text-muted-ink text-sm mb-3">CSV showing current inventory placement</p>
              <FileUpload
                onFileUpload={(file) => handleFileUpload("productLocations", file)}
                uploadedFile={uploads.productLocations}
                expectedColumns={[]}
              />

              {uploads.productLocations && !mappingConfirmed.productLocations && (
                <div className="mt-3 pt-3 border-t border-border-soft">
                  <ColumnMapping
                    fileType="Product Locations"
                    headers={uploads.productLocations?.headers || []}
                    requiredFields={requiredFields.productLocations}
                    onMappingComplete={(mapping) => handleMappingComplete("productLocations", mapping)}
                    onMappingConfirm={() => handleMappingConfirm("productLocations")}
                    onClearMapping={() => handleMappingClear("productLocations")}
                    isConfirmed={mappingConfirmed.productLocations}
                    rowCount={uploads.productLocations?.data?.length || 0}
                  />
                </div>
              )}

              {mappingConfirmed.productLocations && uploads.productLocations && (
                <div className="mt-3 pt-3 border-t border-seafoam-mid/30">
                  <div className="flex items-center gap-2 text-sm text-deep-teal">
                    <CheckCircle className="w-4 h-4" />
                    <span>✔ Mapped 3/3 fields • {uploads.productLocations.data?.length || 0} products</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Product Information Upload */}
        <Card
          className={`album-card p-4 transition-all duration-300 ${
            uploads.productInfo?.mapping && mappingConfirmed.productInfo
              ? "border-seafoam-dark/60 bg-seafoam-light/10"
              : uploads.productInfo?.mapping
                ? "border-copper-mid/60 bg-copper-light/10"
                : "hover:shadow-lg"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {uploads.productInfo?.mapping && mappingConfirmed.productInfo ? (
                <CheckCircle className="w-5 h-5 text-seafoam-dark" />
              ) : uploads.productInfo?.mapping ? (
                <div className="w-5 h-5 rounded-full border-2 border-copper-mid flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-copper-mid"></div>
                </div>
              ) : uploads.productInfo ? (
                <div className="w-5 h-5 rounded-full border-2 border-muted-ink flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-ink"></div>
                </div>
              ) : (
                <Upload className="w-5 h-5 text-muted-ink" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-deep-teal mb-1">Product Information</h3>
              <p className="text-muted-ink text-sm mb-3">CSV with product dimensions</p>
              <FileUpload
                onFileUpload={(file) => handleFileUpload("productInfo", file)}
                uploadedFile={uploads.productInfo}
                expectedColumns={[]}
              />

              {uploads.productInfo && !mappingConfirmed.productInfo && (
                <div className="mt-3 pt-3 border-t border-border-soft">
                  <ColumnMapping
                    fileType="Product Info"
                    headers={uploads.productInfo?.headers || []}
                    requiredFields={requiredFields.productInfo}
                    onMappingComplete={(mapping) => handleMappingComplete("productInfo", mapping)}
                    onMappingConfirm={() => handleMappingConfirm("productInfo")}
                    onClearMapping={() => handleMappingClear("productInfo")}
                    isConfirmed={mappingConfirmed.productInfo}
                    rowCount={uploads.productInfo?.data?.length || 0}
                  />
                </div>
              )}

              {mappingConfirmed.productInfo && uploads.productInfo && (
                <div className="mt-3 pt-3 border-t border-seafoam-mid/30">
                  <div className="flex items-center gap-2 text-sm text-deep-teal">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      ✔ Mapped {Object.keys(uploads.productInfo.mapping || {}).length}/5 fields •{" "}
                      {uploads.productInfo.data?.length || 0} products
                      {uploads.productInfo.mapping &&
                        !uploads.productInfo.mapping.length &&
                        !uploads.productInfo.mapping.width &&
                        !uploads.productInfo.mapping.height && (
                          <span className="text-muted-ink ml-2">(will use units fallback)</span>
                        )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col items-center pt-4 space-y-3">
        {allFilesUploaded && !allMappingsConfirmed && (
          <p className="text-muted-ink text-sm">Review and confirm column mapping to proceed</p>
        )}
        <Button
          onClick={handleProceed}
          disabled={!allMappingsConfirmed || typeDetectionError !== ""}
          size="lg"
          className="album-button px-6 py-3 text-base font-semibold"
        >
          Configure Capacity Settings
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

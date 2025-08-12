"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DetectedTypesLine } from "@/components/ui/detected-types-line"
import { AnalysisDashboard } from "@/components/analysis-dashboard"
import { ArrowRight, Download } from "lucide-react"
import { analyzeWarehouseSpace } from "@/lib/space-saver-handler"
import type { AnalysisResponse } from "@/lib/space-saver-handler"

export default function AnalyzePage() {
  const router = useRouter()
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"analysis" | "recommendations">("analysis")
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get real data from localStorage and run Space Saver analysis
    const runRealAnalysis = async () => {
      try {
        // Read data from localStorage
        const warehouseDataStr = localStorage.getItem('warehouseData')
        const columnMappingsStr = localStorage.getItem('columnMappings')
        const additionalDataStr = localStorage.getItem('additionalData')

        if (!warehouseDataStr || !columnMappingsStr) {
          setError("No data found. Please upload CSV files first.")
          setIsLoading(false)
          return
        }

        const warehouseData = JSON.parse(warehouseDataStr)
        const columnMappings = JSON.parse(columnMappingsStr)
        const additionalData = additionalDataStr ? JSON.parse(additionalDataStr) : {}

        // Convert the data format to match what the Space Saver engine expects
        const locationsFile = {
          headers: warehouseData.warehouseLocations.headers,
          rows: warehouseData.warehouseLocations.rows
        }

        const productLocationsFile = {
          headers: warehouseData.productLocations.headers,
          rows: warehouseData.productLocations.rows
        }

        const productInfoFile = {
          headers: warehouseData.productInfo.headers,
          rows: warehouseData.productInfo.rows
        }

        // Convert column mappings to the format expected by Space Saver
        const mappingSelections = {
          locations: {
            nameCol: locationsFile.headers.indexOf(columnMappings.warehouseLocations?.location_name || ''),
            typeCol: locationsFile.headers.indexOf(columnMappings.warehouseLocations?.type || ''),
            pickableCol: locationsFile.headers.indexOf(columnMappings.warehouseLocations?.pickable || ''),
            sellableCol: locationsFile.headers.indexOf(columnMappings.warehouseLocations?.sellable || ''),
          },
          productLocations: {
            skuCol: productLocationsFile.headers.indexOf(columnMappings.productLocations?.sku || ''),
            locationCol: productLocationsFile.headers.indexOf(columnMappings.productLocations?.location || ''),
            qtyCol: productLocationsFile.headers.indexOf(columnMappings.productLocations?.quantity || ''),
          },
          productInfo: {
            skuCol: productInfoFile.headers.indexOf(columnMappings.productInfo?.sku || ''),
            lengthCol: columnMappings.productInfo?.length ? productInfoFile.headers.indexOf(columnMappings.productInfo.length) : undefined,
            widthCol: columnMappings.productInfo?.width ? productInfoFile.headers.indexOf(columnMappings.productInfo.width) : undefined,
            heightCol: columnMappings.productInfo?.height ? productInfoFile.headers.indexOf(columnMappings.productInfo.height) : undefined,
          }
        }

        // For now, use default capacity settings - you can enhance this later
        const capacityByType: Record<string, { cuIn?: number; units?: number }> = {}
        if (additionalData.detectedLocationTypes) {
          additionalData.detectedLocationTypes.forEach((type: string) => {
            capacityByType[type] = { cuIn: 1000, units: 100 } // Default values
          })
        }

        // Run the Space Saver analysis
        const results = analyzeWarehouseSpace(
          locationsFile,
          productLocationsFile,
          productInfoFile,
          mappingSelections,
          capacityByType,
          {
            headroomPct: 0.90,
            preferPickAisles: ['A01', 'A02', 'A03'],
            preferPickShelves: ['B', 'C', 'D']
          }
        )

        // Enhance the results with actual quantities from product locations
        const enhancedResults = {
          ...results,
          result: {
            ...results.result,
            recommendations: results.result.recommendations.map(move => {
              // Find the actual quantity from product locations data
              const productLocation = warehouseData.productLocations.rows.find((row: any) => 
                row[productLocationsFile.headers.indexOf(columnMappings.productLocations?.sku || '')] === move.sku &&
                row[productLocationsFile.headers.indexOf(columnMappings.productLocations?.location || '')] === move.from
              )
              
              const actualQty = productLocation ? 
                Number(productLocation[productLocationsFile.headers.indexOf(columnMappings.productLocations?.quantity || '')]) || 0 : 0
              
              return {
                ...move,
                qty: actualQty
              }
            })
          }
        }

        setAnalysisResults(enhancedResults)
        setIsLoading(false)

      } catch (error) {
        console.error("Analysis error:", error)
        setError("Error running analysis. Please check your data and try again.")
        setIsLoading(false)
      }
    }

    runRealAnalysis()
  }, [])

  const handleBack = () => {
    router.push("/configure")
  }

  const handleRecommendationToggle = (index: number) => {
    const newSelected = new Set(selectedRecommendations)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRecommendations(newSelected)
  }

  const handleSelectAll = () => {
    if (analysisResults?.result.recommendations) {
      setSelectedRecommendations(new Set(analysisResults.result.recommendations.map((_, index) => index)))
    }
  }

  const handleExportRecommendations = () => {
    if (!analysisResults?.csvString) return

    // If specific recommendations are selected, filter the CSV
    if (selectedRecommendations.size > 0 && selectedRecommendations.size < analysisResults.result.recommendations.length) {
      const selectedMoves = analysisResults.result.recommendations.filter((_, index) => selectedRecommendations.has(index))
      const filteredCsv = generateFilteredCsv(selectedMoves)
      
      const blob = new Blob([filteredCsv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "warehouse-space-saver-selected-recommendations.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      // Download all recommendations
      const blob = new Blob([analysisResults.csvString], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "warehouse-space-saver-recommendations.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const generateFilteredCsv = (moves: any[]) => {
    const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const header = ['sku', 'from_location', 'to_location', 'qty_to_move', 'est_fill_after']
    const body = moves.map(m => [m.sku, m.from, m.to, m.qty, (m.estFillAfter * 100).toFixed(1) + '%'].map(esc).join(','))
    return [header.join(','), ...body].join('\n')
  }

  // Mock warehouse data for DetectedTypesLine
  const mockWarehouseData = [{ type: "Shelf" }, { type: "Shelf" }, { type: "Bin" }, { type: "Pallet" }]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam-light via-card-surface to-seafoam-mid">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper-mid mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-deep-teal mb-2">Analyzing Your Warehouse</h2>
            <p className="text-muted-ink">Processing data and calculating space optimization opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-seafoam-light via-card-surface to-seafoam-mid">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-deep-teal to-copper-mid bg-clip-text text-transparent">
                Space Analysis Results
              </span>
            </h1>
            <p className="text-xl text-deep-teal leading-relaxed font-semibold">
              Discover optimization opportunities and potential{" "}
              <span className="text-copper-mid underline decoration-copper-mid/30 decoration-2 underline-offset-4">
                space-saving opportunities
              </span>{" "}
              in your warehouse
            </p>
          </div>

          {/* Detected Types Line */}
          <Card className="album-card p-4 mb-8">
            <DetectedTypesLine rows={mockWarehouseData} typeKey="type" className="text-center text-deep-teal" />
          </Card>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <Card className="album-card p-1">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === "analysis"
                      ? "album-button text-white"
                      : "album-tab text-deep-teal hover:text-copper-mid"
                  }`}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setActiveTab("recommendations")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === "recommendations"
                      ? "album-button text-white"
                      : "album-tab text-deep-teal hover:text-copper-mid"
                  }`}
                >
                  Recommendations
                </button>
              </div>
            </Card>
          </div>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === "analysis" && analysisResults && (
            <Card className="album-card p-8 mb-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-deep-teal">Space Saver Analysis Results</h2>
                
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-seafoam-light/10 rounded-lg">
                    <h3 className="text-2xl font-bold text-copper-mid">
                      {analysisResults.result.kpis.binsFreed}
                    </h3>
                    <p className="text-deep-teal font-semibold">Bins Freed</p>
                  </div>
                  <div className="text-center p-4 bg-seafoam-light/10 rounded-lg">
                    <h3 className="text-2xl font-bold text-seafoam-dark">
                      {analysisResults.result.kpis.opportunities}
                    </h3>
                    <p className="text-deep-teal font-semibold">Consolidation Opportunities</p>
                  </div>
                  <div className="text-center p-4 bg-seafoam-light/10 rounded-lg">
                    <h3 className="text-2xl font-bold text-copper-dark">
                      {analysisResults.result.kpis.totalSellable}
                    </h3>
                    <p className="text-deep-teal font-semibold">Total Sellable Locations</p>
                  </div>
                  <div className="text-center p-4 bg-seafoam-light/10 rounded-lg">
                    <h3 className="text-2xl font-bold text-deep-teal">
                      {analysisResults.result.recommendations.length}
                    </h3>
                    <p className="text-deep-teal font-semibold">Total Moves</p>
                  </div>
                </div>

                {/* Data Audit */}
                <div className="bg-copper-light/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-deep-teal mb-3">Data Audit</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Files Processed:</span>
                      <br />
                      Locations: {analysisResults.dataAudit.fileCounts.locations}
                      <br />
                      Product Locations: {analysisResults.dataAudit.fileCounts.productLocations}
                      <br />
                      Product Info: {analysisResults.dataAudit.fileCounts.productInfo}
                    </div>
                    <div>
                      <span className="font-semibold">Capacity Modes:</span>
                      <br />
                      {Object.entries(analysisResults.dataAudit.typeCounts).map(([mode, count]) => (
                        <span key={mode}>{mode}: {count}<br /></span>
                      ))}
                    </div>
                    <div>
                      <span className="font-semibold">Unknown Capacity:</span>
                      <br />
                      {analysisResults.dataAudit.unknownCapacityBins} bins
                    </div>
                    <div>
                      <span className="font-semibold">Mixed Locations:</span>
                      <br />
                      {analysisResults.dataAudit.mixedLocations} detected
                    </div>
                  </div>
                </div>

                {/* Move Summary */}
                <div className="bg-seafoam-light/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-deep-teal mb-3">Move Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Condense Overstock:</span> {
                        analysisResults.result.recommendations.filter((m: any) => m.reason === 'condense_overstock').length
                      } moves
                    </div>
                    <div>
                      <span className="font-semibold">Consolidate Pick:</span> {
                        analysisResults.result.recommendations.filter((m: any) => m.reason === 'consolidate_pick').length
                      } moves
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Recommendations Section */}
          {activeTab === "recommendations" && analysisResults && (
            <div className="space-y-8">
              {/* Summary Card */}
              <Card className="album-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-copper-mid">
                      {analysisResults.result.recommendations.length}
                    </h3>
                    <p className="text-deep-teal font-semibold">Total Moves</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-seafoam-dark">
                      {analysisResults.result.kpis.binsFreed}
                    </h3>
                    <p className="text-deep-teal font-semibold">Bins to be Freed</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-copper-dark">
                      {analysisResults.result.kpis.opportunities}
                    </h3>
                    <p className="text-deep-teal font-semibold">SKUs with Opportunities</p>
                  </div>
                </div>
              </Card>

              {/* Recommendations Table */}
              <Card className="album-card p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-deep-teal to-copper-mid bg-clip-text text-transparent">
                      Consolidation Recommendations
                    </span>
                  </h2>
                  <p className="text-deep-teal font-semibold">
                    Select recommendations to include in your optimization plan
                  </p>
                </div>

                {/* Bulk Selection Controls */}
                <div className="mb-4 flex gap-2">
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                    className="album-tab"
                  >
                    Select All
                  </Button>
                  <span className="ml-4 text-sm text-deep-teal self-center">
                    {selectedRecommendations.size} of {analysisResults.result.recommendations.length} selected
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-soft">
                        <th className="text-left py-3 px-4 text-deep-teal font-semibold">Select</th>
                        <th className="text-left py-3 px-4 text-deep-teal font-semibold">SKU</th>
                        <th className="text-left py-3 px-4 text-deep-teal font-semibold">From</th>
                        <th className="text-left py-3 px-4 text-deep-teal font-semibold">To</th>
                        <th className="text-left py-3 px-4 text-deep-teal font-semibold">Quantity</th>
                        <th className="text-left py-3 px-4 text-deep-teal font-semibold">Fill After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResults.result.recommendations.map((move: any, index: number) => (
                        <tr key={index} className="border-b border-border-soft hover:bg-seafoam-light/10">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedRecommendations.has(index)}
                              onChange={() => handleRecommendationToggle(index)}
                              className="w-4 h-4 text-copper-mid bg-card-surface border-border-soft rounded focus:ring-copper-mid"
                            />
                          </td>
                          <td className="py-4 px-4 text-deep-teal font-semibold">{move.sku}</td>
                          <td className="py-4 px-4 text-copper-mid font-semibold">{move.from}</td>
                          <td className="py-4 px-4 text-seafoam-dark font-semibold">{move.to}</td>
                          <td className="py-4 px-4 text-deep-teal">{move.qty}</td>
                          <td className="py-4 px-4 text-deep-teal">
                            {(move.estFillAfter * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CSV Download Button */}
                <div className="mt-6 text-center">
                  <Button
                    onClick={handleExportRecommendations}
                    disabled={selectedRecommendations.size === 0}
                    className="album-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="mr-2 w-4 h-4" />
                    Download CSV ({selectedRecommendations.size} selected)
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="album-tab text-deep-teal border-seafoam-mid hover:bg-seafoam-light/20 bg-transparent"
            >
              <ArrowRight className="mr-2 w-5 h-5" />
              Back to Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

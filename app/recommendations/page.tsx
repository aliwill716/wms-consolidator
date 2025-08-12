"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecommendationsList } from "@/components/recommendations-list"
import { SpaceAnalysisEngine, type AnalysisResults } from "@/lib/space-analysis"
import { ArrowLeft, Download, CheckCircle } from "lucide-react"

export default function RecommendationsPage() {
  const router = useRouter()
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading analysis results
    // In a real app, this would come from the previous steps
    const mockAnalysis = () => {
      const mockProductInfo = [
        { sku: "SKU001", length: 12, width: 8, height: 6 },
        { sku: "SKU002", length: 10, width: 10, height: 4 },
        { sku: "SKU003", length: 6, width: 6, height: 8 },
        { sku: "SKU004", length: 8, width: 6, height: 4 },
      ]

      const mockWarehouseLocations = [
        { location_name: "A1-01", type: "Shelf", pickable: true, sellable: true },
        { location_name: "A1-02", type: "Shelf", pickable: true, sellable: true },
        { location_name: "A1-03", type: "Shelf", pickable: true, sellable: true },
        { location_name: "B2-01", type: "Bin", pickable: true, sellable: false },
        { location_name: "B2-02", type: "Bin", pickable: true, sellable: false },
        { location_name: "C3-01", type: "Pallet", pickable: false, sellable: true },
      ]

      const mockProductLocations = [
        { sku: "SKU001", location_name: "A1-01", quantity: 2 },
        { sku: "SKU002", location_name: "A1-02", quantity: 1 },
        { sku: "SKU003", location_name: "A1-03", quantity: 3 },
        { sku: "SKU004", location_name: "B2-01", quantity: 1 },
      ]

      const mockCapacitySettings = {
        Shelf: { type: "cubic" as const, value: 1000 },
        Bin: { type: "cubic" as const, value: 500 },
        Pallet: { type: "quantity" as const, value: 50 },
      }

      const engine = new SpaceAnalysisEngine(
        mockProductInfo,
        mockWarehouseLocations,
        mockProductLocations,
        mockCapacitySettings,
      )

      return engine.analyze()
    }

    setTimeout(() => {
      const results = mockAnalysis()
      setAnalysisResults(results)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleBack = () => {
    router.push("/analyze")
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

  const handleExportRecommendations = () => {
    if (!analysisResults) return

    const selectedOpportunities = analysisResults.consolidationOpportunities.filter((_, index) =>
      selectedRecommendations.has(index),
    )

    const exportData = {
      summary: {
        totalRecommendations: selectedOpportunities.length,
        totalSpaceSaved: selectedOpportunities.reduce((sum, opp) => sum + opp.spaceSaved, 0),
        implementationDate: new Date().toISOString().split("T")[0],
      },
      recommendations: selectedOpportunities.map((opp, index) => ({
        id: index + 1,
        action: `Move products from ${opp.fromLocations.join(", ")} to ${opp.toLocation}`,
        spaceSaved: opp.spaceSaved,
        products: opp.products,
        priority: opp.spaceSaved > 500 ? "High" : opp.spaceSaved > 200 ? "Medium" : "Low",
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "warehouse-optimization-plan.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalSelectedSavings = analysisResults
    ? analysisResults.consolidationOpportunities
        .filter((_, index) => selectedRecommendations.has(index))
        .reduce((sum, opp) => sum + opp.spaceSaved, 0)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px]">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Generating Recommendations</h2>
            <p className="text-gray-600">Creating personalized consolidation strategies for your warehouse...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px]">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Consolidation Recommendations</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Actionable strategies to optimize your warehouse space and reduce waste
            </p>
          </div>

          {/* Summary Card */}
          {analysisResults && (
            <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-blue-900">
                    {analysisResults.consolidationOpportunities.length}
                  </h3>
                  <p className="text-blue-700">Total Opportunities</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat().format(Math.round(analysisResults.totalPotentialSavings))}
                  </h3>
                  <p className="text-blue-700">Cubic Inches Savable</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat().format(Math.round(totalSelectedSavings))}
                  </h3>
                  <p className="text-green-700">Selected Savings</p>
                </div>
              </div>
            </Card>
          )}

          {/* Recommendations List */}
          {analysisResults && (
            <Card className="p-8 shadow-lg border-0 bg-white mb-8">
              <RecommendationsList
                opportunities={analysisResults.consolidationOpportunities}
                selectedRecommendations={selectedRecommendations}
                onRecommendationToggle={handleRecommendationToggle}
              />
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleBack} className="px-6 py-3 text-lg font-medium bg-transparent">
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back to Analysis
            </Button>

            <div className="flex gap-4">
              <Button
                onClick={handleExportRecommendations}
                disabled={selectedRecommendations.size === 0}
                variant="outline"
                className="px-6 py-3 text-lg font-medium bg-transparent"
              >
                <Download className="mr-2 w-5 h-5" />
                Export Plan ({selectedRecommendations.size})
              </Button>

              <Button
                disabled={selectedRecommendations.size === 0}
                size="lg"
                className="px-8 py-3 text-lg font-medium bg-green-600 hover:bg-green-700 transition-all duration-200"
              >
                <CheckCircle className="mr-2 w-5 h-5" />
                Implement Selected ({selectedRecommendations.size})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

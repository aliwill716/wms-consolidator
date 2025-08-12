"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ConsolidationOpportunity } from "@/lib/space-analysis"
import { ChevronDown, ChevronRight, TrendingUp, Package, ArrowRight, Info } from "lucide-react"

interface RecommendationsListProps {
  opportunities: ConsolidationOpportunity[]
  selectedRecommendations: Set<number>
  onRecommendationToggle: (index: number) => void
}

export function RecommendationsList({
  opportunities,
  selectedRecommendations,
  onRecommendationToggle,
}: RecommendationsListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const getPriorityBadge = (spaceSaved: number) => {
    if (spaceSaved > 500) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>
    } else if (spaceSaved > 200) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Priority</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low Priority</Badge>
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Consolidation Opportunities Found</h3>
        <p className="text-gray-600">
          Your warehouse is already well-optimized, or there may not be enough compatible locations for consolidation.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Recommended Actions</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="w-4 h-4" />
          Select recommendations to include in your implementation plan
        </div>
      </div>

      <div className="space-y-4">
        {opportunities.map((opportunity, index) => (
          <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
            <Collapsible open={expandedItems.has(index)} onOpenChange={() => toggleExpanded(index)}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedRecommendations.has(index)}
                    onCheckedChange={() => onRecommendationToggle(index)}
                    className="mt-1"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">Consolidation Opportunity #{index + 1}</h3>
                        {getPriorityBadge(opportunity.spaceSaved)}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <TrendingUp className="w-4 h-4" />
                          {formatNumber(opportunity.spaceSaved)} cubic inches saved
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <span className="font-medium">Move from:</span>
                      <Badge variant="outline">{opportunity.fromLocations.join(", ")}</Badge>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium">to:</span>
                      <Badge variant="outline">{opportunity.toLocation}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {opportunity.products.length} products •{" "}
                        {formatNumber(opportunity.products.reduce((sum, p) => sum + p.volume, 0))} cubic inches total
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          {expandedItems.has(index) ? (
                            <>
                              Hide Details <ChevronDown className="ml-1 w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Show Details <ChevronRight className="ml-1 w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>

                <CollapsibleContent className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-6">
                    {/* Products to Move */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Products to Move</h4>
                      <div className="grid gap-3">
                        {opportunity.products.map((product, productIndex) => (
                          <div
                            key={productIndex}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{product.sku}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Qty: {product.quantity} • Volume: {formatNumber(product.volume)} cubic inches
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Impact Analysis */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Impact Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h5 className="font-medium text-red-900 mb-2">Before Consolidation</h5>
                          <ul className="text-sm text-red-800 space-y-1">
                            <li>• {opportunity.fromLocations.length} locations in use</li>
                            <li>• Space underutilized</li>
                            <li>• Higher picking complexity</li>
                          </ul>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h5 className="font-medium text-green-900 mb-2">After Consolidation</h5>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• 1 location for all products</li>
                            <li>• {formatNumber(opportunity.spaceSaved)} cubic inches freed</li>
                            <li>• Simplified picking process</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Implementation Steps */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Implementation Steps</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Verify available space in destination location ({opportunity.toLocation})</li>
                        <li>
                          Move products from source locations ({opportunity.fromLocations.join(", ")}) to{" "}
                          {opportunity.toLocation}
                        </li>
                        <li>Update inventory management system with new locations</li>
                        <li>Mark source locations as available for new inventory</li>
                        <li>Train staff on updated picking routes</li>
                      </ol>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  )
}

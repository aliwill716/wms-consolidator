"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DetectedTypesLine } from "@/components/ui/detected-types-line"
import { Info, RefreshCw, Plus } from "lucide-react"

interface CapacitySettings {
  cubicInches: number
  units: number
}

interface CapacityConfigurationProps {
  locationTypes: string[]
  onCapacityChange: (locationType: string, settings: CapacitySettings) => void
  capacitySettings: Record<string, CapacitySettings>
  onRescanTypes?: () => void
  onAddTypeManually?: (typeName: string) => void
  warehouseData?: any[]
  typeColumnKey?: string
}

export function CapacityConfiguration({
  locationTypes,
  onCapacityChange,
  capacitySettings,
  onRescanTypes,
  onAddTypeManually,
  warehouseData = [],
  typeColumnKey = "type",
}: CapacityConfigurationProps) {
  const [newTypeName, setNewTypeName] = useState("")
  const [showAddType, setShowAddType] = useState(false)

  const isValidConfiguration = (locationType: string) => {
    const settings = capacitySettings[locationType]
    return settings && (settings.cubicInches > 0 || settings.units > 0)
  }

  const validConfiguredCount = locationTypes.filter((type) => isValidConfiguration(type)).length
  const allConfigured = locationTypes.length > 0 && validConfiguredCount === locationTypes.length

  const handleCubicInchesChange = (locationType: string, value: string) => {
    const currentSettings = capacitySettings[locationType] || { cubicInches: 0, units: 0 }
    const numValue = Number.parseFloat(value) || 0
    onCapacityChange(locationType, { ...currentSettings, cubicInches: numValue })
  }

  const handleUnitsChange = (locationType: string, value: string) => {
    const currentSettings = capacitySettings[locationType] || { cubicInches: 0, units: 0 }
    const numValue = Number.parseFloat(value) || 0
    onCapacityChange(locationType, { ...currentSettings, units: numValue })
  }

  const handleAddType = () => {
    if (newTypeName.trim() && onAddTypeManually) {
      onAddTypeManually(newTypeName.trim())
      setNewTypeName("")
      setShowAddType(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="album-heading text-3xl mb-3">Location Type Capacities</h2>
        <p className="text-deep-teal font-semibold text-lg">
          Configure maximum capacity for each location type. Defaults to cubic inches with SKU quantity fallback.
        </p>
      </div>

      {warehouseData.length > 0 && (
        <Card className="album-card p-4 rounded-2xl">
          <DetectedTypesLine rows={warehouseData} typeKey={typeColumnKey} className="text-center" />
          {onRescanTypes && (
            <div className="flex justify-center mt-3">
              <Button
                onClick={onRescanTypes}
                variant="outline"
                size="sm"
                className="album-tab rounded-full bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rescan Types
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="album-card p-4 rounded-2xl">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-copper-mid mt-0.5 flex-shrink-0" />
          <p className="text-deep-teal font-semibold">
            System prioritizes cubic inches and assumes one SKU per location for optimal space analysis.
          </p>
        </div>
      </Card>

      {locationTypes.length === 0 && (
        <Card className="album-card p-6 border-2 border-copper-mid/30 rounded-2xl">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-copper-mid mb-2">No location types found</h3>
            <p className="text-deep-teal font-semibold mb-4">Rescan from Upload or Add Type Manually</p>
            <div className="flex gap-3 justify-center">
              {onRescanTypes && (
                <Button onClick={onRescanTypes} variant="outline" className="album-tab rounded-full bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rescan Types
                </Button>
              )}
              <Button onClick={() => setShowAddType(true)} className="album-button rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Type Manually
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showAddType && (
        <Card className="album-card p-4 rounded-2xl">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-sm font-semibold text-deep-teal mb-2 block">New Location Type</Label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Enter location type name"
                className="bg-card-surface border-border-soft text-deep-teal rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddType()
                  if (e.key === "Escape") setShowAddType(false)
                }}
              />
            </div>
            <Button onClick={handleAddType} disabled={!newTypeName.trim()} className="album-button rounded-full">
              Add
            </Button>
            <Button
              onClick={() => {
                setShowAddType(false)
                setNewTypeName("")
              }}
              variant="outline"
              className="album-tab rounded-full"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {locationTypes.length > 0 && (
        <Card className="album-card p-6 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="text-left py-3 px-4 text-deep-teal font-semibold">Location Type</th>
                  <th className="text-left py-3 px-4 text-deep-teal font-semibold">Capacity (cubic inches)</th>
                  <th className="text-left py-3 px-4 text-deep-teal font-semibold">Capacity (units)</th>
                  <th className="text-left py-3 px-4 text-deep-teal font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {locationTypes.map((locationType) => {
                  const settings = capacitySettings[locationType] || { cubicInches: 0, units: 0 }
                  const isValid = isValidConfiguration(locationType)

                  return (
                    <tr key={locationType} className="border-b border-border-soft hover:bg-seafoam-light/10">
                      <td className="py-4 px-4">
                        <span className="text-deep-teal font-semibold text-lg">{locationType}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0"
                          value={settings.cubicInches || ""}
                          onChange={(e) => handleCubicInchesChange(locationType, e.target.value)}
                          className="w-32 bg-card-surface border-border-soft text-deep-teal placeholder:text-muted-ink focus:border-copper-mid focus:ring-copper-mid/20 rounded-2xl"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={settings.units || ""}
                          onChange={(e) => handleUnitsChange(locationType, e.target.value)}
                          className="w-32 bg-card-surface border-border-soft text-deep-teal placeholder:text-muted-ink focus:border-seafoam-mid focus:ring-seafoam-mid/20 rounded-2xl"
                        />
                      </td>
                      <td className="py-4 px-4">
                        {isValid ? (
                          <Badge className="album-badge success rounded-full">Configured</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-ink border-muted-ink rounded-full">
                            Required
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-muted-ink space-y-1">
            <p>
              • If both fields are filled, analysis prioritizes cubic inches and uses units only when SKU dimensions are
              missing.
            </p>
            <p>• Example: A 12" × 8" × 6" shelf = 576 cubic inches</p>
          </div>
        </Card>
      )}

      <div className="text-center pt-6">
        <p className="text-deep-teal font-semibold text-lg">
          Configured {validConfiguredCount} of {locationTypes.length} location types
        </p>
        {locationTypes.length > 0 && !allConfigured && (
          <p className="text-copper-mid text-sm mt-1">
            Each location type needs either cubic inches or units to proceed
          </p>
        )}
      </div>

      {locationTypes.length > 0 && !showAddType && (
        <div className="text-center">
          <Button onClick={() => setShowAddType(true)} variant="outline" size="sm" className="album-tab rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Type Manually
          </Button>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CheckCircle, AlertCircle } from "lucide-react"

interface MappingFieldProps {
  field: { key: string; label: string; description?: string }
  headers: string[]
  mapping: Record<string, string>
  confidenceScores: Record<string, number>
  customFields: Record<string, string>
  onFieldMapping: (fieldKey: string, selectedHeader: string) => void
  onCustomField: (fieldKey: string, customName: string) => void
  isRequired?: boolean
}

export function MappingField({
  field,
  headers,
  mapping,
  confidenceScores,
  customFields,
  onFieldMapping,
  onCustomField,
  isRequired = true,
}: MappingFieldProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)

  const allHeaders = [...headers, ...Object.values(customFields)]
  const isFieldMapped = !!mapping[field.key]
  const score = confidenceScores[field.key]

  const getConfidenceBadge = () => {
    if (!score) return null

    const percentage = Math.round(score * 100)
    const isExact = score === 1.0
    const badgeText = isExact ? "Auto-mapped (100%)" : `Auto-mapped (${percentage}%)`
    const badgeClass = isExact ? "album-badge success" : "album-badge partial"

    return (
      <div className={badgeClass}>
        <CheckCircle className="w-4 h-4" />
        <span>{badgeText}</span>
      </div>
    )
  }

  const handleCustomFieldSubmit = (value: string) => {
    if (value.trim()) {
      onCustomField(field.key, value.trim())
      setShowCustomInput(false)
    }
  }

  return (
    <div
      className="copper-glitter-banner p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: `url('/textures/copper-glitter.png') center/cover fixed, 
                    linear-gradient(135deg, var(--copper-dark) 0%, var(--copper-mid) 40%, var(--copper-light) 100%)`,
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 20px rgba(232, 106, 62, 0.3)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
          animation: "shimmer 10s linear infinite",
        }}
      />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-semibold text-white drop-shadow-sm">{field.label}</label>
            {isFieldMapped ? (
              getConfidenceBadge()
            ) : (
              <div className="album-badge unmapped">
                <span>Unmapped</span>
              </div>
            )}
          </div>
          {field.description && <p className="text-xs text-white/90 mb-2 drop-shadow-sm">{field.description}</p>}
          {isRequired && !isFieldMapped && (
            <p className="text-xs text-white/90 flex items-center gap-1 drop-shadow-sm">
              <AlertCircle className="w-3 h-3" />
              This field is required
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-48">
          <Select value={mapping[field.key] || ""} onValueChange={(value) => onFieldMapping(field.key, value)}>
            <SelectTrigger
              className={
                isFieldMapped
                  ? "h-10 rounded-xl shadow-sm text-white border-none focus:ring-2 focus:ring-[#FF9A63] copper-select"
                  : "bg-white border-deep-teal text-deep-teal h-10 rounded-xl shadow-sm"
              }
              style={
                isFieldMapped
                  ? {
                      background: "linear-gradient(135deg, #E86A3E, #FF9A63, #FFB17A)",
                      border: "1px solid #B9502D",
                    }
                  : undefined
              }
            >
              <SelectValue placeholder="Select column..." />
            </SelectTrigger>
            <SelectContent className="bg-card-surface border-border-soft rounded-xl">
              {allHeaders.map((header) => (
                <SelectItem key={header} value={header} className="text-deep-teal hover:bg-seafoam-light rounded-lg">
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showCustomInput ? (
            <div className="flex gap-1">
              <Input
                placeholder="Enter column name"
                className="text-xs h-8 bg-white border-deep-teal text-deep-teal rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCustomFieldSubmit(e.currentTarget.value)
                  }
                  if (e.key === "Escape") {
                    setShowCustomInput(false)
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs text-white/80 hover:text-white transition-colors text-left drop-shadow-sm"
            >
              Can't find it? → Enter custom name
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

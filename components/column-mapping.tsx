"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { MapPin, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MappingField } from "@/components/ui/mapping-field"

interface ColumnMappingProps {
  fileType: string
  headers: string[]
  requiredFields: { key: string; label: string; description?: string }[]
  onMappingComplete: (mapping: Record<string, string>) => void
  onMappingConfirm: () => void
  onClearMapping: () => void
  isConfirmed: boolean
  rowCount: number
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }
  return matrix[str2.length][str1.length]
}

function normalizeHeader(header: string): string {
  if (!header || typeof header !== "string") return ""

  return (
    header
      .toLowerCase()
      .trim()
      // Remove BOM characters
      .replace(/^\uFEFF/, "")
      // Remove punctuation, underscores, dashes, parentheses
      .replace(/[_\-().,;:!?'"]/g, "")
      // Collapse multiple spaces
      .replace(/\s+/g, "")
  )
}

export function ColumnMapping({
  fileType,
  headers,
  requiredFields,
  onMappingComplete,
  onMappingConfirm,
  onClearMapping,
  isConfirmed,
  rowCount,
}: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({})
  const autoMappingPerformed = useRef(false)

  const safeHeaders = Array.isArray(headers) ? headers : []

  const synonyms: Record<string, string[]> = {
    location_name: ["location", "location_name", "bin", "slot", "loc", "location_id", "bin_id"],
    type: ["type", "location_type", "bin_type", "shelf_type", "rack_type", "category"],
    pickable: ["pickable", "pick", "is_pickable", "picking", "pick_bin", "can_pick"],
    sellable: ["sellable", "is_sellable", "sell_status", "available", "sellable_status"],
    location: ["location", "loc", "bin", "slot", "position"],
    sku: ["sku", "productsku", "itemsku", "productid", "itemid", "skuid", "item", "product"],
    quantity: ["quantity", "qty", "count", "amount", "units"],
    length: ["length", "lengthin", "len", "l", "packagelength", "dimlength", "depth"],
    width: ["width", "widthin", "w", "packagewidth", "dimwidth"],
    height: ["height", "heightin", "h", "packageheight", "dimheight"],
    weight: ["weight", "weightlb", "weightoz", "mass"],
  }

  useEffect(() => {
    if (safeHeaders.length > 0 && !autoMappingPerformed.current) {
      performAutoMapping()
      autoMappingPerformed.current = true
    }
  }, [safeHeaders])

  useEffect(() => {
    autoMappingPerformed.current = false
  }, [headers])

  const performAutoMapping = () => {
    const autoMapping: Record<string, string> = {}
    const scores: Record<string, number> = {}

    const normalizedHeaders = safeHeaders.map((header) => ({
      original: header,
      normalized: normalizeHeader(header),
    }))

    requiredFields.forEach((field) => {
      const fieldSynonyms = synonyms[field.key] || [field.key]
      let bestMatch = ""
      let bestScore = 0

      for (const synonym of fieldSynonyms) {
        const normalizedSynonym = normalizeHeader(synonym)
        const exactMatch = normalizedHeaders.find((h) => h.normalized === normalizedSynonym)
        if (exactMatch) {
          bestMatch = exactMatch.original
          bestScore = 1.0
          break
        }
      }

      if (!bestMatch) {
        const threshold = fileType === "Product Information" ? 0.85 : 0.8

        for (const headerObj of normalizedHeaders) {
          for (const synonym of fieldSynonyms) {
            const similarity = calculateSimilarity(headerObj.normalized, normalizeHeader(synonym))
            if (similarity > bestScore && similarity >= threshold) {
              bestMatch = headerObj.original
              bestScore = similarity
            }
          }
        }
      }

      if (bestMatch && bestScore >= (fileType === "Product Information" ? 0.85 : 0.8)) {
        autoMapping[field.key] = bestMatch
        scores[field.key] = bestScore
      }
    })

    setMapping(autoMapping)
    setConfidenceScores(scores)
    if (Object.keys(autoMapping).length > 0) {
      onMappingComplete(autoMapping)
    }
  }

  const handleFieldMapping = (requiredField: string, selectedHeader: string) => {
    const newMapping = { ...mapping, [requiredField]: selectedHeader }
    const newScores = { ...confidenceScores, [requiredField]: 1.0 }

    setMapping(newMapping)
    setConfidenceScores(newScores)
    onMappingComplete(newMapping)
  }

  const isComplete =
    fileType === "Product Information"
      ? !!mapping.sku // Only SKU is required for Product Info
      : requiredFields.every((field) => mapping[field.key])

  const isFieldMapped = (fieldKey: string) => !!mapping[fieldKey]
  const hasUnmappedFields = requiredFields.some((field) => !mapping[field.key])

  const getConfidenceBadge = (fieldKey: string) => {
    const score = confidenceScores[fieldKey]
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

  return (
    <Card className="album-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-deep-teal" />
        <div>
          <h3 className="text-lg font-semibold text-deep-teal">Map Columns - {fileType}</h3>
          <p className="text-muted-ink text-sm">Match your CSV columns to the required fields</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {requiredFields.map((field) => (
          <MappingField
            key={field.key}
            field={field}
            headers={safeHeaders}
            mapping={mapping}
            confidenceScores={confidenceScores}
            onFieldMapping={handleFieldMapping}
            isRequired={fileType !== "Product Information" || field.key === "sku"}
          />
        ))}
      </div>

      {isComplete && (
        <div className="mb-4 p-3 bg-seafoam-light/20 border border-seafoam-mid/30 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-deep-teal">
            <CheckCircle className="w-4 h-4" />
            <span>
              ✔ Mapped {Object.keys(mapping).length}/{requiredFields.length} fields • {rowCount} rows
              {fileType === "Product Information" && !mapping.length && !mapping.width && !mapping.height && (
                <span className="text-muted-ink ml-2">(dimensions missing - will use units fallback)</span>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border-soft">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={performAutoMapping}
            className="album-tab text-deep-teal border-seafoam-mid hover:bg-seafoam-light/20 bg-transparent"
          >
            Auto-map
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMapping({})
              setConfidenceScores({})
              onClearMapping()
            }}
            className="album-tab text-deep-teal border-border-soft hover:bg-muted/20"
          >
            Clear
          </Button>
        </div>
        <Button
          onClick={onMappingConfirm}
          disabled={!isComplete}
          className="album-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Mapping
        </Button>
      </div>
    </Card>
  )
}

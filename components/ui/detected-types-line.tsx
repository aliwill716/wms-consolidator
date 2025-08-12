import { getLocationTypeCounts } from "@/lib/types"

interface DetectedTypesLineProps {
  rows: any[]
  typeKey: string
  className?: string
}

export function DetectedTypesLine({ rows, typeKey, className = "" }: DetectedTypesLineProps) {
  const counts = getLocationTypeCounts(rows, typeKey)
  const types = Object.keys(counts)
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0)

  if (types.length === 0) {
    return <div className={`text-xs text-muted-ink ${className}`}>Detected types: None found</div>
  }

  const typeDisplay = types
    .slice(0, 3) // Show first 3 types
    .map((type) => `${type} (${counts[type]})`)
    .join(", ")

  const hasMore = types.length > 3
  const moreText = hasMore ? `, +${types.length - 3} more` : ""

  return (
    <div className={`text-xs text-muted-ink ${className}`}>
      Detected types: {typeDisplay}
      {moreText} ({totalCount} total)
    </div>
  )
}

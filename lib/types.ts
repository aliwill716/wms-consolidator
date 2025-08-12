function getCell(row: any, columnIndex: number, headers: string[]): string {
  // Handle array-based CSV data
  if (Array.isArray(row)) {
    return row[columnIndex] || ""
  }

  // Handle object-based CSV data
  if (typeof row === "object" && row !== null && headers[columnIndex]) {
    return row[headers[columnIndex]] || ""
  }

  return ""
}

export function getLocationTypes(
  files: any,
  typeCol: number,
  typeKey?: string,
): { types: string[]; counts: Record<string, number>; error?: string } {
  try {
    const headers = files.headers || []
    const rows = files.rows || []

    if (!headers.length || !rows.length) {
      return { types: [], counts: {} }
    }

    if (typeCol < 0 || typeCol >= headers.length) {
      return { types: [], counts: {}, error: `Invalid column index: ${typeCol}` }
    }

    const typeCounts: Record<string, number> = {}
    const placeholders = new Set(["", "none", "n/a", "na", "null", "undefined", "0", "-"])

    for (const row of rows) {
      const rawValue = getCell(row, typeCol, headers)
      if (!rawValue) continue

      const cleanValue = String(rawValue).trim()
      if (cleanValue && !placeholders.has(cleanValue.toLowerCase())) {
        typeCounts[cleanValue] = (typeCounts[cleanValue] || 0) + 1
      }
    }

    const types = Object.keys(typeCounts).sort()
    return { types, counts: typeCounts }
  } catch (error) {
    return { types: [], counts: {}, error: `Error processing types: ${error}` }
  }
}

export function getDistinctLocationTypes(rows: any[], typeKey: string): string[] {
  const fakeFiles = { headers: [typeKey], rows }
  return getLocationTypes(fakeFiles, 0, typeKey).types
}

export function getLocationTypeCounts(rows: any[], typeKey: string): Record<string, number> {
  const fakeFiles = { headers: [typeKey], rows }
  return getLocationTypes(fakeFiles, 0, typeKey).counts
}

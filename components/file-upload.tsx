"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadedFile {
  name: string
  size: number
  data: Array<Record<string, string | number>>
  headers: string[]
}

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void
  onRemoveFile?: () => void
  uploadedFile: UploadedFile | null
  expectedColumns: string[]
}

export function FileUpload({ onFileUpload, onRemoveFile, uploadedFile, expectedColumns }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const parseCSV = (text: string): { headers: string[]; rows: Array<Record<string, string | number>> } => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) return { headers: [], rows: [] }

    const headers = lines[0].split(",").map((h) => h.trim())
    const rows: Array<Record<string, string | number>> = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: Record<string, string | number> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      rows.push(row)
    }

    return { headers, rows }
  }

  const validateColumns = (data: any[]): boolean => {
    return data.length > 0 // Just check that we have data
  }

  const handleFileSelect = async (file: File) => {
    setError(null)

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    try {
      const text = await file.text()
      const { headers, rows } = parseCSV(text)

      if (!Array.isArray(headers) || headers.length === 0 || rows.length === 0) {
        setError("CSV file appears to be empty or invalid")
        return
      }

      onFileUpload({
        name: file.name,
        size: file.size,
        data: rows, // Store normalized rows
        headers, // Store normalized headers array
      })
    } catch (err) {
      setError("Error reading file. Please check the format.")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const removeFile = () => {
    setError(null)
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onRemoveFile?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver ? "border-mint-400 bg-mint-400/5" : "border-slate-600 hover:border-slate-500"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto w-8 h-8 text-slate-400 mb-3" />
          <p className="text-slate-300 mb-3">Drag and drop your CSV file here, or click to browse</p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="hover:bg-slate-700 border-slate-600 text-slate-200"
          >
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-mint-400/10 border border-mint-400/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <File className="w-5 h-5 text-mint-400" />
            <div>
              <p className="font-medium text-mint-300">{uploadedFile.name}</p>
              <p className="text-sm text-mint-400/80">
                {formatFileSize(uploadedFile.size)} • {uploadedFile.data.length} rows
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="text-mint-400 hover:text-mint-300 hover:bg-mint-400/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

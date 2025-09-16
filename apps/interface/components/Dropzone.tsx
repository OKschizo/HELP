'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'

interface DroppedFile extends File {
  preview?: string
}

interface DropzoneProps {
  onFilesChange: (files: File[], metadata?: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: Record<string, string[]>
  className?: string
}

export function Dropzone({ 
  onFilesChange, 
  maxFiles, 
  maxSizeMB = 150, 
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/json': ['.json']
  },
  className 
}: DropzoneProps) {
  const [files, setFiles] = useState<DroppedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Separate images and metadata files
    const imageFiles: File[] = []
    const metadataFiles: File[] = []
    
    acceptedFiles.forEach(file => {
      // Check if file is from webkitRelativePath (folder drop)
      const filePath = (file as any).webkitRelativePath || file.name
      
      if (file.type.startsWith('image/')) {
        imageFiles.push(file)
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        metadataFiles.push(file)
      }
    })
    
    // Sort files by name/number for proper pairing
    const sortByNumber = (a: File, b: File) => {
      const getNumber = (filename: string) => {
        const match = filename.match(/(\d+)/)
        return match ? parseInt(match[1]) : 0
      }
      return getNumber(a.name) - getNumber(b.name)
    }
    
    imageFiles.sort(sortByNumber)
    metadataFiles.sort(sortByNumber)
    
    // Create previews for images
    const newFiles = imageFiles.map(file => {
      const droppedFile = file as DroppedFile
      if (file.type.startsWith('image/')) {
        droppedFile.preview = URL.createObjectURL(file)
      }
      return droppedFile
    })
    
    const updatedFiles = typeof maxFiles === 'number' && isFinite(maxFiles)
      ? [...files, ...newFiles].slice(0, maxFiles)
      : [...files, ...newFiles]
    setFiles(updatedFiles)
    
    // Pass both image and metadata files separately
    onFilesChange(updatedFiles, metadataFiles)
  }, [files, maxFiles, onFilesChange])

  const removeFile = (fileToRemove: DroppedFile) => {
    const updatedFiles = files.filter(file => file !== fileToRemove)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles, []) // Pass empty metadata array for now
    
    // Clean up preview URL
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: typeof maxFiles === 'number' ? maxFiles : undefined,
    maxSize: maxSizeMB * 1024 * 1024,
    accept,
    multiple: true,
    // Enable folder selection
    getFilesFromEvent: async (event) => {
      const files: File[] = []
      
      if ('dataTransfer' in event) {
        // Handle drag and drop
        const items = Array.from(event.dataTransfer.items)
        
        for (const item of items) {
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry?.()
            if (entry) {
              await traverseFileTree(entry, files)
            } else {
              const file = item.getAsFile()
              if (file) files.push(file)
            }
          }
        }
      } else if ('target' in event && event.target) {
        // Handle file input
        const target = event.target as HTMLInputElement
        if (target.files) {
          files.push(...Array.from(target.files))
        }
      }
      
      return files
    }
  })

  // Helper function to traverse folder structure
  const traverseFileTree = async (entry: any, files: File[]): Promise<void> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file: File) => {
          // Add webkitRelativePath for folder structure info
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath?.slice(1) || '',
            writable: false
          })
          files.push(file)
          resolve()
        })
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader()
        const entriesAcc: any[] = []
        const readAll = async () => {
          return new Promise<void>((resAll) => {
            const readBatch = () => {
              dirReader.readEntries(async (batch: any[]) => {
                if (batch.length) {
                  entriesAcc.push(...batch)
                  // Keep reading until empty batch (webkit returns up to 100 per call)
                  readBatch()
                } else {
                  // Process all collected entries
                  (async () => {
                    for (const childEntry of entriesAcc) {
                      await traverseFileTree(childEntry, files)
                    }
                    resAll()
                  })()
                }
              })
            }
            readBatch()
          })
        }
        readAll().then(() => resolve())
      } else {
        resolve()
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive 
            ? 'border-[var(--hl-cyan)] bg-[var(--hl-cyan)]/5' 
            : 'border-[var(--stroke-soft)] hover:border-[var(--stroke-strong)]'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-[var(--fg-subtle)] mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-[var(--fg-default)]">Drop the files here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[var(--fg-default)] font-medium">
              Drag & drop your NFT collection folder
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Supports folders with images/ and metadata/ subfolders
            </p>
            <p className="text-xs text-[var(--fg-subtle)]">
              PNG, JPG, GIF, WebP, JSON up to {maxSizeMB}MB each
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--fg-muted)]">Uploading...</span>
            <span className="text-[var(--fg-default)]">{progress}%</span>
          </div>
          <div className="w-full bg-[var(--bg-subtle)] rounded-full h-2">
            <div 
              className="bg-[var(--hl-cyan)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="font-medium">{file.name}</p>
              {errors.map(error => (
                <p key={error.code} className="text-xs">{error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-[var(--fg-default)]">
            Files ({files.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--stroke-soft)]"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-subtle)] flex items-center justify-center">
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(file.preview!)}
                    />
                  ) : file.type === 'application/json' ? (
                    <File className="w-5 h-5 text-[var(--fg-subtle)]" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[var(--fg-subtle)]" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--fg-default)] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--fg-muted)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file)}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

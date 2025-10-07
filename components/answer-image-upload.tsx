'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'

interface AnswerImageUploadProps {
  listingId: string
  onImagesChange: (imagePaths: string[]) => void
  maxImages?: number
  disabled?: boolean
}

interface UploadedImage {
  id: string
  url: string
  path: string
  isUploading: boolean
  error?: string
}

export function AnswerImageUpload({ 
  listingId, 
  onImagesChange,
  maxImages = 5,
  disabled = false 
}: AnswerImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Image compression options - preserves aspect ratio
  const compressionOptions = {
    maxSizeMB: 1, // 1MB max for better quality
    maxWidthOrHeight: 1920, // Higher resolution while still compressing
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.8, // Better quality
  }

  const compressImage = async (file: File): Promise<File> => {
    try {
      const compressedFile = await imageCompression(file, compressionOptions)
      const newFile = new File(
        [compressedFile], 
        file.name.replace(/\.[^/.]+$/, '.jpg'), 
        { type: 'image/jpeg' }
      )
      return newFile
    } catch (error) {
      console.error('Error compressing image:', error)
      throw error
    }
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
      // Get signed upload URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          listingId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const { uploadUrl, path } = await response.json()

      // Upload file to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      return path
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const processFiles = async (files: File[]) => {
    if (disabled || isUploading) return
    
    if (images.length + files.length > maxImages) {
      toast({
        title: 'Too Many Images',
        description: `You can only upload up to ${maxImages} images`,
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    const newImages: UploadedImage[] = files.map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      path: '',
      isUploading: true,
    }))

    setImages(prev => [...prev, ...newImages])

    const uploadedPaths: string[] = []

    // Process each file
    for (let i = 0; i < newImages.length; i++) {
      const imageData = newImages[i]
      const file = files[i]

      try {
        // Compress the image
        const compressedFile = await compressImage(file)
        
        // Upload to Supabase
        const path = await uploadToSupabase(compressedFile)
        uploadedPaths.push(path)
        
        // Update the image with the uploaded path
        setImages(prev => prev.map(img => 
          img.id === imageData.id 
            ? { ...img, path, isUploading: false }
            : img
        ))
      } catch (error) {
        console.error('Error processing image:', error)
        
        setImages(prev => prev.map(img => 
          img.id === imageData.id 
            ? { ...img, isUploading: false, error: 'Upload failed' }
            : img
        ))

        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        })
      }
    }

    setIsUploading(false)

    // Update parent with all successfully uploaded paths
    // Note: images state may not be updated yet due to async setState,
    // so we rely on uploadedPaths which we tracked synchronously
    onImagesChange(uploadedPaths)
  }

  const removeImage = (id: string) => {
    if (disabled) return
    
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      // Get paths from successfully uploaded images only
      const paths = updated.filter(img => img.path && !img.isUploading && !img.error).map(img => img.path)
      onImagesChange(paths)
      return updated
    })
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    )

    if (imageFiles.length !== acceptedFiles.length) {
      toast({
        title: 'Invalid Files',
        description: 'Only image files are allowed',
        variant: 'destructive',
      })
    }

    if (imageFiles.length > 0) {
      processFiles(imageFiles)
    }
  }, [images.length, maxImages, disabled, isUploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: maxImages - images.length,
    disabled: disabled || isUploading,
  })

  return (
    <div className="space-y-3">
      {/* Compact Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex items-center justify-center gap-3">
          {isUploading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
          
          <div className="text-sm">
            {isDragActive 
              ? 'Drop images here...' 
              : images.length > 0
                ? `${images.length} of ${maxImages} images`
                : 'Add images to your answer'
            }
          </div>

          {!disabled && !isUploading && (
            <Button type="button" variant="outline" size="sm">
              <Upload className="h-3 w-3 mr-1" />
              Choose
            </Button>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                <Image
                  src={image.url}
                  alt={`Answer image ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />
                
                {/* Loading overlay */}
                {image.isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                )}

                {/* Error overlay */}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <span className="text-white text-xs">Failed</span>
                  </div>
                )}

                {/* Remove button */}
                {!disabled && !image.isUploading && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


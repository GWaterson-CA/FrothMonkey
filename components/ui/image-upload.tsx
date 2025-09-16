'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  listingId?: string
  maxImages?: number
  onImagesChange?: (images: UploadedImage[]) => void
  disabled?: boolean
}

export interface UploadedImage {
  id: string
  file?: File
  url: string
  path?: string
  isUploading?: boolean
  error?: string
}

export function ImageUpload({ 
  listingId, 
  maxImages = 10, 
  onImagesChange,
  disabled = false 
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Image compression options for development (low resolution)
  const compressionOptions = {
    maxSizeMB: 0.5, // 500KB max
    maxWidthOrHeight: 800, // 800px max dimension for dev
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.7,
  }

  const compressImage = async (file: File): Promise<File> => {
    try {
      const compressedFile = await imageCompression(file, compressionOptions)
      
      // Create a new file with a proper name
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
    if (!listingId) {
      throw new Error('Listing ID is required for upload')
    }

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
      file,
      url: URL.createObjectURL(file),
      isUploading: true,
    }))

    setImages(prev => [...prev, ...newImages])

    // Process each file
    for (let i = 0; i < newImages.length; i++) {
      const imageData = newImages[i]
      const file = imageData.file!

      try {
        // Compress the image
        const compressedFile = await compressImage(file)
        
        // Upload to Supabase if listing ID is available
        if (listingId) {
          const path = await uploadToSupabase(compressedFile)
          
          // Update the image with the uploaded path
          setImages(prev => prev.map(img => 
            img.id === imageData.id 
              ? { ...img, path, isUploading: false, file: compressedFile }
              : img
          ))
        } else {
          // Just update with compressed file for preview
          setImages(prev => prev.map(img => 
            img.id === imageData.id 
              ? { ...img, isUploading: false, file: compressedFile }
              : img
          ))
        }

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
  }

  const removeImage = (id: string) => {
    if (disabled) return
    
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      onImagesChange?.(updated)
      return updated
    })
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for image files only
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

  // Update parent component when images change
  useEffect(() => {
    onImagesChange?.(images)
  }, [images, onImagesChange])

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
              ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              {isUploading ? (
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? 'Drop images here...' 
                    : 'Drag & drop images or click to browse'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Up to {maxImages} images • JPEG, PNG, WebP, GIF • Max 5MB each
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images will be compressed to 800px for development
                </p>
              </div>

              {!disabled && !isUploading && (
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  
                  {/* Loading overlay */}
                  {image.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Error overlay */}
                  {image.error && (
                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                      <span className="text-white text-xs">Failed</span>
                    </div>
                  )}

                  {/* Remove button */}
                  {!disabled && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Cover image indicator */}
                  {index === 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 left-1 text-xs"
                    >
                      Cover
                    </Badge>
                  )}
                </div>

                {/* Image info */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {image.file && (
                    <div>
                      <div>{image.file.name}</div>
                      <div>{(image.file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  )}
                  {image.isUploading && (
                    <div className="text-primary">Uploading...</div>
                  )}
                  {image.error && (
                    <div className="text-destructive">{image.error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• First image will be used as the cover image</p>
        <p>• Images are automatically compressed for faster loading</p>
        <p>• Drag to reorder images (coming soon)</p>
        {images.length > 0 && (
          <p>• {images.length} of {maxImages} images uploaded</p>
        )}
      </div>
    </div>
  )
}

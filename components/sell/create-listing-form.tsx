'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload, type UploadedImage } from '@/components/ui/image-upload'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Eye } from 'lucide-react'
import type { Tables } from '@/lib/database.types'
import { LocationInterestForm } from '@/components/location-interest-form'

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  categoryId: z.string().uuid('Please select a category'),
  location: z.string().min(1, 'Please select a location'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'parts']),
  startPrice: z.number().min(0.01, 'Starting price must be at least $0.01'),
  reservePrice: z.number().optional(),
  buyNowPrice: z.number().optional(),
  startTime: z.string(),
  endTime: z.string(),
  antiSnipingSeconds: z.number().min(0).max(300).default(30),
})

type ListingFormData = z.infer<typeof listingSchema>

interface CreateListingFormProps {
  categories: Tables<'categories'>[]
  userId: string
}

export function CreateListingForm({ categories, userId }: CreateListingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [listingId, setListingId] = useState<string | null>(null)
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Set default times (start now, end in 7 days)
  const now = new Date()
  const defaultEndTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      startTime: now.toISOString().slice(0, 16),
      endTime: defaultEndTime.toISOString().slice(0, 16),
      antiSnipingSeconds: 30,
      condition: 'good',
      location: 'Squamish, BC',
    },
  })

  const watchedValues = watch()

  // Organize categories into primary and subcategories
  const primaryCategories = categories.filter(cat => cat.parent_id === null)
  const subcategories = categories.filter(cat => cat.parent_id !== null)
  
  // Get subcategories for the selected primary category
  const availableSubcategories = subcategories.filter(
    subcat => subcat.parent_id === selectedPrimaryCategory
  )

  // Create a draft listing first to get an ID for image uploads
  const createDraftListing = async (data: ListingFormData) => {
    if (listingId) return listingId // Already have a draft

    try {
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          title: data.title || 'Draft Listing',
          description: data.description || 'Draft description',
          category_id: data.categoryId || categories[0]?.id,
          location: data.location || 'Squamish, BC',
          condition: data.condition || 'good',
          start_price: data.startPrice || 1,
          start_time: data.startTime || new Date().toISOString(),
          end_time: data.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          owner_id: userId,
          status: 'draft',
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating draft listing:', error)
        throw new Error(`Failed to create draft: ${error.message}`)
      }

      setListingId(listing.id)
      return listing.id
    } catch (error) {
      console.error('Draft creation error:', error)
      throw error
    }
  }

  const onSubmit = async (data: ListingFormData, saveAsDraft = false) => {
    console.log('Form submission started:', { data, saveAsDraft, images: images.length })
    setIsLoading(true)
    setIsDraft(saveAsDraft)

    try {
      // Validate times
      const startTime = new Date(data.startTime)
      const endTime = new Date(data.endTime)
      
      if (endTime <= startTime) {
        toast({
          title: 'Invalid Times',
          description: 'End time must be after start time',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      // Validate prices
      if (data.reservePrice && data.reservePrice < data.startPrice) {
        toast({
          title: 'Invalid Reserve Price',
          description: 'Reserve price must be greater than or equal to starting price',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      if (data.buyNowPrice && data.buyNowPrice <= data.startPrice) {
        toast({
          title: 'Invalid Buy Now Price',
          description: 'Buy Now price must be greater than starting price',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      // Ensure we have a listing ID for image uploads
      let currentListingId = listingId
      if (!currentListingId) {
        try {
          currentListingId = await createDraftListing(data)
        } catch (error) {
          toast({
            title: 'Error Creating Draft',
            description: error instanceof Error ? error.message : 'Failed to create draft listing',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }
      }

      // Update the existing listing or create new one
      const { data: listing, error } = currentListingId 
        ? await supabase
            .from('listings')
            .update({
              title: data.title,
              description: data.description,
              category_id: data.categoryId,
              location: data.location,
              condition: data.condition,
              start_price: data.startPrice,
              reserve_price: data.reservePrice || null,
              buy_now_price: data.buyNowPrice || null,
              start_time: data.startTime,
              end_time: data.endTime,
              anti_sniping_seconds: data.antiSnipingSeconds,
              status: saveAsDraft ? 'draft' : 'live',
              cover_image_url: images.length > 0 ? images[0].path : null,
            })
            .eq('id', currentListingId)
            .select('id')
            .single()
        : await supabase
            .from('listings')
            .insert({
              title: data.title,
              description: data.description,
              category_id: data.categoryId,
              location: data.location,
              condition: data.condition,
              start_price: data.startPrice,
              reserve_price: data.reservePrice || null,
              buy_now_price: data.buyNowPrice || null,
              start_time: data.startTime,
              end_time: data.endTime,
              anti_sniping_seconds: data.antiSnipingSeconds,
              owner_id: userId,
              status: saveAsDraft ? 'draft' : 'live',
              cover_image_url: images.length > 0 ? images[0].path : null,
            })
            .select('id')
            .single()

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      const finalListingId = listing.id || currentListingId

      // Save additional images to listing_images table
      if (images.length > 1) {
        // First, delete existing additional images
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', finalListingId)

        // Insert new additional images
        const imageInserts = images.slice(1).map((image, index) => ({
          listing_id: finalListingId,
          path: image.path!,
          sort_order: index + 1,
        })).filter(img => img.path) // Only include successfully uploaded images

        if (imageInserts.length > 0) {
          const { error: imagesError } = await supabase
            .from('listing_images')
            .insert(imageInserts)

          if (imagesError) {
            console.error('Error saving additional images:', imagesError)
            // Don't fail the entire operation for image errors
          }
        }
      }

      toast({
        title: 'Success',
        description: saveAsDraft 
          ? 'Your listing has been saved as a draft'
          : 'Your listing has been created and is now live',
      })

      // Redirect to the listing or edit page
      if (saveAsDraft) {
        router.push(`/sell/${finalListingId}/edit`)
      } else {
        router.push(`/listing/${finalListingId}`)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsDraft(false)
    }
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your item"
              {...register('title')}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail. Include condition, features, and any relevant information buyers should know."
              className="min-h-[120px]"
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Category Selection - Full Width */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryCategory">Primary Category *</Label>
                <Select 
                  onValueChange={(value) => {
                    setSelectedPrimaryCategory(value)
                    setValue('categoryId', '') // Reset subcategory when primary changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a primary category" />
                  </SelectTrigger>
                <SelectContent>
                  {primaryCategories.length > 0 ? (
                    primaryCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="no-categories">
                      No categories available
                    </SelectItem>
                  )}
                </SelectContent>
                </Select>
              </div>

              {selectedPrimaryCategory && (
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Subcategory *</Label>
                  <Select onValueChange={(value) => setValue('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>
              )}
            </div>
            
            {!selectedPrimaryCategory && errors.categoryId && (
              <p className="text-sm text-destructive">Please select a primary category first</p>
            )}
          </div>

          {/* Location and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select onValueChange={(value) => setValue('location', value)} defaultValue="Squamish, BC">
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Squamish, BC">Squamish, BC</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Can't find your location?</span>
                <LocationInterestForm 
                  userId={userId} 
                  trigger={
                    <button type="button" className="text-primary hover:underline font-medium">
                      Let us know
                    </button>
                  }
                />
                <span>so we can start building the FrothMonkey community around you!</span>
              </div>
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition *</Label>
              <Select onValueChange={(value: any) => setValue('condition', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="parts">For Parts</SelectItem>
                </SelectContent>
              </Select>
              {errors.condition && (
                <p className="text-sm text-destructive">{errors.condition.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startPrice">Starting Price (CAD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="startPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-6"
                  {...register('startPrice', { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
              {errors.startPrice && (
                <p className="text-sm text-destructive">{errors.startPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price (CAD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="reservePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Optional"
                  className="pl-6"
                  {...register('reservePrice', { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum price you'll accept (hidden from bidders until met)
              </p>
              {errors.reservePrice && (
                <p className="text-sm text-destructive">{errors.reservePrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyNowPrice">Buy Now Price (CAD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="buyNowPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Optional"
                  className="pl-6"
                  {...register('buyNowPrice', { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Allow instant purchase at this price
              </p>
              {errors.buyNowPrice && (
                <p className="text-sm text-destructive">{errors.buyNowPrice.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing */}
      <Card>
        <CardHeader>
          <CardTitle>Auction Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register('startTime')}
                disabled={isLoading}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register('endTime')}
                disabled={isLoading}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="antiSnipingSeconds">Anti-Sniping Protection (seconds)</Label>
            <Input
              id="antiSnipingSeconds"
              type="number"
              min="0"
              max="300"
              placeholder="30"
              {...register('antiSnipingSeconds', { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Extend auction by 2 minutes when bids are placed in the final seconds (0-300 seconds)
            </p>
            {errors.antiSnipingSeconds && (
              <p className="text-sm text-destructive">{errors.antiSnipingSeconds.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            listingId={listingId}
            maxImages={10}
            onImagesChange={setImages}
            onCreateDraft={() => createDraftListing(watchedValues as ListingFormData)}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading && !isDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Eye className="mr-2 h-4 w-4" />
            Publish Listing
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading && isDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          * Required fields
        </div>
      </div>

      {/* Preview Section */}
      {watchedValues.title && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{watchedValues.title}</h3>
              {watchedValues.description && (
                <p className="text-sm text-muted-foreground">{watchedValues.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                {watchedValues.startPrice && (
                  <span>Starting: <strong>${watchedValues.startPrice}</strong></span>
                )}
                {watchedValues.reservePrice && (
                  <span>Reserve: <strong>${watchedValues.reservePrice}</strong></span>
                )}
                {watchedValues.buyNowPrice && (
                  <span>Buy Now: <strong>${watchedValues.buyNowPrice}</strong></span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  )
}

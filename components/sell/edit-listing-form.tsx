'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Loader2, Save, Trash2, AlertTriangle } from 'lucide-react'
import type { Tables } from '@/lib/database.types'
import { EditableImageUpload } from '@/components/ui/editable-image-upload'
import { getImageUrl } from '@/lib/utils'

const editListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  categoryId: z.string().uuid('Please select a category'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'parts']),
  startPrice: z.union([
    z.number().min(1, 'Starting price must be at least $1.00').multipleOf(1, 'Starting price must be in full dollars (no cents)'),
    z.literal('').transform(() => undefined)
  ]).optional(),
  reservePrice: z.union([
    z.number().min(1, 'Reserve price must be at least $1.00').multipleOf(1, 'Reserve price must be in full dollars (no cents)'),
    z.literal('').transform(() => undefined)
  ]).optional(),
  buyNowPrice: z.union([
    z.number().min(1, 'Buy now price must be at least $1.00').multipleOf(1, 'Buy now price must be in full dollars (no cents)'),
    z.literal('').transform(() => undefined)
  ]).optional(),
})

type EditListingFormData = z.infer<typeof editListingSchema>

interface EditListingFormProps {
  listing: any // Full listing object with related data
  categories: Tables<'categories'>[]
  userId: string
  hasBids: boolean
}

export function EditListingForm({ listing, categories, userId, hasBids }: EditListingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [images, setImages] = useState<any[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditListingFormData>({
    resolver: zodResolver(editListingSchema),
    defaultValues: {
      title: listing.title,
      description: listing.description || '',
      categoryId: listing.category_id,
      condition: listing.condition,
      startPrice: hasBids ? undefined : listing.start_price,
      reservePrice: listing.reserve_price || undefined,
      buyNowPrice: listing.buy_now_price || undefined,
    },
  })

  const watchedValues = watch()

  // Initialize images from listing data
  useEffect(() => {
    const initialImages = []
    
    // Add cover image first if it exists
    if (listing.cover_image_url) {
      initialImages.push({
        id: 'cover',
        url: getImageUrl(listing.cover_image_url),
        path: listing.cover_image_url,
        sortOrder: 0,
        isCover: true
      })
    }
    
    // Add additional images
    if (listing.listing_images) {
      const additionalImages = listing.listing_images
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((img: any) => ({
          id: img.id,
          url: getImageUrl(img.path),
          path: img.path,
          sortOrder: img.sort_order || 0,
          isCover: false
        }))
      
      initialImages.push(...additionalImages)
    }
    
    setImages(initialImages)
  }, [listing])

  // Organize categories
  const primaryCategories = categories.filter(cat => cat.parent_id === null)
  const subcategories = categories.filter(cat => cat.parent_id !== null)
  
  // Find current category info
  const currentCategory = categories.find(cat => cat.id === listing.category_id)
  const currentPrimaryCategory = currentCategory?.parent_id 
    ? categories.find(cat => cat.id === currentCategory.parent_id)
    : currentCategory
  
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState<string>(
    currentPrimaryCategory?.id || ''
  )
  
  // Get subcategories for the selected primary category
  const availableSubcategories = subcategories.filter(
    subcat => subcat.parent_id === selectedPrimaryCategory
  )

  const onSubmit = async (data: EditListingFormData) => {
    setIsLoading(true)

    try {
      // Validate price changes if bids exist
      if (hasBids) {
        if (data.reservePrice && listing.reserve_price && data.reservePrice > listing.reserve_price) {
          toast({
            title: 'Invalid Reserve Price',
            description: 'Reserve price can only be lowered once bidding has started',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }

        if (data.buyNowPrice && listing.buy_now_price && data.buyNowPrice > listing.buy_now_price) {
          toast({
            title: 'Invalid Buy Now Price',
            description: 'Buy Now price can only be lowered once bidding has started',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }
      }

      // Update the listing
      const updateData: any = {
        title: data.title,
        description: data.description,
        category_id: data.categoryId,
        condition: data.condition,
        updated_at: new Date().toISOString()
      }

      // Only update prices if no bids or if they're being lowered
      if (!hasBids) {
        if (data.startPrice) updateData.start_price = data.startPrice
      }

      if (data.reservePrice !== undefined) {
        updateData.reserve_price = data.reservePrice || null
      }

      if (data.buyNowPrice !== undefined) {
        updateData.buy_now_price = data.buyNowPrice || null
      }

      // Update cover image
      if (images.length > 0) {
        updateData.cover_image_url = images[0].path
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id)

      if (updateError) {
        throw updateError
      }

      // Update additional images
      if (images.length > 1) {
        // Delete existing additional images
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id)

        // Insert new additional images
        const imageInserts = images.slice(1).map((image, index) => ({
          listing_id: listing.id,
          path: image.path,
          sort_order: index + 1,
        }))

        if (imageInserts.length > 0) {
          const { error: imagesError } = await supabase
            .from('listing_images')
            .insert(imageInserts)

          if (imagesError) {
            console.error('Error updating images:', imagesError)
            // Don't fail the entire operation for image errors
          }
        }
      } else {
        // Remove all additional images if only cover image remains
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id)
      }

      toast({
        title: 'Success',
        description: 'Your listing has been updated',
      })

      // Redirect to the listing
      router.push(`/listing/${listing.id}`)
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update listing',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelistListing = async () => {
    if (hasBids) {
      toast({
        title: 'Cannot Delete',
        description: 'Listings with bids cannot be deleted',
        variant: 'destructive',
      })
      return
    }

    setIsDeleting(true)

    try {
      // Delete listing images from storage and database
      if (images.length > 0) {
        // Delete from storage
        const imagePaths = images.filter(img => img.path).map(img => img.path)
        if (imagePaths.length > 0) {
          await supabase.storage
            .from('listing-images')
            .remove(imagePaths)
        }

        // Delete from listing_images table
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id)
      }

      // Delete the listing
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id)

      if (error) {
        throw error
      }

      toast({
        title: 'Listing Deleted',
        description: 'Your listing has been removed',
      })

      router.push('/account/listings')
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Status Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={listing.status === 'live' ? 'default' : 'outline'}>
                  {listing.status}
                </Badge>
                {hasBids && (
                  <Badge variant="secondary">
                    {listing.bids.length} bid{listing.bids.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasBids 
                  ? 'Bidding has started. Some editing restrictions apply.'
                  : 'No bids yet. You can edit all aspects of this listing.'
                }
              </p>
            </div>
            
            {!hasBids && listing.status !== 'ended' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Listing
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this listing? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelistListing}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete Listing
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                placeholder="Describe your item in detail..."
                className="min-h-[120px]"
                {...register('description')}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Category *</Label>
                  <Select 
                    value={selectedPrimaryCategory}
                    onValueChange={(value) => {
                      setSelectedPrimaryCategory(value)
                      setValue('categoryId', '') // Reset subcategory when primary changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a primary category" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPrimaryCategory && (
                  <div className="space-y-2">
                    <Label>Subcategory *</Label>
                    <Select 
                      value={watchedValues.categoryId} 
                      onValueChange={(value) => setValue('categoryId', value)}
                    >
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
            </div>

            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select 
                value={watchedValues.condition} 
                onValueChange={(value: any) => setValue('condition', value)}
              >
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
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            {hasBids && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Price restrictions apply - Reserve and Buy Now can only be lowered
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!hasBids && (
                <div className="space-y-2">
                  <Label htmlFor="startPrice">Starting Price (CAD) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="startPrice"
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1"
                      className="pl-6"
                      {...register('startPrice', { 
                        setValueAs: (value) => value === '' ? undefined : Number(value)
                      })}
                      disabled={isLoading || hasBids}
                    />
                  </div>
                  {errors.startPrice && (
                    <p className="text-sm text-destructive">{errors.startPrice.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reservePrice">Reserve Price (CAD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="reservePrice"
                    type="number"
                    step="1"
                    min="1"
                    max={hasBids && listing.reserve_price ? listing.reserve_price : undefined}
                    placeholder={hasBids ? "Can only be lowered" : "Optional"}
                    className="pl-6"
                    {...register('reservePrice', { 
                      setValueAs: (value) => value === '' ? undefined : Number(value)
                    })}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasBids && listing.reserve_price
                    ? `Current: $${listing.reserve_price} (can only be lowered)`
                    : 'Minimum price you\'ll accept (hidden from bidders until met)'
                  }
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
                    step="1"
                    min="1"
                    max={hasBids && listing.buy_now_price ? listing.buy_now_price : undefined}
                    placeholder={hasBids ? "Can only be lowered" : "Optional"}
                    className="pl-6"
                    {...register('buyNowPrice', { 
                      setValueAs: (value) => value === '' ? undefined : Number(value)
                    })}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasBids && listing.buy_now_price
                    ? `Current: $${listing.buy_now_price} (can only be lowered)`
                    : 'Allow instant purchase at this price'
                  }
                </p>
                {errors.buyNowPrice && (
                  <p className="text-sm text-destructive">{errors.buyNowPrice.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableImageUpload
              listingId={listing.id}
              initialImages={images}
              maxImages={10}
              onImagesChange={setImages}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/listing/${listing.id}`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

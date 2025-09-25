'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload, type UploadedImage } from '@/components/ui/image-upload'
import { AlertTriangle, Info, Save } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { getImageUrl } from '@/lib/utils'

interface EditListingFormProps {
  listing: {
    id: string
    title: string
    description: string
    category_id: string
    start_price: number
    reserve_price: number
    buy_now_enabled: boolean
    buy_now_price: number
    end_time: string
    status: string
    cover_image_url: string
    listing_images: Array<{
      id: string
      path: string
      sort_order: number
    }>
    categories: {
      id: string
      name: string
      parent_id?: string
    }
  }
  categories: Array<{
    id: string
    name: string
    parent_id?: string
  }>
  editPermissions: {
    canEdit: boolean
    canEditPhotos: boolean
    canEditText: boolean
    canEditCategory: boolean
    canEditStartPrice: boolean
    canEditReservePrice: boolean
    canEditBuyNowPrice: boolean
    canEditEndTime: boolean
    reason?: string
  }
}

export function EditListingForm({ listing, categories, editPermissions }: EditListingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState(listing.title || '')
  const [description, setDescription] = useState(listing.description || '')
  const [categoryId, setCategoryId] = useState(listing.category_id || '')
  const [startPrice, setStartPrice] = useState(listing.start_price?.toString() || '')
  const [reservePrice, setReservePrice] = useState(listing.reserve_price?.toString() || '')
  const [buyNowEnabled, setBuyNowEnabled] = useState(listing.buy_now_enabled || false)
  const [buyNowPrice, setBuyNowPrice] = useState(listing.buy_now_price?.toString() || '')
  const [endTime, setEndTime] = useState(
    listing.end_time ? new Date(listing.end_time).toISOString().slice(0, 16) : ''
  )
  const [images, setImages] = useState<UploadedImage[]>(() => {
    const allImages: UploadedImage[] = []
    
    // Use the getImageUrl utility function
    
    // Add cover image first
    if (listing.cover_image_url) {
      allImages.push({ 
        id: 'cover', 
        url: getImageUrl(listing.cover_image_url),
        path: listing.cover_image_url
      })
    }
    
    // Add additional images
    if (listing.listing_images) {
      const sortedImages = [...listing.listing_images]
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .filter(img => img.path !== listing.cover_image_url) // Avoid duplicates
      
      allImages.push(...sortedImages.map(img => ({
        id: img.id,
        url: getImageUrl(img.path),
        path: img.path
      })))
    }
    
    return allImages
  })
  
  // Get parent categories for category selection
  const parentCategories = categories.filter(cat => !cat.parent_id)
  const selectedParentCategory = categories.find(cat => cat.id === categoryId)?.parent_id
  const subcategories = categories.filter(cat => cat.parent_id === selectedParentCategory)
  
  // Get current listing's bid status info
  const isLiveAuction = listing.status === 'live'
  const hasBidsPlaced = !editPermissions.canEditStartPrice // Inferred from permissions
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Prepare update data
      const updateData: any = {}
      
      // Always updatable fields (if permissions allow)
      if (editPermissions.canEditText) {
        updateData.title = title
        updateData.description = description
      }
      
      if (editPermissions.canEditCategory) {
        updateData.category_id = categoryId
      }
      
      if (editPermissions.canEditEndTime) {
        updateData.end_time = new Date(endTime).toISOString()
      }
      
      // Price fields with restrictions
      if (editPermissions.canEditStartPrice) {
        updateData.start_price = parseFloat(startPrice)
      }
      
      if (editPermissions.canEditReservePrice) {
        const newReservePrice = parseFloat(reservePrice)
        if (hasBidsPlaced && newReservePrice > listing.reserve_price) {
          throw new Error('Cannot increase reserve price when bids have been placed')
        }
        updateData.reserve_price = newReservePrice
      }
      
      if (editPermissions.canEditBuyNowPrice) {
        // Note: buy_now_enabled is a generated column based on buy_now_price IS NOT NULL
        // We should not try to update it directly, only update buy_now_price
        if (buyNowEnabled) {
          const newBuyNowPrice = parseFloat(buyNowPrice)
          if (hasBidsPlaced && newBuyNowPrice > listing.buy_now_price) {
            throw new Error('Cannot increase Buy Now price when bids have been placed')
          }
          updateData.buy_now_price = newBuyNowPrice
        } else {
          // If buy now is disabled, set price to null (which will make buy_now_enabled false)
          updateData.buy_now_price = null
        }
      }
      
      // Update listing
      const { error: listingError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id)
      
      if (listingError) throw listingError
      
      // Handle images if permissions allow
      if (editPermissions.canEditPhotos) {
        // Set cover image (first image in array)
        const coverImagePath = images.length > 0 ? images[0].path : null
        
        if (coverImagePath !== listing.cover_image_url) {
          const { error: coverError } = await supabase
            .from('listings')
            .update({ cover_image_url: coverImagePath })
            .eq('id', listing.id)
          
          if (coverError) throw coverError
        }
        
        // Delete existing additional images
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id)
        
        // Insert new additional images (excluding cover image and duplicates)
        if (images.length > 0) {
          const seenPaths = new Set()
          const imageInserts = images.map((image, index) => ({
            listing_id: listing.id,
            path: image.path || image.url.split('/listing-images/')[1], // Handle both path and url
            sort_order: index,
          })).filter(img => {
            if (!img.path) return false
            if (img.path === coverImagePath) return false // Exclude cover image
            if (seenPaths.has(img.path)) return false // Exclude duplicates
            seenPaths.add(img.path)
            return true
          })
          
          if (imageInserts.length > 0) {
            const { error: imagesError } = await supabase
              .from('listing_images')
              .insert(imageInserts)
            
            if (imagesError) throw imagesError
          }
        }
      }
      
      toast({
        title: 'Listing updated successfully',
        description: 'Your changes have been saved.',
      })
      
      router.push(`/listing/${listing.id}`)
      
    } catch (error: any) {
      console.error('Error updating listing:', error)
      toast({
        title: 'Error updating listing',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning for live auctions */}
      {isLiveAuction && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This is a live auction. Some editing options may be restricted based on bid activity.
            {hasBidsPlaced && ' Bids have been placed on this item.'}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos" disabled={!editPermissions.canEditPhotos}>Photos</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="timing" disabled={!editPermissions.canEditEndTime}>Timing</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
              <CardDescription>
                {editPermissions.canEditText 
                  ? 'Update your listing title, description, and category'
                  : 'View listing details (editing restricted)'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!editPermissions.canEditText}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!editPermissions.canEditText}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={categoryId} 
                  onValueChange={setCategoryId}
                  disabled={!editPermissions.canEditCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map((parent) => [
                      <SelectItem key={`parent-${parent.id}`} value={`parent-${parent.id}`} disabled className="font-semibold">
                        {parent.name}
                      </SelectItem>,
                      ...categories
                        .filter(cat => cat.parent_id === parent.id)
                        .map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            → {subcategory.name}
                          </SelectItem>
                        ))
                    ])}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Add, remove, or reorder your listing photos. The first photo will be the main image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                listingId={listing.id}
                maxImages={10}
                onImagesChange={setImages}
                disabled={!editPermissions.canEditPhotos}
                initialImages={images}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set your auction prices. Some restrictions apply for live auctions with bids.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startPrice">Start Price ($)</Label>
                <Input
                  id="startPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={startPrice}
                  onChange={(e) => setStartPrice(e.target.value)}
                  disabled={!editPermissions.canEditStartPrice}
                  required
                />
                {!editPermissions.canEditStartPrice && hasBidsPlaced && (
                  <p className="text-sm text-muted-foreground">
                    Cannot change start price after bids have been placed
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reservePrice">Reserve Price ($)</Label>
                <Input
                  id="reservePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  disabled={!editPermissions.canEditReservePrice}
                />
                {hasBidsPlaced && editPermissions.canEditReservePrice && (
                  <p className="text-sm text-muted-foreground">
                    Can only lower reserve price when bids have been placed
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="buyNowEnabled"
                  checked={buyNowEnabled}
                  onCheckedChange={setBuyNowEnabled}
                  disabled={!editPermissions.canEditBuyNowPrice}
                />
                <Label htmlFor="buyNowEnabled">Enable Buy Now</Label>
              </div>
              
              {buyNowEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="buyNowPrice">Buy Now Price ($)</Label>
                  <Input
                    id="buyNowPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyNowPrice}
                    onChange={(e) => setBuyNowPrice(e.target.value)}
                    disabled={!editPermissions.canEditBuyNowPrice}
                    required={buyNowEnabled}
                  />
                  {hasBidsPlaced && editPermissions.canEditBuyNowPrice && (
                    <p className="text-sm text-muted-foreground">
                      Can only lower Buy Now price when bids have been placed
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auction Timing</CardTitle>
              <CardDescription>
                Adjust when your auction ends.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!editPermissions.canEditEndTime}
                  required
                />
                {!editPermissions.canEditEndTime && hasBidsPlaced && (
                  <p className="text-sm text-muted-foreground">
                    Cannot change end time after bids have been placed
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

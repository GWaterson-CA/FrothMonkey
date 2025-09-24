'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface Listing {
  id: string
  title: string
  description: string | null
  status: string
  current_price: number
  start_price: number
  created_at: string
  end_time: string
  owner: {
    id: string
    username: string | null
    full_name: string | null
  }
}

const statusColors = {
  draft: 'default',
  scheduled: 'secondary',
  live: 'default',
  ended: 'outline',
  cancelled: 'destructive',
  sold: 'default'
} as const

export function ListingsManagement() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
  const { toast } = useToast()

  const fetchListings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/listings')
      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }
      const data = await response.json()
      setListings(data)
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch listings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteListing = async (listing: Listing) => {
    setDeleteLoading(listing.id)
    try {
      const response = await fetch(`/api/admin/listings?id=${listing.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete listing')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'Listing Deleted',
          description: `Successfully deleted "${result.listing_title}" and ${result.deleted_bids} associated bids`
        })
        fetchListings() // Refresh the list
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive'
      })
    } finally {
      setDeleteLoading(null)
      setListingToDelete(null)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  if (loading) {
    return <div>Loading listings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Listings ({listings.length})</h2>
        </div>
        <Button variant="outline" onClick={fetchListings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-lg">{listing.title}</h3>
                    <Badge variant={statusColors[listing.status as keyof typeof statusColors] || 'default'}>
                      {listing.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {listing.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Owner:</span>{' '}
                      @{listing.owner?.username || 'Unknown'}
                    </div>
                    <div>
                      <span className="text-gray-500">Current Price:</span>{' '}
                      ${listing.current_price.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-500">Start Price:</span>{' '}
                      ${listing.start_price.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>{' '}
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {listing.status === 'live' && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Ends:</span>{' '}
                      {new Date(listing.end_time).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/listing/${listing.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setListingToDelete(listing)}
                    disabled={deleteLoading === listing.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={listingToDelete !== null} onOpenChange={() => setListingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the listing "{listingToDelete?.title}" 
              and all associated bids and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listingToDelete && handleDeleteListing(listingToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Listing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

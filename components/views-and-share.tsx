'use client'

import { Eye } from 'lucide-react'
import { ShareButton } from '@/components/share-button'

interface ViewsAndShareProps {
  viewCount: number
  listingId: string
  title?: string
}

export function ViewsAndShare({ viewCount, listingId, title }: ViewsAndShareProps) {
  return (
    <div className="flex items-center justify-between py-4 border-t">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Eye className="h-4 w-4" />
        <span>
          {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
        </span>
      </div>
      <ShareButton 
        listingId={listingId}
        title={title}
        size="sm"
        variant="outline"
      />
    </div>
  )
}


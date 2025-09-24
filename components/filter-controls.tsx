'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Filter, X } from 'lucide-react'

interface FilterControlsProps {
  currentCategory?: string
  currentSubcategory?: string
}

export function FilterControls({ currentCategory, currentSubcategory }: FilterControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [filterBy, setFilterBy] = useState(searchParams.get('filter') || 'all')
  const [priceMin, setPriceMin] = useState(searchParams.get('price_min') || '')
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or remove parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Build the new URL
    const basePath = currentSubcategory 
      ? `/${currentCategory}/${currentSubcategory}`
      : currentCategory 
        ? `/${currentCategory}`
        : '/'
    
    const queryString = params.toString()
    const newURL = queryString ? `${basePath}?${queryString}` : basePath
    
    router.push(newURL)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL({ q: searchQuery })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateURL({ sort: value })
  }

  const handleFilterChange = (value: string) => {
    setFilterBy(value)
    updateURL({ filter: value })
  }

  const handlePriceFilter = () => {
    updateURL({ 
      price_min: priceMin,
      price_max: priceMax
    })
  }

  const handleConditionChange = (value: string) => {
    setCondition(value)
    updateURL({ condition: value })
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateURL({ status: value })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSortBy('newest')
    setFilterBy('all')
    setPriceMin('')
    setPriceMax('')
    setCondition('all')
    setStatus('all')
    
    // Clear all URL parameters except category
    const basePath = currentSubcategory 
      ? `/${currentCategory}/${currentSubcategory}`
      : currentCategory 
        ? `/${currentCategory}`
        : '/'
    
    router.push(basePath)
  }

  const hasActiveFilters = searchQuery || sortBy !== 'newest' || filterBy !== 'all' || 
                          priceMin || priceMax || condition !== 'all' || status !== 'all'

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sort By */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="most-bids">Most Bids</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter By */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <Select value={filterBy} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Auctions</SelectItem>
              <SelectItem value="live">Live Only</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="reserve-met">Reserve Met</SelectItem>
              <SelectItem value="buy-now">Buy Now Available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Price:</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-20"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-20"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handlePriceFilter}
              disabled={!priceMin && !priceMax}
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Condition */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Condition:</label>
          <Select value={condition} onValueChange={handleConditionChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like_new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="parts">For Parts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}

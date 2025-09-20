'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, Crown, RefreshCw, Star, AlertTriangle, DollarSign, Package, Gavel, Mail } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface User {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  email: string | null
  total_listings: number
  active_listings: number
  sold_listings: number
  total_sales_value: number
  total_bids_placed: number
  total_bid_value: number
  times_reported: number
  average_rating: number
  review_count: number
  last_active: string
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { toast } = useToast()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    setDeleteLoading(user.id)
    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'User Deleted',
          description: `Successfully deleted user and ${result.deleted_listings} listings, ${result.deleted_bids} bids`
        })
        fetchUsers() // Refresh the list
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      })
    } finally {
      setDeleteLoading(null)
      setUserToDelete(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Users ({users.length})</h2>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header Section */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">
                          {user.full_name || user.username || 'Unnamed User'}
                        </h3>
                        {user.is_admin && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Admin
                          </Badge>
                        )}
                        {user.times_reported > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {user.times_reported} Report{user.times_reported !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">@{user.username || 'no-username'}</p>
                      {user.email && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setUserToDelete(user)}
                      disabled={deleteLoading === user.id || user.is_admin}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                  {/* Listings Stats */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Listings</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-blue-900">{user.total_listings}</div>
                      <div className="text-xs text-blue-600">
                        {user.active_listings} active • {user.sold_listings} sold
                      </div>
                    </div>
                  </div>

                  {/* Sales Stats */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Sales Value</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-900">
                        ${user.total_sales_value.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600">
                        {user.sold_listings > 0 ? 
                          `Avg: $${Math.round(user.total_sales_value / user.sold_listings).toLocaleString()}` : 
                          'No sales yet'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Bidding Stats */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Bids Placed</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-purple-900">{user.total_bids_placed}</div>
                      <div className="text-xs text-purple-600">
                        Value: ${user.total_bid_value.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stats */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Rating</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-yellow-900">
                          {user.review_count > 0 ? user.average_rating.toFixed(1) : 'N/A'}
                        </span>
                        {user.review_count > 0 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="text-xs text-yellow-600">
                        {user.review_count} review{user.review_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Activity</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(user.last_active).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                {(user.times_reported > 0 || user.average_rating < 3) && (
                  <div className="flex gap-2 pt-2 border-t">
                    {user.times_reported > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {user.times_reported} Active Report{user.times_reported !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {user.average_rating < 3 && user.review_count > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1 text-orange-700 border-orange-300">
                        <Star className="w-3 h-3" />
                        Low Rating ({user.average_rating.toFixed(1)}/5)
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{userToDelete?.full_name || userToDelete?.username}" 
              and all of their listings, bids, and related data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

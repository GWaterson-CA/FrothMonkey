'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, Crown, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface User {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
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

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {user.full_name || user.username || 'Unnamed User'}
                      </h3>
                      {user.is_admin && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">@{user.username || 'no-username'}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
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

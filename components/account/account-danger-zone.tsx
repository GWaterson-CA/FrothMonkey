'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Trash2, LogOut, AlertTriangle } from 'lucide-react'

export function AccountDangerZone() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    
    try {
      await supabase.auth.signOut()
      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully',
      })
      router.push('/')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      // In a real application, you would call an API endpoint to delete the account
      // This would involve deleting all user data, listings, bids, etc.
      // For now, we'll just show a placeholder
      
      toast({
        title: 'Account Deletion',
        description: 'Account deletion is not implemented yet. Please contact support.',
        variant: 'destructive',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Irreversible and destructive actions.
        </p>
      </div>

      <div className="space-y-4 border border-destructive/20 rounded-lg p-4">
        {/* Sign Out */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Sign Out</h4>
            <p className="text-sm text-muted-foreground">
              Sign out of your account on this device
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="border-t border-destructive/20 pt-4">
          {/* Delete Account */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Account
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Are you absolutely sure you want to delete your account? 
                      This action cannot be undone.
                    </p>
                    <p>
                      This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your profile and personal information</li>
                      <li>All your auction listings</li>
                      <li>Your bid history</li>
                      <li>Your watchlist</li>
                      <li>All associated images and files</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="font-medium mb-2">⚠️ Account Deletion Not Yet Implemented</p>
        <p>
          Account deletion functionality is currently under development. 
          For now, please contact support if you need to delete your account.
          This will be implemented with proper data cleanup and confirmation flows.
        </p>
      </div>
    </div>
  )
}

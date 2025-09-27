import { Metadata } from 'next'
import { SetupProfileForm } from '@/components/auth/setup-profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/auth'
import { Gavel } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Setup Profile | FrothMonkey',
  description: 'Complete your FrothMonkey profile',
}

export default async function SetupProfilePage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Image 
            src="/FrothMonkey Logo Blue.png" 
            alt="FrothMonkey Logo" 
            width={160} 
            height={160}
            className="h-12 w-auto"
            quality={100}
          />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">
              Choose a username and add your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetupProfileForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

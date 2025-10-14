import { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Reset Password | FrothMonkey',
  description: 'Create a new password for your FrothMonkey account',
  alternates: {
    canonical: 'https://www.frothmonkey.com/auth/reset-password',
  },
}

export default function ResetPasswordPage() {
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
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



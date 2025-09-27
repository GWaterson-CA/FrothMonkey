import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Gavel } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sign Up | FrothMonkey',
  description: 'Create your FrothMonkey account',
}

export default function RegisterPage() {
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
            <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Create an account to start buying and selling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

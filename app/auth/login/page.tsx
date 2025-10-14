import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Gavel } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sign In | FrothMonkey',
  description: 'Sign in to your FrothMonkey account',
  alternates: {
    canonical: 'https://www.frothmonkey.com/auth/login',
  },
}

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const registerUrl = searchParams.redirect 
    ? `/auth/register?redirect=${encodeURIComponent(searchParams.redirect)}`
    : '/auth/register'

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
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link href={registerUrl} className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

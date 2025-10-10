import { requireAdmin } from '@/lib/auth'
import { EmailTestInterface } from '@/components/admin/email-test-interface'

export default async function EmailTestPage() {
  // This will redirect to home if not admin
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Email Notification Testing</h1>
        <p className="text-gray-600 mt-2">
          Test email notifications to verify the email system is working correctly
        </p>
      </div>
      
      <EmailTestInterface />
    </div>
  )
}


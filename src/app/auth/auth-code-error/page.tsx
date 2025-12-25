"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const code = searchParams.get("code")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Authentication Error</h1>
          <p className="text-muted-foreground">
            We encountered an issue while signing you in.
          </p>
        </div>

        <div className="w-full rounded-lg border bg-card p-4 text-left shadow-sm">
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Error Details</div>
          <code className="block w-full overflow-x-auto rounded bg-muted p-2 text-sm font-mono">
            {error || "Unknown error occurred"}
          </code>
          {code && (
             <div className="mt-2">
               <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Error Code</div>
               <code className="block w-full overflow-x-auto rounded bg-muted p-2 text-sm font-mono">
                 {code}
               </code>
             </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/login">Back to Login</Link>
          </Button>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}

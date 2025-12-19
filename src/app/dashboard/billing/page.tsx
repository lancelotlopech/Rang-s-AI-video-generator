import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard, Zap } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Billing & Credits</h2>
        <p className="text-muted-foreground">
          Manage your subscription and credit balance.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <CardDescription>For trying out the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 10 Credits / month</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Standard Speed</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Public Gallery</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>Current Plan</Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-violet-500 shadow-lg shadow-violet-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-violet-500 text-white text-xs px-3 py-1 rounded-bl-lg">
            POPULAR
          </div>
          <CardHeader>
            <CardTitle>Pro Creator</CardTitle>
            <CardDescription>For serious designers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-violet-500" /> 1000 Credits / month</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-violet-500" /> Fast Generation</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-violet-500" /> Private Gallery</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-violet-500" /> Priority Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-violet-600 hover:bg-violet-700">Upgrade to Pro</Button>
          </CardFooter>
        </Card>

        {/* Credit Pack */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Pack</CardTitle>
            <CardDescription>Pay as you go</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$10<span className="text-sm font-normal text-muted-foreground">/one-time</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><Zap className="mr-2 h-4 w-4 text-orange-500" /> 500 Credits</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Never Expire</li>
              <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Use on any tool</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full">Buy Credits</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

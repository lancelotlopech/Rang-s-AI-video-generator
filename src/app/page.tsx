import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container flex flex-col items-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Foxio Design
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
            Premium AI Design Tools for Screenshots, Icons, and Ad Videos.
          </p>
        </div>
        <div className="space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-white border-gray-700 hover:bg-gray-800">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

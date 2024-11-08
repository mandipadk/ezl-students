import Link from 'next/link';
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton
  } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Circle } from "lucide-react"

export default function NavBar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Circle className="h-5 w-5 fill-[#FF5733] text-[#FF5733]" />
          <span className="text-2xl font-semibold">Fluentite</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-md text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <SignedOut>
          <Button
              asChild
              className="bg-black hover:bg-gray-800 text-white text-md px-4 py-2 rounded-full"
            >
              <SignInButton />
            </Button>
            
          </SignedOut>
          <SignedIn>
            <UserButton />
            <Button
              asChild
              className="bg-black hover:bg-gray-800 text-white text-md px-4 py-2 rounded-full"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}

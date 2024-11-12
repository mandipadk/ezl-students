"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Circle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NavBar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking user session:", error);
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(!!data.session);
      }
    };

    checkUserSession();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
      } else {
        setIsLoggedIn(false);
        router.push('/');
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
    }
  };

  return (
    <header className="border-b">
      <nav className="flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 ml-0">
          <Image src="/favicon.png" alt="ezl" width={50} height={50} />
        </Link>
        <div className="flex items-center gap-6 mr-0">
          <Link href="/" className="text-lg text-gray-800 hover:text-gray-900 transition-colors duration-300 ease-in-out transform hover:scale-105">
            <span className="px-2 py-2 rounded-md bg-transparent">
              Home
            </span>
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
            {isLoggedIn && (
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
            )}
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}

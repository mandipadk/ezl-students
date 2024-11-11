import type { Metadata } from "next";
import localFont from "next/font/local";
import { Manrope } from 'next/font/google';
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import NavBar from "@/app/components/NavBar"
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "ezl",
  description: "AI producitivy app for students",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" 
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      suppressHydrationWarning>
          <body className="min-h-[100dvh] bg-gray-50">
            <NavBar />
            {children}
            <Toaster 
              position="bottom-right"
              expand={true}
              richColors
              closeButton
              toastOptions={{
                style: {
                  padding: '16px',
                  paddingRight: '24px',
                  minWidth: '400px',
                  fontSize: '1rem',
                },
                duration: 5000,
              }}
            />
          </body>
        </html>
    </ClerkProvider>
  )
}
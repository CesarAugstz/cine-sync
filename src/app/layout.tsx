import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GialloFilms',
  description: 'Unlimited movies, TV shows, and more. Watch anywhere.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <Toaster richColors position="top-center" duration={1500} />
      <body className={inter.className}>{children}</body>
    </html>
  )
}

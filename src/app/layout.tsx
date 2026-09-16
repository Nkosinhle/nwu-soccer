import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'NWU Soccer Institute | Player Management System',
  description: 'North-West University Soccer Institute — Player Management System',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#4B0082',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="bg-slate-50 font-body antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1a0030', color: '#fff', border: '1px solid #4B0082' },
              success: { iconTheme: { primary: '#a855f7', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

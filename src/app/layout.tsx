import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'In Memory of Daniel Naroditsky',
  description:
    'A memorial board to honor the life and legacy of Daniel Naroditsky (Danya). Share your words, gratitude, and remembrance.',
  openGraph: {
    title: 'In Memory of Daniel Naroditsky',
    description: 'A place to share words, gratitude, and remembrance.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen relative">{children}</body>
    </html>
  )
}

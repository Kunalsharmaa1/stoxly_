import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stoxly — Stock Analysis & Trading Signals',
  description: 'Stock analysis, AI intelligence, strategy backtesting and portfolio tracking for NSE-listed stocks.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

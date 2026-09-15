'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import StockResearch from '@/screens/StockResearch'
import { useAppNavigate } from '@/lib/useAppNavigate'

function StockContent() {
  const navigate = useAppNavigate()
  const searchParams = useSearchParams()

  const symbol = searchParams.get('symbol') || 'RELIANCE'
  const instrumentKey =
    searchParams.get('instrument_key') || 'NSE_EQ|INE002A01018'

  return (
    <StockResearch
      onNavigate={navigate}
      symbol={symbol}
      instrumentKey={instrumentKey}
    />
  )
}

export default function StockPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, color: 'var(--text-muted)' }}>
          Loading stock data...
        </div>
      }
    >
      <StockContent />
    </Suspense>
  )
}
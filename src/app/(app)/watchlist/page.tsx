'use client'

import Watchlist from '@/screens/Watchlist'
import { useAppNavigate } from '@/lib/useAppNavigate'

export default function WatchlistPage() {
  const navigate = useAppNavigate()
  return <Watchlist onNavigate={navigate} />
}

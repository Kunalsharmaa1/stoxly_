'use client'

import BacktestHistory from '@/screens/BacktestHistory'
import { useAppNavigate } from '@/lib/useAppNavigate'

export default function HistoryPage() {
  const navigate = useAppNavigate()
  return <BacktestHistory onNavigate={navigate} />
}

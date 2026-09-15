'use client'

import BacktestResults from '@/screens/BacktestResults'
import { useAppNavigate } from '@/lib/useAppNavigate'

export default function BacktestPage() {
  const navigate = useAppNavigate()
  return <BacktestResults onNavigate={navigate} />
}

'use client'

import StrategyLab from '@/screens/StrategyLab'
import { useAppNavigate } from '@/lib/useAppNavigate'

export default function StrategyPage() {
  const navigate = useAppNavigate()
  return <StrategyLab onNavigate={navigate} />
}

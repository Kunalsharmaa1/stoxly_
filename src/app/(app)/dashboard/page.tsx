'use client'

import Dashboard from '@/screens/Dashboard'
import { useAppNavigate } from '@/lib/useAppNavigate'

export default function DashboardPage() {
  const navigate = useAppNavigate()
  return <Dashboard onNavigate={navigate} />
}

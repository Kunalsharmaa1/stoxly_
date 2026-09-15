'use client'

import Login from '@/screens/Login'
import { useAppNavigate } from '@/lib/useAppNavigate'

export default function LoginPage() {
  const navigate = useAppNavigate()
  return <Login onNavigate={navigate} />
}

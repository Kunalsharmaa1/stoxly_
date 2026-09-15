'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { Screen } from '@/types'
import { screenToPath } from './navigation'

/**
 * Returns a `navigate(screen)` function with the same signature as the
 * original Figma/Vite prototype's `onNavigate` prop, but backed by real
 * Next.js App Router navigation instead of local component state.
 */
export function useAppNavigate() {
  const router = useRouter()

  return useCallback(
    (screen: Screen) => {
      router.push(screenToPath[screen])
    },
    [router]
  )
}

import type { Screen } from '@/types'

export const screenToPath: Record<Screen, string> = {
  login: '/login',
  dashboard: '/dashboard',
  stock: '/stock',
  ai: '/ai',
  watchlist: '/watchlist',
  strategy: '/strategy',
  backtest: '/backtest',
  history: '/history',
  portfolio: '/portfolio',
  settings: '/settings',
}

const pathToScreenMap: Record<string, Screen> = Object.entries(screenToPath).reduce(
  (acc, [screen, path]) => {
    acc[path] = screen as Screen
    return acc
  },
  {} as Record<string, Screen>
)

export function pathToScreen(pathname: string): Screen {
  return pathToScreenMap[pathname] ?? 'dashboard'
}

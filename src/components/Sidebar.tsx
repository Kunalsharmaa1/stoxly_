'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Screen } from '@/types'
import { screenToPath } from '@/lib/navigation'
import BrandLogo from '@/components/BrandLogo'

const NavItem = ({ label, screen, current, icon }: {
  label: string; screen: Screen; current: Screen; icon: string
}) => {
  const active = current === screen
  return (
    <Link
      href={screenToPath[screen]}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '7px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
        color: active ? 'var(--green)' : 'var(--text-secondary)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'background 0.15s, color 0.15s', fontFamily: 'inherit',
        textAlign: 'left', textDecoration: 'none',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)' }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </Link>
  )
}

const SectionLabel = ({ label }: { label: string }) => (
  <div style={{ padding: '12px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
    {label}
  </div>
)

export default function Sidebar() {
  const pathname = usePathname()
  const current = (Object.keys(screenToPath) as Screen[]).find(
    s => screenToPath[s] === pathname
  ) ?? 'dashboard'

  return (
    <aside style={{
      width: 220, minWidth: 220, background: 'var(--bg-elevated)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <BrandLogo iconSize={28} wordmarkSize={16} gap={8} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        <NavItem label="Dashboard" screen="dashboard" current={current} icon="⊞" />

        <SectionLabel label="Research" />
        <NavItem label="Stock Analysis" screen="stock" current={current} icon="📊" />
        <NavItem label="AI Intelligence" screen="ai" current={current} icon="✦" />
        <NavItem label="Watchlist" screen="watchlist" current={current} icon="★" />

        <SectionLabel label="Strategy Lab" />
        <NavItem label="Strategy Builder" screen="strategy" current={current} icon="⚙" />
        <NavItem label="Backtester" screen="backtest" current={current} icon="▶" />
        <NavItem label="Backtest History" screen="history" current={current} icon="⏱" />

        <div style={{ marginTop: 4 }} />
        <NavItem label="Portfolio" screen="portfolio" current={current} icon="◈" />
      </nav>

      {/* User profile */}
      <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>K</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kunal Sharma</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Plan</div>
        </div>
        <Link href="/settings" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, textDecoration: 'none' }}>⚙</Link>
      </div>
    </aside>
  )
}

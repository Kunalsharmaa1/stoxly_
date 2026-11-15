'use client'

import { useState } from 'react'
import type { Screen } from '@/types'
import BrandLogo from '@/components/BrandLogo'

interface Props { onNavigate: (s: Screen) => void }

export default function Login({ onNavigate }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.35,
      }} />
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left: branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative' }}>
        <div style={{ marginBottom: 40 }}>
          <BrandLogo iconSize={36} wordmarkSize={22} gap={10} />
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--text-primary)', maxWidth: 480 }}>
          Quantitative research. AI-powered intelligence.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.7, maxWidth: 420 }}>
          The serious platform for Indian market research, strategy backtesting, and AI-driven pattern analysis.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
          {['ML Pattern Recognition', 'Strategy Backtester', 'Historical Analysis', 'Explainable AI', 'Indian Market Data'].map(f => (
            <span key={f} style={{ fontSize: 11, padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-secondary)' }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div style={{ width: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative' }}>
        <div className="card" style={{ width: '100%', padding: 32 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
            {(['login', 'signup'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: tab === t ? 600 : 400, fontSize: 14,
                borderBottom: `2px solid ${tab === t ? 'var(--green)' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                marginBottom: -1,
              }}>{t === 'login' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>

          {tab === 'login' ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>Email Address</div>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="label">Password</span>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: 0, color: 'var(--ai)' }}>Forgot password?</button>
                </div>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width: '100%' }} />
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 14 }} onClick={() => onNavigate('dashboard')}>
                Sign In →
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <button className="btn-secondary" style={{ width: '100%', padding: '9px 0', fontSize: 13 }}>
                <span style={{ marginRight: 6 }}>G</span> Continue with Google
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>Full Name</div>
                <input placeholder="Kunal Sharma" style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>Email Address</div>
                <input type="email" placeholder="you@example.com" style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 6 }}>Password</div>
                <input type="password" placeholder="Create a strong password" style={{ width: '100%' }} />
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 14 }} onClick={() => onNavigate('dashboard')}>
                Create Account →
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <button className="btn-secondary" style={{ width: '100%', padding: '9px 0', fontSize: 13 }}>
                <span style={{ marginRight: 6 }}>G</span> Sign up with Google
              </button>
            </>
          )}

          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy. AI outputs are statistical estimates and not financial advice.
          </p>
        </div>
      </div>
    </div>
  )
}

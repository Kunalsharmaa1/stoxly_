'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Screen } from '@/types'

interface Props { onNavigate: (s: Screen) => void }

const regimeData = [
  { regime: 'Trending', return: 42.1, winRate: 78, trades: 24 },
  { regime: 'Sideways', return: -8.4, winRate: 38, trades: 13 },
  { regime: 'High Vol', return: -3.2, winRate: 44, trades: 7 },
  { regime: 'Low Vol', return: 18.7, winRate: 71, trades: 3 },
]

export default function AIBacktestAnalysis({ onNavigate }: Props) {
  return (
    <div style={{ padding: 24, maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: 'var(--ai)', fontSize: 16 }}>✦</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>AI Strategy Analysis</h1>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>RSI Momentum Strategy · RELIANCE · 2022–2026</p>
      </div>

      {/* Main AI summary */}
      <div className="card" style={{ padding: 20, borderColor: 'rgba(129,140,248,0.25)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(11,13,16,0) 60%)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--ai-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--ai)', flexShrink: 0 }}>✦</div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ai)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>AI Strategy Summary</div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 400 }}>
              Your strategy performed best during <strong style={{ color: 'var(--green)' }}>trending market conditions</strong>, capturing strong upward momentum with a 78% win rate. However, it generated repeated losses during <strong style={{ color: 'var(--red)' }}>sideways and consolidation periods</strong>, indicating the RSI oversold entry signal has limited reliability when price is range-bound.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Strengths */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>✓ Strengths</div>
          {[
            'Strong performance during uptrends — 78% win rate in trending regime',
            'Good risk/reward profile — avg win (+3.2%) > avg loss (-1.8%)',
            'Positive expectancy of +₹420 per trade',
            'Sharpe ratio of 1.34 indicates risk-adjusted returns are solid',
            'Max drawdown of 11.4% is well-controlled for a momentum strategy',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ color: 'var(--green)', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Weaknesses */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>⚠ Weaknesses</div>
          {[
            'Frequent false signals during sideways consolidation — 62% loss rate',
            'Drawdown increases significantly during high volatility periods',
            'Strategy has no filter for overall market regime — runs in all conditions',
            'RSI alone as entry trigger is susceptible to divergence failures',
            'Relatively few trades in low-volatility regime — limited data',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ color: 'var(--yellow)', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="card" style={{ padding: 16, borderColor: 'rgba(129,140,248,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ color: 'var(--ai)', fontSize: 13 }}>✦</span>
          <span className="section-title">AI Suggestions</span>
          <span style={{ fontSize: 10, background: 'var(--ai-muted)', color: 'var(--ai)', border: '1px solid rgba(129,140,248,0.2)', padding: '2px 7px', borderRadius: 3, fontWeight: 600 }}>EXPERIMENTAL</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🔍', tip: 'Adding volume confirmation (e.g., Volume > 1.5× 20-day avg) before entry may reduce false RSI signals in low-momentum environments.' },
            { icon: '📊', tip: 'Consider testing the strategy separately across different market regimes — it shows strong alpha only in trending markets.' },
            { icon: '⚙', tip: 'Try tightening the stop loss to 1.5% in high-volatility periods to reduce the impact of adverse moves.' },
            { icon: '🧪', tip: 'A MACD signal-line crossover as a secondary entry confirmation may improve precision from 65.9% to an estimated 70–74% win rate.' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', background: 'var(--ai-muted)', borderRadius: 5, border: '1px solid rgba(129,140,248,0.12)' }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.tip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Market regime performance */}
      <div className="card" style={{ padding: 16 }}>
        <div className="section-title" style={{ marginBottom: 4 }}>Performance by Market Regime</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>How your strategy behaved across different market environments</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Return by Regime</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={regimeData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="regime" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} formatter={(v: any) => [`${v.toFixed(1)}%`, 'Return']} />
                <Bar dataKey="return" radius={[3, 3, 0, 0]}>
                  {regimeData.map((d, i) => <Cell key={i} fill={d.return > 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.6)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Win Rate by Regime</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={regimeData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="regime" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" radius={[3, 3, 0, 0]}>
                  {regimeData.map((d, i) => <Cell key={i} fill={d.winRate > 55 ? 'rgba(129,140,248,0.7)' : 'rgba(245,158,11,0.6)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
          {regimeData.map(r => (
            <div key={r.regime} style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 5 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.regime}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: r.return > 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>{r.return > 0 ? '+' : ''}{r.return}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.trades} trades · {r.winRate}% WR</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

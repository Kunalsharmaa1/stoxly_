'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sparkline from '@/components/Sparkline'
import type { Screen } from '@/types'

const mkSpk = (base: number) => Array.from({ length: 20 }, (_, i) => base + Math.sin(i * 0.7) * base * 0.02 + (Math.random() - 0.48) * base * 0.015)

const stocks = [
  { ticker: 'RELIANCE', instrumentKey: 'NSE_EQ|INE002A01018', name: 'Reliance Industries', sector: 'Energy', price: '₹1,307.80', raw: 1307.80, change: '+1.15%', pos: true, ai: 76, sim: 87, bias: 'Bullish', volume: 'High', mktCap: '₹17.6L Cr', data: mkSpk(1280) },
  { ticker: 'TCS', instrumentKey: 'NSE_EQ|INE467B01029', name: 'Tata Consultancy Svcs', sector: 'IT', price: '₹3,245.60', raw: 3245.60, change: '-0.48%', pos: false, ai: 54, sim: 61, bias: 'Neutral', volume: 'Normal', mktCap: '₹11.8L Cr', data: mkSpk(3250) },
  { ticker: 'INFY', instrumentKey: 'NSE_EQ|INE009A01021', name: 'Infosys Ltd', sector: 'IT', price: '₹1,876.40', raw: 1876.40, change: '+0.83%', pos: true, ai: 68, sim: 74, bias: 'Bullish', volume: 'Normal', mktCap: '₹7.8L Cr', data: mkSpk(1860) },
  { ticker: 'HDFCBANK', instrumentKey: 'NSE_EQ|INE040A01034', name: 'HDFC Bank Ltd', sector: 'Banking', price: '₹1,712.25', raw: 1712.25, change: '-0.31%', pos: false, ai: 49, sim: 58, bias: 'Neutral', volume: 'Normal', mktCap: '₹13.0L Cr', data: mkSpk(1720) },
  { ticker: 'SBIN', instrumentKey: 'NSE_EQ|INE062A01020', name: 'State Bank of India', sector: 'Banking', price: '₹821.90', raw: 821.90, change: '+2.14%', pos: true, ai: 81, sim: 79, bias: 'Bullish', volume: 'High', mktCap: '₹7.3L Cr', data: mkSpk(800) },
  { ticker: 'HAL', instrumentKey: 'NSE_EQ|INE066F01020', name: 'Hindustan Aeronautics', sector: 'Defence', price: '₹4,123.50', raw: 4123.50, change: '+1.67%', pos: true, ai: 71, sim: 82, bias: 'Bullish', volume: 'Elevated', mktCap: '₹2.8L Cr', data: mkSpk(4050) },
  { ticker: 'WIPRO', instrumentKey: 'NSE_EQ|INE075A01022', name: 'Wipro Ltd', sector: 'IT', price: '₹584.20', raw: 584.20, change: '-1.03%', pos: false, ai: 42, sim: 53, bias: 'Bearish', volume: 'Low', mktCap: '₹3.0L Cr', data: mkSpk(590) },
  { ticker: 'ICICIBANK', instrumentKey: 'NSE_EQ|INE090A01021', name: 'ICICI Bank Ltd', sector: 'Banking', price: '₹1,421.35', raw: 1421.35, change: '+0.41%', pos: true, ai: 62, sim: 68, bias: 'Neutral', volume: 'Normal', mktCap: '₹10.0L Cr', data: mkSpk(1415) },
]

interface Props { onNavigate: (s: Screen) => void }

export default function Watchlist({ onNavigate }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('ticker')
  const [removed, setRemoved] = useState<string[]>([])

  const filtered = stocks
    .filter(s => !removed.includes(s.ticker))
    .filter(s => filter === 'All' || s.bias === filter)
    .filter(s => s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'ai' ? b.ai - a.ai : sort === 'price' ? b.raw - a.raw : a.ticker.localeCompare(b.ticker))

  const handleStockClick = (symbol: string, instrumentKey: string) => {
    router.push(`/stock?symbol=${encodeURIComponent(symbol)}&instrument_key=${encodeURIComponent(instrumentKey)}`)
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Watchlist</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Stocks you're monitoring · {filtered.length} instruments</p>
        </div>
        <button className="btn-primary">+ Add Stock</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter stocks..." style={{ width: '100%', paddingLeft: 28 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['All', 'Bullish', 'Neutral', 'Bearish'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 4, border: '1px solid',
              borderColor: filter === f ? 'var(--ai-dim)' : 'var(--border)',
              background: filter === f ? 'var(--ai-muted)' : 'transparent',
              color: filter === f ? 'var(--ai)' : 'var(--text-muted)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>{f}</button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="ticker">Sort: Ticker</option>
          <option value="ai">Sort: AI Prob.</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Stock</th>
              <th>Price</th>
              <th>Change</th>
              <th>AI Probability ↕</th>
              <th>Pattern Similarity</th>
              <th>Market Bias</th>
              <th>Volume</th>
              <th>Chart (7D)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.ticker} style={{ cursor: 'pointer' }} onClick={() => handleStockClick(s.ticker, s.instrumentKey)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 5, background: 'var(--bg-surface)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: 'var(--ai)', flexShrink: 0,
                    }}>{s.ticker.slice(0, 2)}</div>
                    <div>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.name}</div>
                    </div>
                  </div>
                </td>
                <td className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{s.price}</td>
                <td>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: s.pos ? 'var(--green)' : 'var(--red)' }}>{s.change}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 56, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${s.ai}%`, height: '100%', background: s.ai > 65 ? 'var(--green)' : s.ai < 50 ? 'var(--red)' : 'var(--ai)', borderRadius: 2 }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: s.ai > 65 ? 'var(--green)' : s.ai < 50 ? 'var(--red)' : 'var(--ai)' }}>{s.ai}%</span>
                  </div>
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.sim}%</span>
                </td>
                <td>
                  <span className={`badge-${s.bias.toLowerCase()}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 3, display: 'inline-block', letterSpacing: '0.02em' }}>{s.bias}</span>
                </td>
                <td>
                  <span style={{ fontSize: 11, color: s.volume === 'High' || s.volume === 'Elevated' ? 'var(--yellow)' : 'var(--text-muted)' }}>{s.volume}</span>
                </td>
                <td><Sparkline data={s.data} positive={s.pos} width={70} height={28} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); handleStockClick(s.ticker, s.instrumentKey) }} style={{ fontSize: 11, padding: '4px 8px' }}>View</button>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--red)' }} onClick={(e) => { e.stopPropagation(); setRemoved(p => [...p, s.ticker]) }}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No stocks match your filters.
          </div>
        )}
      </div>
    </div>
  )
}

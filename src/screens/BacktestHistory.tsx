'use client'

import { useState, useEffect } from 'react'
import type { Screen } from '@/types'

interface Props { onNavigate: (s: Screen) => void }

const defaultHistory = [
  { id: 1, name: 'RSI Momentum Strategy', stock: 'RELIANCE', period: '2022–2026', ret: '+28.4%', pos: true, win: '65.9%', dd: '-11.4%', sharpe: '1.34', trades: 47, date: '07 Aug 2026', status: 'Complete' },
  { id: 2, name: 'EMA Crossover', stock: 'TCS', period: '2021–2026', ret: '+18.2%', pos: true, win: '59.3%', dd: '-14.1%', sharpe: '0.98', trades: 63, date: '04 Aug 2026', status: 'Complete' },
  { id: 3, name: 'MACD Divergence', stock: 'INFY', period: '2020–2026', ret: '-3.8%', pos: false, win: '44.2%', dd: '-21.7%', sharpe: '-0.24', trades: 38, date: '02 Aug 2026', status: 'Complete' },
  { id: 4, name: 'Bollinger Breakout', stock: 'HDFCBANK', period: '2022–2026', ret: '+11.6%', pos: true, win: '52.1%', dd: '-16.8%', sharpe: '0.72', trades: 29, date: '28 Jul 2026', status: 'Complete' },
  { id: 5, name: 'Volume Surge Entry', stock: 'SBIN', period: '2023–2026', ret: '+22.7%', pos: true, win: '61.5%', dd: '-9.2%', sharpe: '1.52', trades: 26, date: '22 Jul 2026', status: 'Complete' },
  { id: 6, name: 'RSI + Volume Filter', stock: 'HAL', period: '2022–2026', ret: '+34.1%', pos: true, win: '70.2%', dd: '-8.7%', sharpe: '1.87', trades: 37, date: '18 Jul 2026', status: 'Complete' },
  { id: 7, name: 'Supertrend Follow', stock: 'WIPRO', period: '2021–2026', ret: '-8.3%', pos: false, win: '41.8%', dd: '-27.3%', sharpe: '-0.51', trades: 55, date: '10 Jul 2026', status: 'Complete' },
]

export default function BacktestHistory({ onNavigate }: Props) {
  const [historyList, setHistoryList] = useState<any[]>(defaultHistory)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stoxly_backtest_history')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryList(parsed)
          }
        } catch (e) {
          console.error('Failed parsing backtest history:', e)
        }
      }
    }
  }, [])

  const handleDelete = (id: number) => {
    const filtered = historyList.filter(item => item.id !== id)
    setHistoryList(filtered)
    if (typeof window !== 'undefined') {
      localStorage.setItem('stoxly_backtest_history', JSON.stringify(filtered))
    }
  }

  const profitableCount = historyList.filter(h => h.pos).length

  return (
    <div style={{ padding: 24, maxWidth: 1300, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Backtest History</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>All previously tested strategies · {historyList.length} results</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('strategy')}>+ New Strategy</button>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Total Backtests', value: historyList.length.toString() },
          { label: 'Profitable Strategies', value: `${profitableCount}`, sub: 'of ' + historyList.length },
          { label: 'Best Return', value: '+34.1%', color: 'var(--green)' },
          { label: 'Best Sharpe', value: '1.87', color: 'var(--ai)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: (s as any).color || 'var(--text-primary)' }}>{s.value}</div>
            {(s as any).sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(s as any).sub}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Strategy Name</th>
              <th>Stock</th>
              <th>Period</th>
              <th>Total Return</th>
              <th>Win Rate</th>
              <th>Max DD</th>
              <th>Trades</th>
              <th>Date Tested</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {historyList.map((h, i) => (
              <tr key={h.id || i}>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{(i + 1).toString().padStart(2, '0')}</td>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{h.name}</div>
                  <div style={{ fontSize: 10, marginTop: 1 }}>
                    <span style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: 2, border: '1px solid var(--border)' }}>Complete</span>
                  </div>
                </td>
                <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{h.stock}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{h.period}</td>
                <td>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: h.pos ? 'var(--green)' : 'var(--red)' }}>{h.ret}</span>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{h.win}</td>
                <td style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.dd}</td>
                <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.trades}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{h.date || 'Recent'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => onNavigate('backtest')}>View</button>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => onNavigate('strategy')}>Duplicate</button>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: 'var(--red)' }} onClick={() => handleDelete(h.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

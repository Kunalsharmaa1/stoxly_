'use client'

import { useState, useEffect } from 'react'
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Screen } from '@/types'

interface Props { onNavigate: (s: Screen) => void }

export default function BacktestResults({ onNavigate }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backtestData, setBacktestData] = useState<any>(null)

  useEffect(() => {
    const runBacktest = async () => {
      try {
        setLoading(true)
        setError(null)

        let strategyConfig = {
          name: 'RSI Momentum Strategy',
          symbol: 'RELIANCE',
          timeframe: '1D',
          fromYear: '2022',
          toYear: '2026',
          capital: 100000,
          stopLoss: 2,
          takeProfit: 5,
          posSize: 100,
          joinType: 'AND',
          exitJoin: 'OR',
          entryConditions: [
            { indicator: 'RSI', operator: '<', value: '30' },
            { indicator: 'Price', operator: 'crosses above', value: 'EMA 20' }
          ],
          exitConditions: [
            { indicator: 'RSI', operator: '>', value: '70' },
            { indicator: 'Price', operator: '<', value: 'EMA 20' }
          ]
        }

        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('stoxly_active_strategy')
          if (saved) {
            try {
              strategyConfig = JSON.parse(saved)
            } catch (e) {
              console.error('Failed to parse active strategy:', e)
            }
          }
        }

        const res = await fetch('/api/backtest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(strategyConfig),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to run backtest engine')
        }

        const result = await res.json()
        setBacktestData(result)

        // Save into history in localStorage
        if (typeof window !== 'undefined') {
          const historySaved = localStorage.getItem('stoxly_backtest_history') || '[]'
          try {
            const history = JSON.parse(historySaved)
            const newHistoryItem = {
              id: Date.now(),
              name: result.strategyName,
              stock: result.symbol,
              period: result.period,
              ret: result.metrics.totalReturn,
              pos: !result.metrics.totalReturn.startsWith('-'),
              win: result.metrics.winRate,
              dd: result.metrics.maxDrawdown,
              pf: result.metrics.profitFactor,
              trades: result.metrics.totalTrades,
              date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            }
            localStorage.setItem('stoxly_backtest_history', JSON.stringify([newHistoryItem, ...history.slice(0, 19)]))
          } catch (e) {
            console.error('Failed saving backtest history:', e)
          }
        }
      } catch (err: any) {
        console.error('Backtest error:', err)
        setError(err?.message || 'Backtest failed')
      } finally {
        setLoading(false)
      }
    }

    runBacktest()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Executing Backtest Strategy over Upstox Candles...</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 500, lineHeight: 1.5 }}>
          Calculating indicators (RSI, EMA 20, SMA 50), trade signals, stop-loss triggers, position sizing, and equity curve...
        </p>
      </div>
    )
  }

  if (error || !backtestData) {
    return (
      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 16, color: 'var(--red)', fontWeight: 600 }}>Backtest Engine Error</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{error || 'No backtest results available.'}</p>
        <button className="btn-secondary" onClick={() => onNavigate('strategy')}>← Back to Strategy Lab</button>
      </div>
    )
  }

  const strategyName = backtestData?.strategyName || 'RSI Momentum Strategy'
  const symbol = backtestData?.symbol || 'RELIANCE'
  const period = backtestData?.period || '2022 – 2026'
  const capital = backtestData?.capital || '₹1,00,000'
  const metrics = backtestData?.metrics || {}

  const totalReturnStr = String(metrics?.totalReturn || '+0.0%')
  const isPosReturn = !totalReturnStr.startsWith('-')

  const equityData = Array.isArray(backtestData?.equityData) ? backtestData.equityData : []
  const trades = Array.isArray(backtestData?.trades) ? backtestData.trades : []
  const annualPerformance = Array.isArray(backtestData?.annualPerformance) ? backtestData.annualPerformance : []

  const metricCards = [
    { label: 'Total Return', value: totalReturnStr, color: isPosReturn ? 'var(--green)' : 'var(--red)', positive: isPosReturn },
    { label: 'Win Rate', value: String(metrics?.winRate || '0%'), color: 'var(--text-primary)', positive: null },
    { label: 'Total Trades', value: String(metrics?.totalTrades || '0'), color: 'var(--text-primary)', positive: null },
    { label: 'Profit Factor', value: String(metrics?.profitFactor || '1.00'), color: 'var(--green)', positive: true },
    { label: 'Max Drawdown', value: String(metrics?.maxDrawdown || '0.0%'), color: 'var(--red)', positive: false },
    { label: 'Sharpe Ratio', value: String(metrics?.sharpeRatio || '1.00'), color: 'var(--text-primary)', positive: null },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1300, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Backtest Results (Real Upstox Engine)</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            {[['Strategy', strategyName], ['Stock', symbol], ['Period', period], ['Capital', capital]].map(([k, v]) => (
              <span key={k} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{k}: </span><span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => onNavigate('strategy')}>← Modify Strategy</button>
          <button className="btn-primary" onClick={() => onNavigate('ai')}>✦ AI Analysis</button>
        </div>
      </div>

      {metrics.totalTrades === '0' && (
        <div style={{ padding: '12px 16px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 6, fontSize: 13, color: '#eab308' }}>
          <strong>Notice: 0 trades triggered.</strong> Your entry conditions were too strict to occur on the exact same day bar. Try changing Entry Join Type to <strong>OR</strong> or adjusting RSI / Moving Average thresholds in Strategy Lab!
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {metricCards.map(m => (
          <div key={m.label} className="card" style={{ padding: '14px 16px', textAlign: 'center', borderColor: m.positive === true ? 'rgba(34,197,94,0.2)' : m.positive === false ? 'rgba(239,68,68,0.2)' : 'var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{m.label}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Equity curve */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div className="section-title">Equity Curve (Actual Portfolio Progression)</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Portfolio value over backtest period · Starting {capital}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 2, background: 'var(--green)', display: 'inline-block' }} /> Equity</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 2, background: 'var(--red)', display: 'inline-block', opacity: 0.6 }} /> Drawdown</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={equityData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={equityData.length > 8 ? Math.floor(equityData.length / 8) : 0} />
            <YAxis yAxisId="eq" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
            <YAxis yAxisId="dd" orientation="right" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(0)}%`} domain={[-30, 0]} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
              formatter={(v: any, name: any) => name === 'equity' ? [`₹${Number(v).toLocaleString('en-IN')}`, 'Portfolio Value'] : [`${Number(v).toFixed(2)}%`, 'Drawdown']}
            />
            <Area yAxisId="eq" type="monotone" dataKey="equity" stroke="var(--green)" strokeWidth={2} fill="rgba(34,197,94,0.08)" dot={false} />
            <Area yAxisId="dd" type="monotone" dataKey="drawdown" stroke="var(--red)" strokeWidth={1.2} fill="rgba(239,68,68,0.12)" dot={false} strokeDasharray="3 2" />
            <ReferenceLine yAxisId="eq" y={100000} stroke="var(--border)" strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Trade analysis */}
        <div className="card" style={{ padding: 16 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Trade Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Winning Trades', metrics.winningTrades, 'var(--green)'],
              ['Losing Trades', metrics.losingTrades, 'var(--red)'],
              ['Avg Win', metrics.avgWin, 'var(--green)'],
              ['Avg Loss', metrics.avgLoss, 'var(--red)'],
              ['Best Trade', metrics.bestTrade, 'var(--green)'],
              ['Worst Trade', metrics.worstTrade, 'var(--red)'],
              ['Avg Duration', metrics.avgDuration, 'var(--text-secondary)'],
              ['Profit Factor', metrics.profitFactor, 'var(--green)'],
            ].map(([k, v, c]) => (
              <div key={k} style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 5 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: c as string, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Annual Performance */}
        <div className="card" style={{ padding: 16 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Annual Performance Breakdown</div>
          {annualPerformance.map((r: any) => (
            <div key={r.year} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBlock: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="mono" style={{ fontSize: 12, width: 36 }}>{r.year}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Math.abs(parseFloat(r.ret)) * 5)}%`,
                  height: '100%',
                  background: r.pos ? 'var(--green)' : 'var(--red)',
                  borderRadius: 3, opacity: 0.8,
                }} />
              </div>
              <span className="mono" style={{ fontSize: 12, width: 52, textAlign: 'right', color: r.pos ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{r.ret}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 52 }}>{r.trades} trades</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Log */}
      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-title">Trade Log ({trades.length} Trades Executed)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Entry Date</th>
              <th>Entry Price</th>
              <th>Exit Date</th>
              <th>Exit Price</th>
              <th>Return</th>
              <th>Duration</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t: any) => (
              <tr key={t.id}>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.id.toString().padStart(2, '0')}</td>
                <td className="mono" style={{ fontSize: 11 }}>{t.entry}</td>
                <td className="mono" style={{ fontSize: 12 }}>{t.entryPrice}</td>
                <td className="mono" style={{ fontSize: 11 }}>{t.exit}</td>
                <td className="mono" style={{ fontSize: 12 }}>{t.exitPrice}</td>
                <td className="mono" style={{ fontWeight: 600, fontSize: 12, color: t.result === 'WIN' ? 'var(--green)' : 'var(--red)' }}>{t.ret}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.dur}</td>
                <td>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                    background: t.result === 'WIN' ? 'var(--green-muted)' : 'var(--red-muted)',
                    color: t.result === 'WIN' ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${t.result === 'WIN' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>{t.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

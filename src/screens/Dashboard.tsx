'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sparkline from '@/components/Sparkline'
import type { Screen } from '@/types'

const mkSpk = (base: number, len = 20) =>
  Array.from({ length: len }, (_, i) => base + Math.sin(i * 0.7) * base * 0.02 + (Math.random() - 0.48) * base * 0.015)

const indexConfigs = [
  { name: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50', fallbackVal: '24,326.50', fallbackPct: '+0.62%', fallbackChange: '+154.30', pos: true, base: 24300 },
  { name: 'SENSEX', key: 'BSE_INDEX|SENSEX', fallbackVal: '77,789.94', fallbackPct: '+0.58%', fallbackChange: '+471.80', pos: true, base: 77700 },
  { name: 'BANK NIFTY', key: 'NSE_INDEX|Nifty Bank', fallbackVal: '57,521.40', fallbackPct: '-0.24%', fallbackChange: '-123.45', pos: false, base: 57500 },
]

const watchlist = [
  { ticker: 'RELIANCE', instrumentKey: 'NSE_EQ|INE002A01018', name: 'Reliance Industries', price: '₹1,307.80', change: '+1.15%', pos: true, ai: 76, sim: 87, bias: 'Bullish', data: mkSpk(1280) },
  { ticker: 'TCS', instrumentKey: 'NSE_EQ|INE467B01029', name: 'Tata Consultancy Svcs', price: '₹3,245.60', change: '-0.48%', pos: false, ai: 54, sim: 61, bias: 'Neutral', data: mkSpk(3250) },
  { ticker: 'INFY', instrumentKey: 'NSE_EQ|INE009A01021', name: 'Infosys Ltd', price: '₹1,876.40', change: '+0.83%', pos: true, ai: 68, sim: 74, bias: 'Bullish', data: mkSpk(1860) },
  { ticker: 'HDFCBANK', instrumentKey: 'NSE_EQ|INE040A01034', name: 'HDFC Bank Ltd', price: '₹1,712.25', change: '-0.31%', pos: false, ai: 49, sim: 58, bias: 'Neutral', data: mkSpk(1720) },
  { ticker: 'SBIN', instrumentKey: 'NSE_EQ|INE062A01020', name: 'State Bank of India', price: '₹821.90', change: '+2.14%', pos: true, ai: 81, sim: 79, bias: 'Bullish', data: mkSpk(800) },
  { ticker: 'HAL', instrumentKey: 'NSE_EQ|INE066F01020', name: 'Hindustan Aeronautics', price: '₹4,123.50', change: '+1.67%', pos: true, ai: 71, sim: 82, bias: 'Bullish', data: mkSpk(4050) },
]

const backtests = [
  { name: 'RSI Momentum', stock: 'RELIANCE', ret: '+28.4%', pos: true, win: '65.9%', dd: '-11.4%' },
  { name: 'EMA Crossover', stock: 'TCS', ret: '+18.2%', pos: true, win: '59.3%', dd: '-14.1%' },
  { name: 'MACD Divergence', stock: 'INFY', ret: '-3.8%', pos: false, win: '44.2%', dd: '-21.7%' },
]

interface Props { onNavigate: (s: Screen) => void }

export default function Dashboard({ onNavigate }: Props) {
  const router = useRouter()
  const [liveQuotes, setLiveQuotes] = useState<Record<string, { price: number; change: number; pct: number }>>({})
  const [liveIndices, setLiveIndices] = useState<Record<string, { value: string; change: string; pct: string; pos: boolean; sparkline: number[] }>>({})
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour >= 4 && hour < 12) {
        setGreeting('Good morning')
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon')
      } else if (hour >= 17 && hour < 22) {
        setGreeting('Good evening')
      } else {
        setGreeting('Good night')
      }
    }
    updateGreeting()
  }, [])

  useEffect(() => {
    let isMounted = true

    // Fetch live index quotes & candles from Upstox
    indexConfigs.forEach(async (idx) => {
      try {
        const res = await fetch(`/api/market?instrument_key=${encodeURIComponent(idx.key)}&period=1M`)
        if (!res.ok) return
        const data = await res.json()
        const quote = Object.values(data?.quote?.data || {})[0] as any
        const rawCandles: any[] = Array.isArray(data?.candles) ? data.candles : []
        const sparkline = rawCandles.map(c => Number(c[4])).reverse()

        if (quote?.last_price && isMounted) {
          const lastPrice = Number(quote.last_price)
          let changeVal = Number(quote.net_change) || 0

          if (changeVal === 0 && rawCandles.length > 1) {
            const currentClose = Number(rawCandles[0][4])
            const prevClose = Number(rawCandles[1][4])
            changeVal = currentClose - prevClose
          }

          const prevCloseVal = quote.close_price || (lastPrice - changeVal)
          const pctVal = prevCloseVal ? (changeVal / prevCloseVal) * 100 : 0
          const isPos = changeVal >= 0

          setLiveIndices(prev => ({
            ...prev,
            [idx.name]: {
              value: lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              change: `${isPos ? '+' : ''}${changeVal.toFixed(2)}`,
              pct: `${isPos ? '+' : ''}${pctVal.toFixed(2)}%`,
              pos: isPos,
              sparkline: sparkline.length > 0 ? sparkline : mkSpk(idx.base),
            }
          }))
        }
      } catch (e) {
        console.error('Failed index fetch:', idx.name, e)
      }
    })

    // Fetch watchlist quotes
    watchlist.forEach(async (item) => {
      try {
        const res = await fetch(`/api/market?instrument_key=${encodeURIComponent(item.instrumentKey)}`)
        if (!res.ok) return
        const data = await res.json()
        const quote = Object.values(data?.quote?.data || {})[0] as any
        if (quote?.last_price && isMounted) {
          const change = Number(quote.net_change) || 0
          const prevClose = quote.close_price || (quote.last_price - change)
          const pct = prevClose ? (change / prevClose) * 100 : 0
          setLiveQuotes(prev => ({
            ...prev,
            [item.ticker]: { price: quote.last_price, change, pct }
          }))
        }
      } catch (e) {
        console.error('Failed quote fetch for dashboard watchlist:', item.ticker, e)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleStockClick = (symbol: string, instrumentKey: string) => {
    router.push(`/stock?symbol=${encodeURIComponent(symbol)}&instrument_key=${encodeURIComponent(instrumentKey)}`)
  }

  // Calculate Market Breadth dynamically from liveQuotes
  const loadedQuotes = Object.values(liveQuotes)
  const advancingCount = loadedQuotes.filter(q => q.change >= 0).length
  const totalCount = loadedQuotes.length || watchlist.length
  const breadthPct = totalCount ? Math.round((advancingCount / totalCount) * 100) : 68

  return (
    <div style={{ padding: 24, maxWidth: 1400, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {greeting}, Kunal
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Your market intelligence dashboard · Live Upstox Data</p>
      </div>

      {/* Market Overview */}
      <section>
        <div className="label" style={{ marginBottom: 10 }}>Market Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {indexConfigs.map(config => {
            const live = liveIndices[config.name]
            const val = live ? live.value : config.fallbackVal
            const pct = live ? live.pct : config.fallbackPct
            const change = live ? live.change : config.fallbackChange
            const isPos = live ? live.pos : config.pos
            const sparkData = live ? live.sparkline : mkSpk(config.base)

            return (
              <div
                key={config.name}
                className="card"
                style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
                onClick={() => handleStockClick(config.name, config.key)}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {config.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {val}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: isPos ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                        {pct}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {change}
                      </span>
                    </div>
                  </div>
                  <Sparkline data={sparkData} positive={isPos} />
                </div>
              </div>
            )
          })}

          {/* Market Breadth Card */}
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Market Breadth
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {breadthPct}%
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                    {advancingCount || 4} / {totalCount || 6}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Advancing</span>
                </div>
              </div>
              <Sparkline data={mkSpk(breadthPct)} positive={true} />
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Watchlist */}
          <section className="card">
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <span className="section-title">Your Watchlist</span>
              <button className="btn-ghost" onClick={() => onNavigate('watchlist')} style={{ fontSize: 12 }}>View all →</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>AI Prob.</th>
                  <th>Pattern Sim.</th>
                  <th>Bias</th>
                  <th>Chart</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(w => {
                  const q = liveQuotes[w.ticker]
                  const priceStr = q ? `₹${q.price.toFixed(2)}` : w.price
                  const changeStr = q ? `${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)} (${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%)` : w.change
                  const isPos = q ? q.change >= 0 : w.pos

                  return (
                    <tr key={w.ticker} style={{ cursor: 'pointer' }} onClick={() => handleStockClick(w.ticker, w.instrumentKey)}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{w.ticker}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.name}</div>
                      </td>
                      <td className="mono" style={{ fontWeight: 500 }}>{priceStr}</td>
                      <td style={{ color: isPos ? 'var(--green)' : 'var(--red)', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{changeStr}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${w.ai}%`, height: '100%', background: 'var(--ai)', borderRadius: 2 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--ai)' }}>{w.ai}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.sim}%</span>
                      </td>
                      <td>
                        <span className={`badge-${w.bias.toLowerCase()}`} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3, display: 'inline-block' }}>{w.bias}</span>
                      </td>
                      <td><Sparkline data={w.data} positive={isPos} width={60} height={24} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Recent Backtests */}
          <section className="card">
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <span className="section-title">Recent Backtests</span>
              <button className="btn-ghost" onClick={() => onNavigate('history')} style={{ fontSize: 12 }}>View all →</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Stock</th>
                  <th>Return</th>
                  <th>Win Rate</th>
                  <th>Max Drawdown</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {backtests.map(b => (
                  <tr key={b.name}>
                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{b.stock}</td>
                    <td style={{ color: b.pos ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12 }}>{b.ret}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{b.win}</td>
                    <td style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.dd}</td>
                    <td><button className="btn-ghost" onClick={() => onNavigate('backtest')} style={{ fontSize: 11 }}>View →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* AI Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="label" style={{ marginBottom: 2 }}>AI Market Highlights</div>

          {[
            { title: 'High probability setups', desc: '8 stocks show >70% positive probability across multiple timeframes', icon: '✦', color: 'var(--ai)' },
            { title: 'Unusual volume activity', desc: 'SBIN volume 3.2× above 20-day average — historical significance detected', icon: '⬆', color: 'var(--yellow)' },
            { title: 'Strong pattern similarity', desc: 'HAL matches 89% similarity to Jan 2024 breakout pattern', icon: '◎', color: 'var(--green)' },
          ].map(h => (
            <div key={h.title} className="card" style={{ padding: 14, cursor: 'pointer' }} onClick={() => onNavigate('ai')}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                  background: h.color === 'var(--ai)' ? 'var(--ai-muted)' : h.color === 'var(--yellow)' ? 'var(--yellow-muted)' : 'var(--green-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: h.color,
                }}>{h.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{h.desc}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, background: h.color === 'var(--ai)' ? 'var(--ai-muted)' : 'var(--green-muted)', color: h.color, padding: '2px 7px', borderRadius: 3, fontWeight: 600 }}>AI</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Statistical estimate · 14:28 IST</span>
              </div>
            </div>
          ))}

          {/* Mini portfolio card */}
          <div className="card" style={{ padding: 14, marginTop: 4 }}>
            <div className="label" style={{ marginBottom: 10 }}>Portfolio Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Value</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>₹5,82,430</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today's P&L</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>+₹3,241 (+0.56%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall P&L</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>+₹42,830 (+7.94%)</span>
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => onNavigate('portfolio')}>View Portfolio</button>
          </div>
        </div>
      </div>
    </div>
  )
}

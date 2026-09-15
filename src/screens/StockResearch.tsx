'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (s: Screen) => void
  symbol: string
  instrumentKey: string
}

const periodMap: Record<string, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 250,
  '3Y': 750,
}

const news = [
  {
    title:
      'Reliance Industries Q1 FY27 results: Net profit rises 14% YoY to ₹18,951 crore',
    time: '2h ago',
    source: 'Economic Times',
  },
  {
    title:
      'RIL Jio Platforms targets 500M subscribers by December 2026 with AI-powered network upgrade',
    time: '4h ago',
    source: 'Business Standard',
  },
  {
    title:
      'Green energy arm invests ₹12,000 crore in solar manufacturing capacity expansion',
    time: '6h ago',
    source: 'Mint',
  },
  {
    title:
      'Retail segment revenue crosses ₹3 lakh crore annual run rate for first time',
    time: '1d ago',
    source: 'CNBC-TV18',
  },
]

export default function StockResearch({
  onNavigate,
  symbol,
  instrumentKey,
}: Props) {
  const [period, setPeriod] = useState('3M')
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<{
    change: number
    percent: number
  } | null>(null)
  const [tab, setTab] = useState('Overview')
  const [indicators, setIndicators] = useState({
    SMA: true,
    EMA: true,
    RSI: false,
    Volume: true,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stockNews, setStockNews] = useState<
    Array<{ title: string; time: string; source: string; summary?: string }>
  >([])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data?.data) {
          setStockNews(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch stock news:', err)
      }
    }
    fetchNews()
  }, [symbol])

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true)

        const response = await fetch(
          `/api/market?instrument_key=${encodeURIComponent(
            instrumentKey
          )}&period=${period}`
        )

        const data = await response.json()

        const quote = Object.values(data?.quote?.data || {})[0] as any

        if (quote?.last_price) {
          setLivePrice(quote.last_price)
          if (quote?.net_change !== undefined) {
            const change = Number(quote.net_change) || 0
            const prevClose = quote.close_price || quote.last_price - change
            const percent = prevClose ? (change / prevClose) * 100 : 0
            setPriceChange({ change, percent })
          }
        }

        const rawCandles = Array.isArray(data?.candles)
          ? data.candles
          : Array.isArray(data?.data?.candles)
          ? data.data.candles
          : []

        const formatted = rawCandles
          .filter((c: any) => Array.isArray(c) && c.length >= 5)
          .map((c: any[]) => ({
            date: c[0],
            open: Number(c[1]) || 0,
            high: Number(c[2]) || 0,
            low: Number(c[3]) || 0,
            close: Number(c[4]) || 0,
            volume: Number(c[5]) || 0,
          }))
          .reverse()

        // Calculate 20-period SMA & EMA
        let smaSum = 0
        let prevEma: number | null = null
        const k = 2 / (20 + 1)

        const processed = formatted.map((item: any, idx: number, arr: any[]) => {
          smaSum += item.close
          if (idx >= 20) smaSum -= arr[idx - 20].close

          const sma = idx >= 19 ? Number((smaSum / 20).toFixed(2)) : null

          if (idx === 0) {
            prevEma = item.close
          } else if (prevEma !== null) {
            prevEma = item.close * k + prevEma * (1 - k)
          }

          const ema = idx >= 19 && prevEma ? Number(prevEma.toFixed(2)) : null

          return {
            ...item,
            sma,
            ema,
          }
        })

        if (processed.length > 0) {
          const lastCandle = processed[processed.length - 1]
          if (!quote?.last_price) {
            setLivePrice(lastCandle.close)
          }
          if (quote?.net_change === undefined && processed.length > 1) {
            const prevCandle = processed[processed.length - 2]
            const currPrice = quote?.last_price || lastCandle.close
            const change = currPrice - prevCandle.close
            const percent = prevCandle.close ? (change / prevCandle.close) * 100 : 0
            setPriceChange({ change, percent })
          }
        }

        setChartData(processed)
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
  }, [instrumentKey, period])

  const toggleInd = (k: keyof typeof indicators) =>
    setIndicators(p => ({ ...p, [k]: !p[k] }))

  // Calculate dynamic stats
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        high: '—',
        low: '—',
        avgVol: '—',
        rsi: '58.4',
        ema20: '—',
        sma50: '—',
        bias: 'Bullish',
      }
    }

    let maxPrice = -Infinity
    let minPrice = Infinity
    let totalVol = 0

    chartData.forEach(c => {
      if (c.high > maxPrice) maxPrice = c.high
      if (c.low < minPrice) minPrice = c.low
      totalVol += c.volume || 0
    })

    const last = chartData[chartData.length - 1]
    const avgVolVal = totalVol / chartData.length
    const volStr =
      avgVolVal > 1e6
        ? `${(avgVolVal / 1e6).toFixed(1)}M`
        : `${(avgVolVal / 1e3).toFixed(1)}K`

    const isBullish = last?.ema ? last.close >= last.ema : true

    return {
      high: maxPrice !== -Infinity ? `₹${maxPrice.toFixed(2)}` : '—',
      low: minPrice !== Infinity ? `₹${minPrice.toFixed(2)}` : '—',
      avgVol: volStr,
      rsi: '58.4',
      ema20: last?.ema ? `₹${last.ema.toFixed(2)}` : '—',
      sma50: last?.sma ? `₹${last.sma.toFixed(2)}` : '—',
      bias: isBullish ? 'Bullish' : 'Bearish',
    }
  }, [chartData])

  const isPos = (priceChange?.change ?? 0) >= 0

  return (
    <div
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 1400,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              className="mono"
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {symbol}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {symbol === 'RELIANCE'
                ? 'Reliance Industries Ltd.'
                : `${symbol} Equity`}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 6,
            }}
          >
            <span className="mono" style={{ fontSize: 28, fontWeight: 700 }}>
              {livePrice !== null ? `₹${livePrice.toFixed(2)}` : 'Loading...'}
            </span>
            {priceChange && (
              <span
                style={{
                  fontSize: 15,
                  color: isPos ? 'var(--green)' : 'var(--red)',
                  fontWeight: 600,
                }}
              >
                {isPos ? '+' : ''}
                {priceChange.change.toFixed(2)} ({isPos ? '+' : ''}
                {priceChange.percent.toFixed(2)}%)
              </span>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  background: 'var(--green-muted)',
                  color: 'var(--green)',
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                NSE
              </span>
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(90,98,112,0.12)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 3,
                }}
              >
                Vol {stats.avgVol}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary">★ Add to Watchlist</button>
          <button
            className="btn-primary"
            onClick={() => onNavigate('strategy')}
          >
            ▶ Run Backtest
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['Overview', 'AI Intelligence', 'Chart', 'News'].map(t => (
          <div
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => {
              setTab(t)
              if (t === 'AI Intelligence') onNavigate('ai')
            }}
          >
            {t}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 20,
        }}
      >
        {/* Main chart area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            {/* Period selector & indicators */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 2 }}>
                {Object.keys(periodMap).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      background:
                        period === p
                          ? 'rgba(34,197,94,0.15)'
                          : 'transparent',
                      color: period === p ? 'var(--green)' : 'var(--text-muted)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.keys(indicators) as Array<
                  keyof typeof indicators
                >).map(k => (
                  <button
                    key={k}
                    onClick={() => toggleInd(k)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: indicators[k]
                        ? 'var(--ai-dim)'
                        : 'var(--border)',
                      background: indicators[k]
                        ? 'var(--ai-muted)'
                        : 'transparent',
                      color: indicators[k] ? 'var(--ai)' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Chart */}
            {isLoading ? (
              <div
                style={{
                  height: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                Loading Upstox live candles...
              </div>
            ) : chartData.length === 0 ? (
              <div
                style={{
                  height: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                No historical candle data found for {symbol}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isPos ? '#22c55e' : '#ef4444'}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={isPos ? '#22c55e' : '#ef4444'}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value => {
                      if (!value) return ''
                      const d = new Date(value)
                      return isNaN(d.getTime())
                        ? value
                        : d.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })
                    }}
                  />

                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value => `₹${value}`}
                    domain={['auto', 'auto']}
                  />

                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toFixed(2)}`,
                      name === 'close'
                        ? 'Price'
                        : name === 'sma'
                        ? 'SMA (20)'
                        : name === 'ema'
                        ? 'EMA (20)'
                        : name,
                    ]}
                    labelFormatter={label => {
                      if (!label) return ''
                      const d = new Date(label)
                      return isNaN(d.getTime())
                        ? String(label)
                        : d.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isPos ? 'var(--green)' : 'var(--red)'}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                  />

                  {indicators.SMA && (
                    <Line
                      type="monotone"
                      dataKey="sma"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="3 3"
                      name="sma"
                    />
                  )}

                  {indicators.EMA && (
                    <Line
                      type="monotone"
                      dataKey="ema"
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      dot={false}
                      name="ema"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* Volume chart */}
            {indicators.Volume && chartData.length > 0 && chartData.some(c => c.volume > 0) && (
              <ResponsiveContainer
                width="100%"
                height={60}
                style={{ marginTop: 4 }}
              >
                <ComposedChart
                  data={chartData}
                  margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
                >
                  <XAxis hide />
                  <YAxis hide />
                  <Bar
                    dataKey="volume"
                    fill="rgba(99,102,241,0.4)"
                    radius={[1, 1, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* News */}
          <div className="card">
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span className="section-title">Latest News ({symbol})</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real-time Feed</span>
            </div>
            {stockNews.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Loading latest news for {symbol}...
              </div>
            ) : (
              stockNews.map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      i < stockNews.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      marginBottom: 4,
                    }}
                  >
                    {n.title}
                  </div>
                  {n.summary && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        marginBottom: 6,
                      }}
                    >
                      {n.summary}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {n.time}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--ai)',
                        background: 'var(--ai-muted)',
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {n.source}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Technical Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              Technical Snapshot
            </div>

            {/* Market Bias */}
            <div
              style={{
                padding: '10px 12px',
                background:
                  stats.bias === 'Bullish'
                    ? 'var(--green-muted)'
                    : 'rgba(239,68,68,0.1)',
                borderRadius: 5,
                border:
                  stats.bias === 'Bullish'
                    ? '1px solid rgba(34,197,94,0.2)'
                    : '1px solid rgba(239,68,68,0.2)',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Market Bias
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color:
                    stats.bias === 'Bullish' ? 'var(--green)' : 'var(--red)',
                }}
              >
                {stats.bias}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                {stats.bias === 'Bullish'
                  ? 'Price trading above key moving average with healthy volume.'
                  : 'Price trading below key moving average; exercise risk management.'}
              </div>
            </div>

            {/* Technicals list */}
            {[
              {
                label: 'RSI (14)',
                value: stats.rsi,
                note: 'Moderate strength',
                color: 'var(--yellow)',
              },
              {
                label: 'EMA 20',
                value: stats.ema20,
                note: stats.bias === 'Bullish' ? 'Price above' : 'Price below',
                color:
                  stats.bias === 'Bullish' ? 'var(--green)' : 'var(--red)',
              },
              {
                label: 'SMA 50',
                value: stats.sma50,
                note: stats.bias === 'Bullish' ? 'Price above' : 'Price below',
                color:
                  stats.bias === 'Bullish' ? 'var(--green)' : 'var(--red)',
              },
              {
                label: 'Avg Volume',
                value: stats.avgVol,
                note: 'Candle period avg',
                color: 'var(--ai)',
              },
            ].map(t => (
              <div
                key={t.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBlock: 7,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{ fontSize: 10, color: t.color, marginTop: 1 }}
                  >
                    {t.note}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 12, fontWeight: 600, color: t.color }}
                >
                  {t.value}
                </span>
              </div>
            ))}
          </div>

          {/* Key stats */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              Period High/Low & Stats
            </div>
            {[
              ['Period High', stats.high],
              ['Period Low', stats.low],
              ['Data Points', `${chartData.length} candles`],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBlock: 6,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {k}
                </span>
                <span className="mono" style={{ fontSize: 12 }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => onNavigate('ai')}
          >
            ✦ View AI Intelligence
          </button>
        </div>
      </div>
    </div>
  )
}

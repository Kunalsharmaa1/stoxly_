'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TopBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const [suggestions, setSuggestions] = useState<
  {
    name: string
    symbol: string
    shortName?: string
    exchange: string
    instrumentKey: string
  }[]
>([])
useEffect(() => {
  if (!query.trim()) {
    setSuggestions([])
    return
  }

  const timer = setTimeout(async () => {
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      )

      const result = await response.json()

      setSuggestions(result?.data || [])
    } catch (error) {
      console.error('Stock search failed:', error)
      setSuggestions([])
    }
  }, 300)

  return () => clearTimeout(timer)
}, [query])



  const [topIndices, setTopIndices] = useState<
    Record<string, { val: string; pct: string; pos: boolean }>
  >({})

  useEffect(() => {
    let isMounted = true
    const keys = [
      { name: 'NIFTY', key: 'NSE_INDEX|Nifty 50' },
      { name: 'SENSEX', key: 'BSE_INDEX|SENSEX' },
    ]

    keys.forEach(async item => {
      try {
        const res = await fetch(
          `/api/market?instrument_key=${encodeURIComponent(item.key)}`
        )
        if (!res.ok) return
        const data = await res.json()
        const quote = Object.values(data?.quote?.data || {})[0] as any
        if (quote?.last_price && isMounted) {
          const lastPrice = Number(quote.last_price)
          const change = Number(quote.net_change) || 0
          const prevClose = quote.close_price || lastPrice - change
          const pctVal = prevClose ? (change / prevClose) * 100 : 0
          const isPos = change >= 0

          setTopIndices(prev => ({
            ...prev,
            [item.name]: {
              val: lastPrice.toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              }),
              pct: `${isPos ? '+' : ''}${pctVal.toFixed(2)}%`,
              pos: isPos,
            },
          }))
        }
      } catch (e) {
        console.error('Failed top bar index fetch:', item.name, e)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <header
      style={{
        height: 52,
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingInline: 20,
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            ⌕
          </span>
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search stocks, indices..."
            style={{
              width: '100%',
              paddingLeft: 28,
              paddingRight: 10,
              height: 32,
              fontSize: 12,
            }}
          />
        </div>
        {open && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            {suggestions.map(s => (
              <div
                key={s.instrumentKey}
                onMouseDown={() => {
                  setQuery(s.symbol)
                  setOpen(false)

                  router.push(
                    `/stock?symbol=${encodeURIComponent(
                      s.symbol
                    )}&instrument_key=${encodeURIComponent(s.instrumentKey)}`
                  )
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                  }}
                >
                  {s.symbol}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {s.name} · {s.exchange}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px var(--green)',
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          NSE OPEN
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          · Live IST
        </span>
      </div>

      <div style={{ height: 20, width: 1, background: 'var(--border)' }} />

      {/* Quick indices */}
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          [
            'NIFTY',
            topIndices['NIFTY']?.val || '24,326',
            topIndices['NIFTY']?.pct || '+0.62%',
            topIndices['NIFTY']?.pos ?? true,
          ],
          [
            'SENSEX',
            topIndices['SENSEX']?.val || '77,790',
            topIndices['SENSEX']?.pct || '+0.58%',
            topIndices['SENSEX']?.pos ?? true,
          ],
        ].map(([n, v, c, pos]) => (
          <div
            key={n as string}
            style={{ display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {n}
            </span>
            <span
              className="mono"
              style={{ fontSize: 12, color: 'var(--text-primary)' }}
            >
              {v}
            </span>
            <span
              style={{
                fontSize: 11,
                color: pos ? 'var(--green)' : 'var(--red)',
              }}
            >
              {c}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-ghost" style={{ position: 'relative', padding: '5px 8px' }}>
          🔔
          <span style={{
            position: 'absolute', top: 2, right: 2, width: 7, height: 7,
            background: 'var(--green)', borderRadius: '50%', border: '1px solid var(--bg-elevated)',
          }} />
        </button>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>K</div>
      </div>
    </header>
  )
}

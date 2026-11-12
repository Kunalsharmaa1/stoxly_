'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ANALYSIS_HORIZONS, type AnalysisHorizon, type HorizonAnalysis, type MarketAnalysis } from '@/lib/market-analysis'

const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'HAL', 'WIPRO', 'ICICIBANK', 'NIFTY50', 'SENSEX', 'BANKNIFTY']
const formatPct = (value: number | null, digits = 1) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
const formatDate = (value: string) => new Date(`${value}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const formatUpdated = (value: string) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export default function AIIntelligence() {
  const [symbol, setSymbol] = useState('RELIANCE')
  const [horizon, setHorizon] = useState<AnalysisHorizon>(5)
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      setAnalysis(null)
      try {
        const response = await fetch('/api/ai/market-analysis', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load historical market data.')
        if (!cancelled) { setAnalysis(result.analysis); setLastUpdatedAt(result.lastUpdatedAt) }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load historical market data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [symbol, reloadKey])

  const selected: HorizonAnalysis | undefined = analysis?.horizons[horizon]
  const chartData = ANALYSIS_HORIZONS.map(value => ({
    horizon: `${value}D`, positive: analysis?.horizons[value].positiveOutcomePct,
    matches: analysis?.horizons[value].validMatchCount || 0,
  }))
  const summaryCards = [
    { label: `Historical positive outcomes · ${horizon} sessions`, value: selected?.positiveOutcomePct === null || selected?.positiveOutcomePct === undefined ? '—' : `${selected.positiveOutcomePct.toFixed(1)}%`, sub: selected ? `${selected.validMatchCount} non-overlapping matches · not a forecast` : 'No calculated sample yet', color: 'var(--ai)' },
    { label: 'Average forward return', value: formatPct(selected?.averageReturn ?? null), sub: selected ? `Median ${formatPct(selected.medianReturn)}` : 'Calculated from matched dates', color: 'var(--green)' },
    { label: 'Valid historical matches', value: selected ? String(selected.validMatchCount) : '—', sub: selected ? `${selected.candidateCount} eligible historical setups` : 'After data and similarity filters', color: 'var(--text-primary)' },
    { label: 'Closest setup similarity', value: selected?.matches[0] ? `${selected.matches[0].similarity.toFixed(1)}%` : '—', sub: selected?.matches[0] ? formatDate(selected.matches[0].date) : 'No qualifying matches', color: 'var(--ai-purple)' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1250, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, color: 'var(--ai)' }}>✦</span>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Historical Market Analysis</h1>
            <span style={{ fontSize: 10, background: 'var(--ai-muted)', color: 'var(--ai)', border: '1px solid rgba(129,140,248,0.2)', padding: '2px 8px', borderRadius: 3, fontWeight: 700 }}>{symbol}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deterministic indicator-pattern comparison from completed Upstox daily candles.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Instrument<select aria-label="Select stock or index" value={symbol} onChange={e => setSymbol(e.target.value)} style={{ display: 'block', minWidth: 150, marginTop: 4 }}>{symbols.map(item => <option key={item}>{item}</option>)}</select></label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Forward horizon<select aria-label="Select analysis horizon" value={horizon} onChange={e => setHorizon(Number(e.target.value) as AnalysisHorizon)} style={{ display: 'block', minWidth: 125, marginTop: 4 }}>{ANALYSIS_HORIZONS.map(item => <option key={item} value={item}>{item} trading sessions</option>)}</select></label>
        </div>
      </div>

      {loading && <div className="card" role="status" style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Fetching completed historical candles and calculating indicator matches for {symbol}…</div>}
      {!loading && error && <div className="card" role="alert" style={{ padding: 18, borderColor: 'rgba(239,68,68,0.3)' }}><div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 5 }}>Historical analysis unavailable</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{error}</div><button className="btn-ghost" onClick={() => setReloadKey(value => value + 1)} style={{ marginTop: 10, fontSize: 12 }}>Retry</button></div>}

      {!loading && !error && analysis && <>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Data period: <span className="mono">{formatDate(analysis.dataPeriod.from)} – {formatDate(analysis.dataPeriod.to)}</span> · {analysis.candleCount.toLocaleString()} completed candles · As of {formatDate(analysis.asOfDate)} · Updated {formatUpdated(lastUpdatedAt)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {summaryCards.map(card => <div key={card.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>{card.label}</div>
            <div className="mono" style={{ fontSize: 25, fontWeight: 700, color: card.color, lineHeight: 1.1, marginBottom: 5 }}>{card.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{card.sub}</div>
          </div>)}
        </div>

        {selected?.validMatchCount === 0 && <div className="card" style={{ padding: 13, color: 'var(--yellow)', fontSize: 12, borderColor: 'rgba(245,158,11,0.25)' }}>No historical setups met the {analysis.method.minimumSimilarityPct}% similarity threshold with enough completed future candles for this horizon.</div>}
        {!!selected && selected.validMatchCount > 0 && selected.validMatchCount < 5 && <div className="card" style={{ padding: 13, color: 'var(--yellow)', fontSize: 12, borderColor: 'rgba(245,158,11,0.25)' }}>Small historical sample: only {selected.validMatchCount} qualifying setups. This percentage is descriptive of those dates, not a guaranteed probability.</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, alignItems: 'start' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 3 }}>Historical Forward Outcomes</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Positive close-to-close returns among independently spaced matches at each horizon.</div>
            <ResponsiveContainer width="100%" height={205}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="horizon" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} formatter={(value: any, _name: any, item: any) => [value === null ? 'Insufficient matches' : `${Number(value).toFixed(1)}% (${item.payload.matches} matches)`, 'Positive historical outcomes']} />
                <Bar dataKey="positive" radius={[3, 3, 0, 0]}>
                  {chartData.map(item => <Cell key={item.horizon} fill="rgba(34,197,94,0.65)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginTop: 6 }}>
              {[
                ['Average return', formatPct(selected?.averageReturn ?? null)], ['Median return', formatPct(selected?.medianReturn ?? null)],
                ['Maximum favourable excursion', formatPct(selected?.maximumFavourableExcursion ?? null)], ['Maximum adverse excursion', formatPct(selected?.maximumAdverseExcursion ?? null)],
              ].map(([label, value]) => <div key={label} style={{ padding: '9px 8px', background: 'var(--bg-surface)', borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div><div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>)}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 3 }}>Closest Historical Setups</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Showing up to 10 closest dates; aggregate statistics use all {selected?.validMatchCount || 0} qualifying non-overlapping matches.</div>
            {!selected?.matches.length ? <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '18px 0' }}>No qualifying matching dates for this horizon.</div> : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 480 }}>
                <thead><tr><th>Date</th><th>Similarity</th><th>Return</th><th>MFE</th><th>MAE</th></tr></thead>
                <tbody>{selected.matches.map(match => <tr key={match.date}>
                  <td className="mono" style={{ fontSize: 10 }}>{formatDate(match.date)}</td>
                  <td className="mono" style={{ fontSize: 10 }}>{match.similarity.toFixed(1)}%</td>
                  <td className="mono" style={{ fontSize: 10, color: match.forwardReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPct(match.forwardReturn)}</td>
                  <td className="mono" style={{ fontSize: 10, color: 'var(--green)' }}>{formatPct(match.favourableExcursion)}</td>
                  <td className="mono" style={{ fontSize: 10, color: 'var(--red)' }}>{formatPct(match.adverseExcursion)}</td>
                </tr>)}</tbody>
              </table>
            </div>}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10 }}>Forward return uses the close {horizon} sessions after each setup. MFE/MAE use the highest high and lowest low during those future sessions.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 8 }}>Similarity Method</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <li>Each completed candle is represented by {analysis.featureCount} current-and-past-only features: {analysis.featureNames.join(', ')}.</li>
              <li>Features are scaled by 1.4826 × historical median absolute deviation; standard deviation is the fallback when MAD is zero.</li>
              <li>Distance is the root mean square of the scaled feature differences. Similarity = 100 × exp(−distance / 2); only scores of at least {analysis.method.minimumSimilarityPct}% qualify.</li>
              <li>Eligible historical setups must have all {horizon} future candles. Greedy closest-first selection spaces retained setup dates by at least {horizon} sessions.</li>
            </ol>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 9 }}>Non-overlap reduces duplicate forward windows; it does not make market regimes statistically independent. No feature-importance or trained-model claims are made.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 8 }}>Data and Interpretation</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The current-day candle is excluded. Historical setup outcomes stop before the current completed candle, and any setup without the full selected future horizon is excluded. A positive historical outcome percentage describes this matched sample only; it is not a forecast or guaranteed probability.
            </div>
            <div style={{ marginTop: 10, padding: 9, background: 'var(--bg-surface)', borderRadius: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              Data interval: daily OHLCV · VWAP is anchored to the first candle in the fetched five-year range · Feature set: {analysis.featureCount} indicators/derived values · {selected?.validMatchCount || 0} valid matches for {horizon} sessions.
            </div>
          </div>
        </div>
      </>}
    </div>
  )
}

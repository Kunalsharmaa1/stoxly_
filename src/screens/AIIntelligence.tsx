'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const outcomeData = [
  { period: '1D', positive: 62, negative: 38 },
  { period: '3D', positive: 68, negative: 32 },
  { period: '5D', positive: 76, negative: 24 },
  { period: '10D', positive: 71, negative: 29 },
  { period: '20D', positive: 65, negative: 35 },
]

const featureImportance = [
  { feature: 'RSI Pattern', value: 0.28 },
  { feature: 'EMA Distance', value: 0.22 },
  { feature: 'Volume Ratio', value: 0.19 },
  { feature: 'MACD Signal', value: 0.16 },
  { feature: 'Momentum', value: 0.09 },
  { feature: 'Volatility', value: 0.06 },
]

const historicalCases = [
  { date: 'Mar 2024', outcome: '+3.1%', positive: true, sim: 94 },
  { date: 'Oct 2023', outcome: '+1.8%', positive: true, sim: 91 },
  { date: 'Jan 2024', outcome: '+4.2%', positive: true, sim: 88 },
  { date: 'Jun 2023', outcome: '-1.4%', positive: false, sim: 85 },
  { date: 'Aug 2023', outcome: '+2.9%', positive: true, sim: 83 },
  { date: 'Apr 2023', outcome: '+0.6%', positive: true, sim: 81 },
]

export default function AIIntelligence() {
  return (
    <div style={{ padding: 24, maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16, color: 'var(--ai)' }}>✦</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>AI Intelligence</h1>
          <span style={{ fontSize: 10, background: 'var(--ai-muted)', color: 'var(--ai)', border: '1px solid rgba(129,140,248,0.2)', padding: '2px 8px', borderRadius: 3, fontWeight: 700 }}>RELIANCE</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Machine-learning analysis based on historical market patterns · Updated 14:32 IST</p>
      </div>

      {/* Top AI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: '5-Day Positive Return Probability', value: '76%', sub: 'Based on 42 similar setups', accent: 'var(--ai)', bg: 'var(--ai-muted)' },
          { label: 'Historical Pattern Similarity', value: '87%', sub: 'Nearest match: Mar 2024', accent: 'var(--ai-purple)', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Expected Historical Return', value: '+2.4%', sub: 'Median of positive outcomes', accent: 'var(--green)', bg: 'var(--green-muted)' },
          { label: 'Model Confidence', value: 'High', sub: 'Random Forest · XGBoost', accent: 'var(--text-secondary)', bg: 'rgba(90,98,112,0.08)' },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: 16, borderColor: m.accent === 'var(--ai)' ? 'rgba(129,140,248,0.25)' : 'var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: m.accent, lineHeight: 1.1, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Historical Pattern Analysis */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div className="section-title">Historical Pattern Analysis</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Similar historical setups found in past data</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Similar Cases', value: '42', color: 'var(--text-primary)' },
              { label: 'Positive', value: '31', color: 'var(--green)' },
              { label: 'Negative', value: '11', color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 5, padding: '10px 8px' }}>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Outcome distribution chart */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Outcome Distribution by Horizon</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={outcomeData} barSize={20} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                formatter={(v: any, name: any) => [`${v}%`, name === 'positive' ? 'Positive' : 'Negative']}
              />
              <Bar dataKey="positive" stackId="a" fill="rgba(34,197,94,0.6)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="negative" stackId="a" fill="rgba(239,68,68,0.4)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Historical cases */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Most Similar Historical Cases</div>
            {historicalCases.map(c => (
              <div key={c.date} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBlock: 5, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 56 }}>{c.date}</span>
                <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${c.sim}%`, height: '100%', background: 'var(--ai)', borderRadius: 2 }} />
                </div>
                <span className="mono" style={{ fontSize: 11, width: 30, textAlign: 'right', color: 'var(--text-muted)' }}>{c.sim}%</span>
                <span className="mono" style={{ fontSize: 11, width: 44, textAlign: 'right', fontWeight: 600, color: c.positive ? 'var(--green)' : 'var(--red)' }}>{c.outcome}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Feature Importance */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 4 }}>Feature Importance</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>Contribution of each factor to the model's prediction</div>
            {featureImportance.map((f, i) => (
              <div key={f.feature} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.feature}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ai)' }}>{(f.value * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${f.value * 100}%`, height: '100%', borderRadius: 3,
                    background: `rgba(129,140,248,${0.9 - i * 0.1})`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Explainable AI */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ color: 'var(--ai)', fontSize: 13 }}>✦</span>
              <span className="section-title">Why does the model see this setup?</span>
            </div>
            {[
              { text: 'Price above EMA20 — momentum positive', ok: true },
              { text: 'RSI (58) in neutral-bullish zone, not overbought', ok: true },
              { text: 'Relative volume 1.4× above 20-day average', ok: true },
              { text: 'MACD signal line crossover — 3 sessions ago', ok: true },
              { text: 'RSI structure resembles historical positive setups', ok: true },
              { text: 'Broader NIFTY 50 trend supportive (+0.62% today)', ok: true },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                <span style={{ color: item.ok ? 'var(--green)' : 'var(--red)', fontSize: 12, marginTop: 1, flexShrink: 0 }}>{item.ok ? '✓' : '✗'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Model info */}
          <div className="card" style={{ padding: 14, background: 'var(--bg-surface)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Model Information</div>
            {[
              ['Algorithm', 'Random Forest + XGBoost Ensemble'],
              ['Training Period', 'Jan 2010 – Dec 2022'],
              ['Validation Period', 'Jan 2023 – Jun 2024'],
              ['Test Period', 'Jul 2024 – Present'],
              ['Features', '47 technical indicators'],
              ['Accuracy (Test)', '68.4%'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 5, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                <span className="mono" style={{ fontSize: 11 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--yellow)', lineHeight: 1.5 }}>
                ⚠ AI outputs are statistical estimates based on historical data and are not guaranteed predictions. Do not rely solely on AI outputs for trading decisions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

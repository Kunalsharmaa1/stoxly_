'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, ComposedChart } from 'recharts'

const holdings = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', qty: 50, avg: '₹1,248.00', curr: '₹1,307.80', inv: '₹62,400', val: '₹65,390', pl: '+₹2,990', plPct: '+4.79%', pos: true },
  { ticker: 'TCS', name: 'Tata Consultancy Svcs', qty: 18, avg: '₹3,182.00', curr: '₹3,245.60', inv: '₹57,276', val: '₹58,421', pl: '+₹1,145', plPct: '+2.00%', pos: true },
  { ticker: 'INFY', name: 'Infosys Ltd', qty: 40, avg: '₹1,901.00', curr: '₹1,876.40', inv: '₹76,040', val: '₹75,056', pl: '-₹984', plPct: '-1.29%', pos: false },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', qty: 35, avg: '₹1,695.00', curr: '₹1,712.25', inv: '₹59,325', val: '₹59,929', pl: '+₹604', plPct: '+1.02%', pos: true },
  { ticker: 'SBIN', name: 'State Bank of India', qty: 100, avg: '₹784.00', curr: '₹821.90', inv: '₹78,400', val: '₹82,190', pl: '+₹3,790', plPct: '+4.83%', pos: true },
  { ticker: 'HAL', name: 'Hindustan Aeronautics', qty: 15, avg: '₹3,980.00', curr: '₹4,123.50', inv: '₹59,700', val: '₹61,853', pl: '+₹2,153', plPct: '+3.61%', pos: true },
]

const alloc = [
  { name: 'RELIANCE', value: 65390, color: '#22c55e' },
  { name: 'TCS', value: 58421, color: '#818cf8' },
  { name: 'SBIN', value: 82190, color: '#f59e0b' },
  { name: 'HDFCBANK', value: 59929, color: '#a78bfa' },
  { name: 'INFY', value: 75056, color: '#6366f1' },
  { name: 'HAL', value: 61853, color: '#34d399' },
]

const sectorAlloc = [
  { name: 'IT / Technology', value: 35, color: '#818cf8' },
  { name: 'Banking / Finance', value: 34, color: '#6366f1' },
  { name: 'Energy / Conglom.', value: 16, color: '#22c55e' },
  { name: 'Defence / Aero', value: 15, color: '#a78bfa' },
]

const perfData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i],
  value: 500000 + i * 6800 + (Math.sin(i * 0.8) * 8000),
}))

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.08) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>{name}</text>
}

export default function Portfolio() {
  const totalVal = holdings.reduce((s, h) => s + parseInt(h.val.replace(/[^0-9]/g, '')), 0)

  return (
    <div style={{ padding: 24, maxWidth: 1300, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Portfolio</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your holdings and performance overview</p>
      </div>

      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Portfolio Value', value: '₹4,02,839', sub: 'As of today', color: 'var(--text-primary)' },
          { label: 'Total Invested', value: '₹3,93,141', sub: 'Deployed capital', color: 'var(--text-primary)' },
          { label: 'Overall P&L', value: '+₹9,698', sub: '+2.47% total return', color: 'var(--green)' },
          { label: "Today's P&L", value: '+₹3,241', sub: '+0.81% today', color: 'var(--green)' },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Holdings table */}
          <div className="card">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span className="section-title">Holdings</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Current Price</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>P&L</th>
                  <th>P&L %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.ticker}>
                    <td>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{h.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.name}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{h.qty}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{h.avg}</td>
                    <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{h.curr}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.inv}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{h.val}</td>
                    <td className="mono" style={{ fontSize: 12, color: h.pos ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{h.pl}</td>
                    <td>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: h.pos ? 'var(--green-muted)' : 'var(--red-muted)', color: h.pos ? 'var(--green)' : 'var(--red)' }}>{h.plPct}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance chart */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Portfolio Performance (12 Months)</div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={perfData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                  formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Portfolio']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2} fill="rgba(34,197,94,0.08)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: charts + AI insight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Stock Allocation</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={alloc} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" labelLine={false} label={renderLabel}>
                  {alloc.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Sector Allocation</div>
            {sectorAlloc.map(s => (
              <div key={s.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: s.color }}>{s.value}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${s.value}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          {/* AI Portfolio insight */}
          <div className="card" style={{ padding: 14, borderColor: 'rgba(129,140,248,0.2)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ color: 'var(--ai)', fontSize: 13 }}>✦</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>AI Portfolio Insight</span>
            </div>
            {[
              { text: 'Your portfolio has 34% exposure to Banking & Financial Services — consider diversifying.', icon: '⚠', color: 'var(--yellow)' },
              { text: 'Portfolio diversification score: 72/100 — moderate diversification.', icon: '◎', color: 'var(--ai)' },
              { text: 'SBIN and RELIANCE are showing the highest AI probability signals today.', icon: '✦', color: 'var(--green)' },
            ].map((i, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={{ color: i.color, fontSize: 12, flexShrink: 0 }}>{i.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{i.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

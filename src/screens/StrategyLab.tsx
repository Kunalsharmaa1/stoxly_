'use client'

import { useEffect, useState } from 'react'
import type { Screen } from '@/types'
import { getDefaultIndicatorConfig, getIndicatorOutputs, getIndicatorParameterRules, INDICATORS, normalizeIndicatorConfig, type IndicatorConfig, type StrategyCondition } from '@/lib/backtest/indicators'

type Condition = StrategyCondition

interface Props { onNavigate: (s: Screen) => void }

const operators = ['<', '>', '<=', '>=', '=', 'crosses above', 'crosses below']

function safeConfig(config: IndicatorConfig): IndicatorConfig {
  try { return normalizeIndicatorConfig(config) } catch { return getDefaultIndicatorConfig('RSI') }
}
function describeConfig(config: IndicatorConfig): string {
  const normalized = safeConfig(config)
  const params = Object.entries(normalized.params || {}).map(([key, value]) => `${key}=${value}`).join(', ')
  return `${normalized.indicator}${normalized.output && normalized.output !== 'Value' ? ` ${normalized.output}` : ''}${params ? ` (${params})` : ''}`
}

function IndicatorParameterInput({ label, name, value, rule, onCommit }: { label: string; name: string; value: number; rule: { kind: 'integer' | 'decimal'; min: number; max: number }; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => {
    const parsed = draft.trim() ? Number(draft) : NaN
    if (Number.isFinite(parsed) && parsed >= rule.min && parsed <= rule.max && (rule.kind !== 'integer' || Number.isInteger(parsed))) onCommit(parsed)
    else setDraft(String(value))
  }
  return <label style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>{name}<input aria-label={`${label} ${name}`} type="number" min={rule.min} max={rule.max} step={rule.kind === 'integer' ? 1 : 'any'} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} style={{ width: 66 }} /></label>
}

const ConditionRow = ({ cond, onChange, onRemove, join }: {
  cond: Condition; onChange: (c: Condition) => void; onRemove: () => void; join?: string
}) => {
  if (!cond) return null
  const left = safeConfig(cond)
  const legacyRight = /^(Price|EMA\s+\d+|SMA\s+\d+)$/i.test(cond.value)
  const right = cond.valueIndicator ? safeConfig(cond.valueIndicator) : legacyRight ? safeConfig({ indicator: cond.value }) : null
  const updateLeft = (config: IndicatorConfig) => onChange({ ...cond, ...config, indicator: config.indicator })
  const updateRight = (config: IndicatorConfig) => onChange({ ...cond, value: '', valueIndicator: config })
  const renderConfig = (config: IndicatorConfig, update: (next: IndicatorConfig) => void, label: string) => {
    const normalized = safeConfig(config)
    const id = normalized.indicator as string
    return <>
      <select aria-label={`${label} indicator`} value={id} onChange={e => update(getDefaultIndicatorConfig(e.target.value))} style={{ flex: '1 1 130px' }}>
        {INDICATORS.map(indicator => <option key={indicator}>{indicator}</option>)}
      </select>
      {getIndicatorOutputs(id).length > 1 && <select aria-label={`${label} output line`} value={normalized.output} onChange={e => update({ ...normalized, output: e.target.value })} style={{ flex: '1 1 110px' }}>
        {getIndicatorOutputs(id).map(output => <option key={output}>{output}</option>)}
      </select>}
      {Object.entries(normalized.params || {}).map(([key, value]) => <IndicatorParameterInput key={key} label={label} name={key} value={value} rule={getIndicatorParameterRules(id)[key]} onCommit={next => update({ ...normalized, params: { ...normalized.params, [key]: next } })} />)}
    </>
  }
  return (
    <div>
      {join && (
        <div style={{ padding: '4px 0 4px 4px', fontSize: 10, fontWeight: 700, color: 'var(--ai)', letterSpacing: '0.08em' }}>{join}</div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {renderConfig(left, updateLeft, 'Condition')}
        <select value={cond.operator || '<'} onChange={e => onChange({ ...cond, operator: e.target.value })} style={{ flex: '0 0 130px' }}>
          {operators.map(o => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Comparison value type" value={right ? 'indicator' : 'number'} onChange={e => e.target.value === 'indicator' ? updateRight(getDefaultIndicatorConfig('EMA')) : onChange({ ...cond, valueIndicator: undefined, value: cond.value && !/^(Price|EMA\s+\d+|SMA\s+\d+)$/i.test(cond.value) ? cond.value : '0' })} style={{ flex: '0 0 95px' }}>
          <option value="number">Number</option><option value="indicator">Indicator</option>
        </select>
        {right ? renderConfig(right, updateRight, 'Comparison') : <input aria-label="Comparison number" type="number" value={cond.value || ''} onChange={e => onChange({ ...cond, value: e.target.value })} style={{ flex: '1 1 90px' }} />}
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
      </div>
    </div>
  )
}

export default function StrategyLab({ onNavigate }: Props) {
  const [name, setName] = useState('RSI Momentum Strategy')
  const [stock, setStock] = useState('RELIANCE')
  const [tf, setTf] = useState('1D')
  const [from, setFrom] = useState('2022')
  const [to, setTo] = useState('2026')
  const [capital, setCapital] = useState('100000')
  const [stopLoss, setStopLoss] = useState('2')
  const [takeProfit, setTakeProfit] = useState('5')
  const [posSize, setPosSize] = useState('100')
  const [joinType, setJoinType] = useState<'AND' | 'OR'>('AND')
  const [exitJoin, setExitJoin] = useState<'AND' | 'OR'>('OR')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiError, setAiError] = useState('')
  const [needsAiConfirmation, setNeedsAiConfirmation] = useState(false)

  const [entry, setEntry] = useState<Condition[]>([
    { indicator: 'Price', operator: 'crosses above', value: 'EMA 20' },
    { indicator: 'RSI', operator: '>', value: '45' },
  ])
  const [exit, setExit] = useState<Condition[]>([
    { indicator: 'Price', operator: 'crosses below', value: 'EMA 20' },
    { indicator: 'RSI', operator: '>', value: '70' },
  ])

  const addEntry = () => setEntry(p => [...p, { indicator: 'RSI', operator: '<', value: '50' }])
  const addExit = () => setExit(p => [...p, { indicator: 'RSI', operator: '>', value: '60' }])

  const handleGenerateStrategy = async () => {
    setAiBusy(true)
    setAiError('')
    setAiMessage('')
    try {
      const response = await fetch('/api/ai/strategy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, selectedSymbol: stock }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not generate strategy rules.')
      const strategy = result.strategy
      if (strategy.status === 'clarification') {
        setAiMessage(strategy.clarification)
        return
      }
      setName(strategy.name)
      setStock(strategy.symbol)
      setJoinType(strategy.joinType)
      setExitJoin(strategy.exitJoin)
      setEntry(strategy.entryConditions)
      setExit(strategy.exitConditions)
      setNeedsAiConfirmation(true)
      setAiMessage('Rules added below. Review and edit them, then confirm before running the backtest.')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Could not generate strategy rules.')
    } finally {
      setAiBusy(false)
    }
  }

  const handleRunBacktest = () => {
    const config = {
      name,
      symbol: stock,
      timeframe: tf,
      fromYear: from,
      toYear: to,
      capital: Number(capital) || 100000,
      stopLoss: Number(stopLoss) || 2,
      takeProfit: Number(takeProfit) || 5,
      posSize: Number(posSize) || 100,
      joinType,
      exitJoin,
      entryConditions: entry,
      exitConditions: exit,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('stoxly_active_strategy', JSON.stringify(config))
    }
    onNavigate('backtest')
  }

  return (
    <div style={{ padding: 24, maxWidth: 1300, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Strategy Lab</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Build, test, and analyze your trading strategies</p>
      </div>

      <section className="card" style={{ padding: 16, borderColor: 'rgba(139,92,246,0.35)' }}>
        <div className="section-title" style={{ marginBottom: 6 }}>AI Strategy Assistant</div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Describe entry and exit rules in plain language. Gemini translates conditions across the supported technical indicators; it does not calculate or invent performance results.</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <textarea aria-label="Describe your strategy" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} maxLength={2000} placeholder="Example: Buy RELIANCE when price crosses above EMA 20 and RSI is above 50. Exit when RSI crosses below 50." rows={3} style={{ flex: 1, resize: 'vertical', font: 'inherit', fontSize: 12, padding: 10, color: 'var(--text-primary)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4 }} />
          <button className="btn-primary" disabled={aiBusy || !aiPrompt.trim()} onClick={handleGenerateStrategy} style={{ alignSelf: 'flex-start', padding: '9px 14px', opacity: aiBusy || !aiPrompt.trim() ? 0.6 : 1 }}>{aiBusy ? 'Generating…' : 'Generate Rules'}</button>
        </div>
        {aiError && <p role="alert" style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{aiError}</p>}
        {aiMessage && <p role="status" style={{ color: aiError ? 'var(--red)' : 'var(--ai)', fontSize: 12, marginTop: 8 }}>{aiMessage}</p>}
        {needsAiConfirmation && <button className="btn-ghost" onClick={() => setNeedsAiConfirmation(false)} style={{ marginTop: 8, fontSize: 12, color: 'var(--green)' }}>Confirm reviewed rules</button>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Meta */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Strategy Configuration</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Strategy Name</div>
                <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Stock / Instrument</div>
                <select value={stock} onChange={e => setStock(e.target.value)} style={{ width: '100%' }}>
                  {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'HAL', 'WIPRO', 'ICICIBANK', 'NIFTY50', 'SENSEX', 'BANKNIFTY'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Timeframe</div>
                <select value={tf} onChange={e => setTf(e.target.value)} style={{ width: '100%' }}>
                  {['1D', '4H', '1H', '15M', '1W'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Initial Capital (₹)</div>
                <input value={capital} onChange={e => setCapital(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Backtest From</div>
                <select value={from} onChange={e => setFrom(e.target.value)} style={{ width: '100%' }}>
                  {['2018', '2019', '2020', '2021', '2022', '2023'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Backtest To</div>
                <select value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%' }}>
                  {['2023', '2024', '2025', '2026'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Entry Conditions */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="section-title">Entry Conditions</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Open a position when all conditions are met</div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {(['AND', 'OR'] as const).map(j => (
                  <button key={j} onClick={() => setJoinType(j)} style={{
                    padding: '3px 10px', borderRadius: 3, border: '1px solid',
                    borderColor: joinType === j ? 'var(--green)' : 'var(--border)',
                    background: joinType === j ? 'var(--green-muted)' : 'transparent',
                    color: joinType === j ? 'var(--green)' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{j}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entry.map((c, i) => (
                <ConditionRow key={i} cond={c} join={i > 0 ? joinType : undefined}
                  onChange={nc => setEntry(p => p.map((x, j) => j === i ? nc : x))}
                  onRemove={() => setEntry(p => p.filter((_, j) => j !== i))} />
              ))}
            </div>
            <button onClick={addEntry} className="btn-ghost" style={{ marginTop: 10, fontSize: 12, color: 'var(--green)' }}>+ Add Condition</button>
          </div>

          {/* Exit Conditions */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="section-title">Exit Conditions</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Close position when any condition is met</div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {(['AND', 'OR'] as const).map(j => (
                  <button key={j} onClick={() => setExitJoin(j)} style={{
                    padding: '3px 10px', borderRadius: 3, border: '1px solid',
                    borderColor: exitJoin === j ? 'var(--red)' : 'var(--border)',
                    background: exitJoin === j ? 'var(--red-muted)' : 'transparent',
                    color: exitJoin === j ? 'var(--red)' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{j}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exit.map((c, i) => (
                <ConditionRow key={i} cond={c} join={i > 0 ? exitJoin : undefined}
                  onChange={nc => setExit(p => p.map((x, j) => j === i ? nc : x))}
                  onRemove={() => setExit(p => p.filter((_, j) => j !== i))} />
              ))}
            </div>
            <button onClick={addExit} className="btn-ghost" style={{ marginTop: 10, fontSize: 12, color: 'var(--red)' }}>+ Add Condition</button>
          </div>

          {/* Risk Management */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Risk Management</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Stop Loss %</div>
                <div style={{ position: 'relative' }}>
                  <input value={stopLoss} onChange={e => setStopLoss(e.target.value)} style={{ width: '100%', paddingRight: 24 }} />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--red)' }}>%</span>
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Take Profit %</div>
                <div style={{ position: 'relative' }}>
                  <input value={takeProfit} onChange={e => setTakeProfit(e.target.value)} style={{ width: '100%', paddingRight: 24 }} />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--green)' }}>%</span>
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Position Size %</div>
                <div style={{ position: 'relative' }}>
                  <input value={posSize} onChange={e => setPosSize(e.target.value)} style={{ width: '100%', paddingRight: 24 }} />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn-primary" disabled={needsAiConfirmation} style={{ padding: '10px 24px', fontSize: 14, alignSelf: 'flex-start', opacity: needsAiConfirmation ? 0.55 : 1 }} onClick={handleRunBacktest}>
            {needsAiConfirmation ? 'Confirm AI Rules Before Running' : '▶ Run Backtest'}
          </button>
        </div>

        {/* Strategy Flow */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Strategy Logic</div>

            {/* Flow visualization */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              {/* Entry box */}
              <div style={{ width: '100%', background: 'var(--green-muted)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Entry Signal</div>
                {entry.map((c, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, padding: '3px 0' }}>{joinType}</div>}
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 3, marginBottom: 3 }}>
                      {describeConfig(c)} {c.operator} {c.valueIndicator ? describeConfig(c.valueIndicator) : c.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
                <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 3 }}>POSITION OPEN</div>
                <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
              </div>

              {/* Risk */}
              <div style={{ width: '100%', background: 'rgba(90,98,112,0.08)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stop Loss</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginTop: 2 }}>{stopLoss}%</div>
                </div>
                <div style={{ textAlign: 'center', borderInline: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Position</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ai)', marginTop: 2 }}>{posSize}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>{takeProfit}%</div>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
                <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 3 }}>MONITOR</div>
                <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
              </div>

              {/* Exit box */}
              <div style={{ width: '100%', background: 'var(--red-muted)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Exit Signal</div>
                {exit.map((c, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, padding: '3px 0' }}>{exitJoin}</div>}
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 3, marginBottom: 3 }}>
                      {describeConfig(c)} {c.operator} {c.valueIndicator ? describeConfig(c.valueIndicator) : c.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config summary */}
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 5 }}>
              {[
                ['Stock', stock],
                ['Timeframe', tf],
                ['Period', `${from} – ${to}`],
                ['Capital', `₹${(parseInt(String(capital).replace(/[^0-9]/g, ''), 10) || 100000).toLocaleString('en-IN')}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

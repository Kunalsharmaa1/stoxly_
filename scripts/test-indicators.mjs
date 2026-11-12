import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateIndicator, conditionsMet, validateConditions } from '../src/lib/backtest/indicators.ts'

function candlesFrom(closes) {
  return closes.map((close, index) => ({
    open: close - 0.3,
    high: close + 1 + (index % 3) * 0.2,
    low: close - 1 - (index % 2) * 0.1,
    close,
    volume: 1000 + index * 17,
  }))
}

const candles = candlesFrom(Array.from({ length: 100 }, (_, i) => 100 + i * 0.45 + Math.sin(i * 0.7) * 5))
const indicatorCases = [
  ['Price', 'Close', {}, 0], ['Volume', 'Volume', {}, 0], ['RSI', 'Value', { period: 14 }, 14],
  ['EMA', 'Value', { period: 20 }, 19], ['SMA', 'Value', { period: 50 }, 49], ['VWAP', 'Value', {}, 0],
  ['MACD', 'MACD Line', {}, 25], ['MACD', 'Signal Line', {}, 33], ['MACD', 'Histogram', {}, 33],
  ['Bollinger Bands', 'Upper Band', {}, 19], ['Bollinger Bands', 'Middle Band', {}, 19], ['Bollinger Bands', 'Lower Band', {}, 19],
  ['ATR', 'Value', { period: 14 }, 14], ['ADX', 'ADX', { period: 14 }, 27], ['ADX', '+DI', { period: 14 }, 14], ['ADX', '-DI', { period: 14 }, 14],
  ['Stochastic Oscillator', '%K', {}, 13], ['Stochastic Oscillator', '%D', {}, 15],
  ['Supertrend', 'Value', {}, 10], ['Supertrend', 'Direction', {}, 10], ['CCI', 'Value', {}, 19], ['OBV', 'Value', {}, 0],
  ['ROC', 'Value', {}, 12], ['Williams %R', 'Value', {}, 13], ['MFI', 'Value', {}, 14], ['Parabolic SAR', 'Value', {}, 1],
]

test('calculates every supported indicator output and respects warm-up boundaries', () => {
  for (const [indicator, output, params, firstValid] of indicatorCases) {
    const values = calculateIndicator(candles, { indicator, output, params })
    assert.equal(values.length, candles.length, `${indicator} ${output} length`)
    assert.ok(values.slice(0, firstValid).every(value => value === null), `${indicator} ${output} warm-up`)
    assert.notEqual(values[firstValid], null, `${indicator} ${output} first valid index`)
    assert.ok(values.slice(firstValid).some(Number.isFinite), `${indicator} ${output} has numeric values`)
  }
})

test('computes standard values for configured simple series', () => {
  const flat = candlesFrom([10, 12, 14, 16])
  assert.deepEqual(calculateIndicator(flat, { indicator: 'SMA', params: { period: 2 } }), [null, 11, 13, 15])
  assert.deepEqual(calculateIndicator(flat, { indicator: 'EMA', params: { period: 2 } }), [null, 11, 13, 15])
  assert.equal(calculateIndicator(flat, { indicator: 'ROC', params: { period: 2 } })[2], 40)
  assert.equal(calculateIndicator(flat, { indicator: 'OBV' })[3], 3000 + 17 + 34 + 51)
})

test('checks indicator formulas and multi-output relationships', () => {
  const rising = candlesFrom(Array.from({ length: 20 }, (_, i) => 50 + i))
  assert.ok(Math.abs(calculateIndicator(rising, { indicator: 'RSI', params: { period: 14 } })[14] - 99.00990099) < 1e-6)
  const vwap = calculateIndicator(candles, { indicator: 'VWAP' })
  const c0 = candles[0], c1 = candles[1]
  const firstPv = ((c0.high + c0.low + c0.close) / 3) * c0.volume
  const expectedVwap1 = (firstPv + ((c1.high + c1.low + c1.close) / 3) * c1.volume) / (c0.volume + c1.volume)
  assert.ok(Math.abs(vwap[1] - expectedVwap1) < 1e-7)
  const macd = calculateIndicator(candles, { indicator: 'MACD', output: 'MACD Line' })
  const signal = calculateIndicator(candles, { indicator: 'MACD', output: 'Signal Line' })
  const histogram = calculateIndicator(candles, { indicator: 'MACD', output: 'Histogram' })
  assert.ok(Math.abs(histogram[40] - (macd[40] - signal[40])) < 1e-7)
  const upper = calculateIndicator(candles, { indicator: 'Bollinger Bands', output: 'Upper Band' })
  const middle = calculateIndicator(candles, { indicator: 'Bollinger Bands', output: 'Middle Band' })
  const lower = calculateIndicator(candles, { indicator: 'Bollinger Bands', output: 'Lower Band' })
  assert.ok(upper[40] > middle[40] && middle[40] > lower[40])
  const plusDI = calculateIndicator(candles, { indicator: 'ADX', output: '+DI' })
  const minusDI = calculateIndicator(candles, { indicator: 'ADX', output: '-DI' })
  assert.ok(plusDI[40] >= 0 && minusDI[40] >= 0 && plusDI[40] <= 100 && minusDI[40] <= 100)
  const k = calculateIndicator(candles, { indicator: 'Stochastic Oscillator', output: '%K' })
  const d = calculateIndicator(candles, { indicator: 'Stochastic Oscillator', output: '%D' })
  assert.ok(k[40] >= 0 && k[40] <= 100 && d[40] >= 0 && d[40] <= 100)
  const direction = calculateIndicator(candles, { indicator: 'Supertrend', output: 'Direction' })
  assert.ok([-1, 1].includes(direction[40]))
  const atr = calculateIndicator(candles, { indicator: 'ATR', params: { period: 14 } })
  assert.ok(atr[40] > 0)
  const cci = calculateIndicator(candles, { indicator: 'CCI' })
  assert.ok(Number.isFinite(cci[40]))
  const roc = calculateIndicator(candles, { indicator: 'ROC' })
  assert.ok(Math.abs(roc[20] - (candles[20].close / candles[8].close - 1) * 100) < 1e-6)
  const williams = calculateIndicator(candles, { indicator: 'Williams %R' })
  const hh = Math.max(...candles.slice(40 - 13, 41).map(c => c.high))
  const ll = Math.min(...candles.slice(40 - 13, 41).map(c => c.low))
  assert.ok(Math.abs(williams[40] - (-100 * (hh - candles[40].close) / (hh - ll))) < 1e-6)
  assert.ok(calculateIndicator(candles, { indicator: 'MFI' })[40] >= 0)
  assert.ok(Number.isFinite(calculateIndicator(candles, { indicator: 'Parabolic SAR' })[40]))
})

test('evaluates comparisons and both crossover directions from previous/current candles', () => {
  const sequence = candlesFrom([10, 11, 9, 9, 11, 10])
  const cache = () => new Map()
  const at = (operator, value, index) => conditionsMet([{ indicator: 'Price', operator, value }], 'AND', index, sequence, cache())
  assert.equal(at('>', '10', 1), true)
  assert.equal(at('<', '10', 2), true)
  assert.equal(at('>=', '11', 1), true)
  assert.equal(at('<=', '9', 2), true)
  assert.equal(at('=', '10', 0), true)
  assert.equal(at('crosses above', '10', 4), true)
  assert.equal(at('crosses below', '10', 2), true)
  assert.equal(at('crosses above', '10', 0), false)
})

test('crosses between two configured indicator series', () => {
  const sequence = candlesFrom([10, 12, 8, 7, 6])
  assert.equal(conditionsMet([{
    indicator: 'Price', operator: 'crosses below', value: '',
    valueIndicator: { indicator: 'SMA', params: { period: 2 } },
  }], 'AND', 2, sequence, new Map()), true)
})

test('preserves multiple-condition AND/OR behavior and legacy default strategy forms', () => {
  const sequence = candlesFrom([10, 11, 9, 12])
  const above = { indicator: 'Price', operator: '>', value: '10' }
  const below = { indicator: 'Price', operator: '<', value: '10' }
  assert.equal(conditionsMet([above, below], 'AND', 1, sequence, new Map()), false)
  assert.equal(conditionsMet([above, below], 'OR', 1, sequence, new Map()), true)
  const legacy = [
    { indicator: 'Price', operator: 'crosses above', value: 'EMA 20' },
    { indicator: 'RSI', operator: '>', value: '45' },
  ]
  validateConditions(legacy, 'Entry conditions')
  assert.equal(typeof conditionsMet(legacy, 'AND', 30, candles, new Map()), 'boolean')
  const defaultExit = [
    { indicator: 'Price', operator: 'crosses below', value: 'EMA 20' },
    { indicator: 'RSI', operator: '>', value: '70' },
  ]
  validateConditions(defaultExit, 'Exit conditions')
  assert.equal(typeof conditionsMet(defaultExit, 'OR', 30, candles, new Map()), 'boolean')
})

test('rejects invalid periods, output names, and unsupported operators', () => {
  assert.throws(() => calculateIndicator(candles, { indicator: 'RSI', params: { period: 0 } }))
  assert.throws(() => calculateIndicator(candles, { indicator: 'MACD', output: 'Unknown' }))
  assert.throws(() => validateConditions([{ indicator: 'Price', operator: 'contains', value: '1' }], 'Entry conditions'))
})

test('indicator outputs at an index are unchanged when later candles are added', () => {
  const prefix = candles.slice(0, 60)
  for (const indicator of ['Price', 'Volume', 'RSI', 'EMA', 'SMA', 'VWAP', 'MACD', 'Bollinger Bands', 'ATR', 'ADX', 'Stochastic Oscillator', 'Supertrend', 'CCI', 'OBV', 'ROC', 'Williams %R', 'MFI', 'Parabolic SAR']) {
    const full = calculateIndicator(candles, { indicator })
    const early = calculateIndicator(prefix, { indicator })
    assert.deepEqual(full.slice(0, prefix.length), early, `${indicator} has no future-candle dependence`)
  }
})

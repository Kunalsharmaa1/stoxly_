import assert from 'node:assert/strict'
import test from 'node:test'
import { ANALYSIS_HORIZONS, analyzeHistoricalPatterns, calculateMarketFeatures } from '../src/lib/market-analysis.ts'

function sampleCandles(length = 520) {
  return Array.from({ length }, (_, index) => {
    const close = 150 + Math.sin(index * 0.18) * 12 + Math.sin(index * 0.037) * 5 + index * 0.012
    const date = new Date(Date.UTC(2020, 0, 1 + index)).toISOString().slice(0, 10)
    return { date, open: close - 0.4, high: close + 1.3, low: close - 1.1, close, volume: 500_000 + Math.floor((1 + Math.sin(index * 0.61)) * 80_000) }
  })
}

test('calculates real forward return and excursions for every requested horizon', () => {
  const candles = sampleCandles()
  const result = analyzeHistoricalPatterns('RELIANCE', candles)
  for (const horizon of ANALYSIS_HORIZONS) {
    const summary = result.horizons[horizon]
    assert.equal(summary.horizon, horizon)
    assert.ok(summary.validMatchCount > 0, `${horizon}-session sample should have recurring patterns`)
    assert.ok(summary.validMatchCount >= summary.matches.length)
    for (const match of summary.matches) {
      const index = candles.findIndex(candle => candle.date === match.date)
      assert.ok(index + horizon < candles.length - 1, 'match outcome ends before current setup')
      const future = candles.slice(index + 1, index + horizon + 1)
      assert.equal(match.forwardReturn, Number(((candles[index + horizon].close / candles[index].close - 1) * 100).toFixed(1)))
      assert.equal(match.favourableExcursion, Number(((Math.max(...future.map(c => c.high)) / candles[index].close - 1) * 100).toFixed(1)))
      assert.equal(match.adverseExcursion, Number(((Math.min(...future.map(c => c.low)) / candles[index].close - 1) * 100).toFixed(1)))
    }
    const indexes = summary.matches.map(match => candles.findIndex(candle => candle.date === match.date))
    for (let i = 0; i < indexes.length; i++) for (let j = i + 1; j < indexes.length; j++) assert.ok(Math.abs(indexes[i] - indexes[j]) >= horizon, 'retained match windows do not overlap')
  }
  assert.equal(result.symbol, 'RELIANCE')
  assert.equal(result.asOfDate, candles.at(-1).date)
  assert.equal(result.featureCount, result.featureNames.length)
})

test('feature values at a candle are unchanged when later candles are appended', () => {
  const full = sampleCandles()
  const prefix = full.slice(0, 200)
  const fullRows = calculateMarketFeatures(full)
  const prefixRows = calculateMarketFeatures(prefix)
  assert.deepEqual(fullRows[199], prefixRows[199])
})

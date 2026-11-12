import { calculateIndicator, type Candle } from "./backtest/indicators.ts";

export const ANALYSIS_HORIZONS = [1, 3, 5, 10, 20] as const;
export type AnalysisHorizon = (typeof ANALYSIS_HORIZONS)[number];
export type DatedCandle = Candle & { date: string };
export type HistoricalMatch = {
  date: string;
  similarity: number;
  forwardReturn: number;
  favourableExcursion: number;
  adverseExcursion: number;
};
export type HorizonAnalysis = {
  horizon: AnalysisHorizon;
  candidateCount: number;
  validMatchCount: number;
  positiveOutcomePct: number | null;
  averageReturn: number | null;
  medianReturn: number | null;
  maximumFavourableExcursion: number | null;
  maximumAdverseExcursion: number | null;
  matches: HistoricalMatch[];
};
export type MarketAnalysis = {
  symbol: string;
  asOfDate: string;
  dataPeriod: { from: string; to: string };
  candleCount: number;
  featureCount: number;
  featureNames: string[];
  method: { minimumSimilarityPct: number; nonOverlapSessions: string; distance: string };
  horizons: Record<AnalysisHorizon, HorizonAnalysis>;
};

type FeatureRow = Record<string, number | null>;
const MIN_SIMILARITY = 50;
const DISPLAY_MATCHES = 10;
const round1 = (value: number) => Number(value.toFixed(1));
const median = (values: number[]) => {
  const ordered = [...values].sort((a, b) => a - b);
  if (!ordered.length) return null;
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};
const valid = (value: number | null | undefined): value is number => value !== null && value !== undefined && Number.isFinite(value);

export function calculateMarketFeatures(candles: DatedCandle[]): FeatureRow[] {
  const closes = candles.map(c => c.close);
  const series = (indicator: string, output = "Value", params: Record<string, number> = {}) =>
    calculateIndicator(candles, { indicator, output, params });
  const rsi = series("RSI");
  const ema = series("EMA");
  const sma = series("SMA");
  const vwap = series("VWAP");
  const macd = series("MACD", "Histogram");
  const upper = series("Bollinger Bands", "Upper Band");
  const lower = series("Bollinger Bands", "Lower Band");
  const atr = series("ATR");
  const adx = series("ADX", "ADX");
  const plusDi = series("ADX", "+DI");
  const minusDi = series("ADX", "-DI");
  const stochastic = series("Stochastic Oscillator", "%K");
  const supertrend = series("Supertrend", "Direction");
  const cci = series("CCI");
  const obv = series("OBV");
  const roc = series("ROC");
  const williams = series("Williams %R");
  const mfi = series("MFI");
  const sar = series("Parabolic SAR");

  return candles.map((candle, i) => {
    const close = closes[i];
    const volWindowStart = Math.max(0, i - 19);
    const volumeWindow = candles.slice(volWindowStart, i + 1).map(c => c.volume);
    const avgVolume = volumeWindow.reduce((sum, value) => sum + value, 0) / volumeWindow.length;
    const obvStart = Math.max(0, i - 20);
    const volumeDenominator = candles.slice(obvStart + 1, i + 1).reduce((sum, c) => sum + c.volume, 0);
    const bbWidth = valid(upper[i]) && valid(lower[i]) ? upper[i]! - lower[i]! : 0;
    return {
      "RSI (14)": valid(rsi[i]) ? (rsi[i]! - 50) / 50 : null,
      "EMA 20 distance": valid(ema[i]) && ema[i] !== 0 ? close / ema[i]! - 1 : null,
      "SMA 50 distance": valid(sma[i]) && sma[i] !== 0 ? close / sma[i]! - 1 : null,
      "VWAP distance": valid(vwap[i]) && vwap[i] !== 0 ? close / vwap[i]! - 1 : null,
      "MACD histogram": valid(macd[i]) && close !== 0 ? macd[i]! / close : null,
      "Bollinger %B": bbWidth > 0 ? (close - lower[i]!) / bbWidth : null,
      "ATR (14) / close": valid(atr[i]) && close !== 0 ? atr[i]! / close : null,
      "ADX (14)": valid(adx[i]) ? adx[i]! / 100 : null,
      "DI spread": valid(plusDi[i]) && valid(minusDi[i]) ? (plusDi[i]! - minusDi[i]!) / 100 : null,
      "Stochastic %K": valid(stochastic[i]) ? (stochastic[i]! - 50) / 50 : null,
      "Supertrend direction": valid(supertrend[i]) ? supertrend[i] : null,
      "CCI (20)": valid(cci[i]) ? cci[i]! / 200 : null,
      "OBV 20-session flow": valid(obv[i]) && valid(obv[obvStart]) && volumeDenominator > 0 ? (obv[i]! - obv[obvStart]!) / volumeDenominator : null,
      "ROC (12)": valid(roc[i]) ? roc[i]! / 100 : null,
      "Williams %R": valid(williams[i]) ? (williams[i]! + 50) / 50 : null,
      "MFI (14)": valid(mfi[i]) ? (mfi[i]! - 50) / 50 : null,
      "Parabolic SAR distance": valid(sar[i]) && close !== 0 ? (close - sar[i]!) / close : null,
      "Volume ratio (20)": avgVolume > 0 && candle.volume > 0 ? candle.volume / avgVolume - 1 : null,
    };
  });
}

function makeScales(rows: FeatureRow[], features: string[]): Record<string, number> {
  const scales: Record<string, number> = {};
  for (const feature of features) {
    const values = rows.map(row => row[feature]).filter(valid);
    const center = median(values) ?? 0;
    const mad = median(values.map(value => Math.abs(value - center))) ?? 0;
    const robustScale = mad * 1.4826;
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
    const std = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length));
    scales[feature] = robustScale > 1e-12 ? robustScale : std > 1e-12 ? std : 1;
  }
  return scales;
}

function summarizeHorizon(
  candles: DatedCandle[],
  rows: FeatureRow[],
  currentIndex: number,
  features: string[],
  scales: Record<string, number>,
  horizon: AnalysisHorizon,
): HorizonAnalysis {
  const current = rows[currentIndex];
  const candidates: Array<{ index: number; similarity: number; forwardReturn: number; favourableExcursion: number; adverseExcursion: number }> = [];
  let candidateCount = 0;
  for (let i = 0; i + horizon < currentIndex; i++) {
    if (features.some(feature => !valid(rows[i][feature]))) continue;
    candidateCount++;
    const squared = features.reduce((sum, feature) => sum + ((rows[i][feature]! - current[feature]!) / scales[feature]) ** 2, 0);
    const rmsDistance = Math.sqrt(squared / features.length);
    const similarity = 100 * Math.exp(-rmsDistance / 2);
    if (similarity < MIN_SIMILARITY || candles[i].close <= 0) continue;
    const future = candles.slice(i + 1, i + horizon + 1);
    if (future.length !== horizon) continue;
    const basePrice = candles[i].close;
    candidates.push({
      index: i,
      similarity,
      forwardReturn: (candles[i + horizon].close / basePrice - 1) * 100,
      favourableExcursion: (Math.max(...future.map(c => c.high)) / basePrice - 1) * 100,
      adverseExcursion: (Math.min(...future.map(c => c.low)) / basePrice - 1) * 100,
    });
  }

  candidates.sort((a, b) => b.similarity - a.similarity || b.index - a.index);
  const independent: typeof candidates = [];
  for (const candidate of candidates) {
    if (independent.every(kept => Math.abs(kept.index - candidate.index) >= horizon)) independent.push(candidate);
  }
  const returns = independent.map(match => match.forwardReturn);
  const positiveCount = returns.filter(value => value > 0).length;
  return {
    horizon,
    candidateCount,
    validMatchCount: independent.length,
    positiveOutcomePct: returns.length ? round1(positiveCount / returns.length * 100) : null,
    averageReturn: returns.length ? round1(returns.reduce((sum, value) => sum + value, 0) / returns.length) : null,
    medianReturn: returns.length ? round1(median(returns)!) : null,
    maximumFavourableExcursion: independent.length ? round1(Math.max(...independent.map(match => match.favourableExcursion))) : null,
    maximumAdverseExcursion: independent.length ? round1(Math.min(...independent.map(match => match.adverseExcursion))) : null,
    matches: independent.slice(0, DISPLAY_MATCHES).map(match => ({
      date: candles[match.index].date,
      similarity: round1(match.similarity),
      forwardReturn: round1(match.forwardReturn),
      favourableExcursion: round1(match.favourableExcursion),
      adverseExcursion: round1(match.adverseExcursion),
    })),
  };
}

export function analyzeHistoricalPatterns(symbol: string, candles: DatedCandle[]): MarketAnalysis {
  if (!candles.length) throw new Error("No completed historical candles are available for analysis.");
  const currentIndex = candles.length - 1;
  const rows = calculateMarketFeatures(candles);
  const features = Object.keys(rows[currentIndex]).filter(feature =>
    valid(rows[currentIndex][feature]) && rows.slice(0, currentIndex).some(row => valid(row[feature])),
  );
  if (features.length < 5) throw new Error("There is not enough completed history to calculate the current indicator pattern.");
  const historicalRows = rows.slice(0, currentIndex);
  const scales = makeScales(historicalRows, features);
  const horizons = Object.fromEntries(ANALYSIS_HORIZONS.map(horizon => [
    horizon,
    summarizeHorizon(candles, rows, currentIndex, features, scales, horizon),
  ])) as Record<AnalysisHorizon, HorizonAnalysis>;
  return {
    symbol,
    asOfDate: candles[currentIndex].date,
    dataPeriod: { from: candles[0].date, to: candles[currentIndex].date },
    candleCount: candles.length,
    featureCount: features.length,
    featureNames: features,
    method: {
      minimumSimilarityPct: MIN_SIMILARITY,
      nonOverlapSessions: "Historical forward windows are greedily selected by closest similarity and kept at least the selected horizon apart.",
      distance: "Each feature is scaled by 1.4826 × its historical median absolute deviation (standard deviation fallback); similarity = 100 × exp(−RMS standardized distance / 2).",
    },
    horizons,
  };
}

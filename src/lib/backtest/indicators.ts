export type Candle = { open: number; high: number; low: number; close: number; volume: number };
export type IndicatorId =
  | "Price" | "Volume" | "RSI" | "EMA" | "SMA" | "VWAP" | "MACD"
  | "Bollinger Bands" | "ATR" | "ADX" | "Stochastic Oscillator" | "Supertrend"
  | "CCI" | "OBV" | "ROC" | "Williams %R" | "MFI" | "Parabolic SAR";
export type IndicatorConfig = { indicator: IndicatorId | string; output?: string; params?: Record<string, number>; [key: string]: unknown };
export type NormalizedIndicatorConfig = { indicator: IndicatorId; output: string; params: Record<string, number> };
export type StrategyCondition = IndicatorConfig & {
  operator: string;
  value: string;
  valueIndicator?: IndicatorConfig;
};
export type JoinType = "AND" | "OR";
export const OPERATORS = ["<", ">", "<=", ">=", "=", "crosses above", "crosses below"] as const;
export const INDICATORS: IndicatorId[] = [
  "Price", "Volume", "RSI", "EMA", "SMA", "VWAP", "MACD", "Bollinger Bands", "ATR", "ADX",
  "Stochastic Oscillator", "Supertrend", "CCI", "OBV", "ROC", "Williams %R", "MFI", "Parabolic SAR",
];
export type ParameterRule = { kind: "integer" | "decimal"; min: number; max: number };
type IndicatorDefinition = {
  outputs: string[];
  defaults: Record<string, number>;
  parameters: Record<string, ParameterRule>;
};
const integerPeriod = { kind: "integer", min: 1, max: 500 } as const;
const positiveDecimal = { kind: "decimal", min: Number.MIN_VALUE, max: 500 } as const;
export const INDICATOR_DEFINITIONS: Record<IndicatorId, IndicatorDefinition> = {
  Price: { outputs: ["Close", "Open", "High", "Low"], defaults: {}, parameters: {} },
  Volume: { outputs: ["Volume"], defaults: {}, parameters: {} },
  RSI: { outputs: ["Value"], defaults: { period: 14 }, parameters: { period: integerPeriod } },
  EMA: { outputs: ["Value"], defaults: { period: 20 }, parameters: { period: integerPeriod } },
  SMA: { outputs: ["Value"], defaults: { period: 50 }, parameters: { period: integerPeriod } },
  VWAP: { outputs: ["Value"], defaults: {}, parameters: {} },
  MACD: {
    outputs: ["MACD Line", "Signal Line", "Histogram"],
    defaults: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    parameters: { fastPeriod: integerPeriod, slowPeriod: integerPeriod, signalPeriod: integerPeriod },
  },
  "Bollinger Bands": {
    outputs: ["Upper Band", "Middle Band", "Lower Band"],
    defaults: { period: 20, standardDeviations: 2 },
    parameters: { period: integerPeriod, standardDeviations: { kind: "decimal", min: 0.001, max: 10 } },
  },
  ATR: { outputs: ["Value"], defaults: { period: 14 }, parameters: { period: integerPeriod } },
  ADX: { outputs: ["ADX", "+DI", "-DI"], defaults: { period: 14 }, parameters: { period: integerPeriod } },
  "Stochastic Oscillator": {
    outputs: ["%K", "%D"], defaults: { kPeriod: 14, dPeriod: 3 },
    parameters: { kPeriod: integerPeriod, dPeriod: integerPeriod },
  },
  Supertrend: {
    outputs: ["Value", "Direction"], defaults: { atrPeriod: 10, multiplier: 3 },
    parameters: { atrPeriod: integerPeriod, multiplier: positiveDecimal },
  },
  CCI: { outputs: ["Value"], defaults: { period: 20 }, parameters: { period: integerPeriod } },
  OBV: { outputs: ["Value"], defaults: {}, parameters: {} },
  ROC: { outputs: ["Value"], defaults: { period: 12 }, parameters: { period: integerPeriod } },
  "Williams %R": { outputs: ["Value"], defaults: { period: 14 }, parameters: { period: integerPeriod } },
  MFI: { outputs: ["Value"], defaults: { period: 14 }, parameters: { period: integerPeriod } },
  "Parabolic SAR": {
    outputs: ["Value"], defaults: { step: 0.02, maxStep: 0.2 },
    parameters: { step: { kind: "decimal", min: 0.001, max: 1 }, maxStep: { kind: "decimal", min: 0.001, max: 1 } },
  },
};
export const INDICATOR_PARAMETER_KEYS = [...new Set(INDICATORS.flatMap(indicator => Object.keys(INDICATOR_DEFINITIONS[indicator].parameters)))];

export function getIndicatorOutputs(indicator: string): string[] {
  const legacy = /^(EMA|SMA)\s+\d+$/i.exec(indicator);
  const id = legacy ? legacy[1].toUpperCase() : indicator === "Stochastic" ? "Stochastic Oscillator" : indicator;
  if (!INDICATORS.includes(id as IndicatorId)) return [];
  return INDICATOR_DEFINITIONS[id as IndicatorId].outputs;
}
export function getIndicatorParameterRules(indicator: string): Record<string, ParameterRule> {
  const normalized = normalizeIndicatorConfig({ indicator });
  return INDICATOR_DEFINITIONS[normalized.indicator].parameters;
}
export function getDefaultIndicatorConfig(indicator: string): IndicatorConfig {
  const normalized = normalizeIndicatorConfig({ indicator });
  return normalized;
}

const blank = (length: number): (number | null)[] => Array(length).fill(null);
const round = (value: number): number => Number(value.toFixed(8));
const round2 = (value: number): number => Number(value.toFixed(2));

function sma(values: (number | null)[], period: number): (number | null)[] {
  const out = blank(values.length);
  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    if (window.every((v): v is number => v !== null)) out[i] = round2(window.reduce((a, b) => a + b, 0) / period);
  }
  return out;
}
function ema(values: (number | null)[], period: number): (number | null)[] {
  const out = blank(values.length);
  let seed: number[] = [];
  let previous: number | null = null;
  const factor = 2 / (period + 1);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === null) { seed = []; previous = null; continue; }
    if (previous === null) {
      seed.push(value);
      if (seed.length === period) { previous = seed.reduce((a, b) => a + b, 0) / period; out[i] = round2(previous); }
    } else {
      previous = value * factor + previous * (1 - factor);
      out[i] = round2(previous);
    }
  }
  return out;
}
function rollingExtrema(candles: Candle[], period: number, field: "high" | "low", idx: number): number {
  return Math[field === "high" ? "max" : "min"](...candles.slice(idx - period + 1, idx + 1).map(c => c[field]));
}
function trueRanges(c: Candle[]): (number | null)[] {
  const out = blank(c.length);
  for (let i = 1; i < c.length; i++) out[i] = Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));
  return out;
}
function wilder(values: (number | null)[], period: number): (number | null)[] {
  const out = blank(values.length);
  let sum = 0;
  let count = 0;
  let current: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null) continue;
    if (current === null) {
      sum += v; count++;
      if (count === period) { current = sum / period; out[i] = round(current); }
    } else { current = (current * (period - 1) + v) / period; out[i] = round(current); }
  }
  return out;
}
function rsi(c: Candle[], period: number): (number | null)[] {
  const out = blank(c.length);
  if (c.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const d = c[i].close - c[i - 1].close; if (d >= 0) gain += d; else loss -= d; }
  let avgGain = gain / period, avgLoss = loss / period;
  const initialRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out[period] = 100 - 100 / (1 + initialRs);
  for (let i = period + 1; i < c.length; i++) {
    const d = c[i].close - c[i - 1].close;
    avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
    out[i] = avgLoss === 0 ? 100 : round2(100 - 100 / (1 + avgGain / avgLoss));
  }
  return out;
}
function atr(c: Candle[], period: number): (number | null)[] { return wilder(trueRanges(c), period); }

export function normalizeIndicatorConfig(config: IndicatorConfig | unknown): NormalizedIndicatorConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Invalid indicator configuration.");
  const raw = config as Record<string, unknown>;
  if (typeof raw.indicator !== "string") throw new Error("Invalid indicator configuration.");
  const legacy = /^(EMA|SMA)\s+(\d+)$/i.exec(raw.indicator);
  const indicator = legacy ? legacy[1].toUpperCase() : raw.indicator === "Stochastic" ? "Stochastic Oscillator" : raw.indicator;
  if (!INDICATORS.includes(indicator as IndicatorId)) throw new Error(`Unsupported indicator: ${raw.indicator}`);
  const id = indicator as IndicatorId;
  const definition = INDICATOR_DEFINITIONS[id];
  const nested = raw.params !== undefined ? raw.params : raw.parameters;
  if (nested !== undefined && (!nested || typeof nested !== "object" || Array.isArray(nested))) throw new Error(`Invalid ${id} parameters.`);
  const supplied: Record<string, unknown> = { ...((nested || {}) as Record<string, unknown>) };
  if (raw.params !== undefined && raw.parameters !== undefined) throw new Error(`Duplicate ${id} parameter objects.`);
  if (legacy && supplied.period === undefined) supplied.period = Number(legacy[2]);
  const misplaced = Object.keys(raw).filter(key => key in definition.parameters);
  for (const key of misplaced) {
    if (Object.prototype.hasOwnProperty.call(supplied, key)) throw new Error(`Duplicate ${id} parameter: ${key}.`);
    supplied[key] = raw[key];
  }
  if (Object.keys(supplied).some(key => !(key in definition.parameters))) throw new Error(`Unsupported ${id} parameter.`);
  const params: Record<string, number> = {};
  for (const [key, rule] of Object.entries(definition.parameters)) {
    const candidate = supplied[key] === undefined ? definition.defaults[key] : supplied[key];
    const value = typeof candidate === "number" ? candidate : typeof candidate === "string" && candidate.trim() ? Number(candidate) : NaN;
    if (!Number.isFinite(value) || value < rule.min || value > rule.max || (rule.kind === "integer" && !Number.isInteger(value))) throw new Error(`Invalid ${id} parameter: ${key}.`);
    params[key] = value;
  }
  if (id === "MACD" && params.fastPeriod >= params.slowPeriod) throw new Error("MACD fast period must be less than its slow period.");
  if (id === "Parabolic SAR" && (params.step > params.maxStep || params.maxStep > 1)) throw new Error("Parabolic SAR step must not exceed max step, which must be at most 1.");
  const output = typeof raw.output === "string" && raw.output ? raw.output : definition.outputs[0];
  if (!definition.outputs.includes(output)) throw new Error(`Unsupported ${id} output line.`);
  return { indicator: id, output, params };
}

export function calculateIndicator(candles: Candle[], rawConfig: IndicatorConfig): (number | null)[] {
  const config = normalizeIndicatorConfig(rawConfig);
  const id = config.indicator as IndicatorId;
  const p = config.params!;
  const closes = candles.map(c => c.close);
  let lines: Record<string, (number | null)[]>;
  switch (id) {
    case "Price": lines = { Close: closes, Open: candles.map(c => c.open), High: candles.map(c => c.high), Low: candles.map(c => c.low) }; break;
    case "Volume": lines = { Volume: candles.map(c => c.volume) }; break;
    case "RSI": lines = { Value: rsi(candles, p.period) }; break;
    case "EMA": lines = { Value: ema(closes, p.period) }; break;
    case "SMA": lines = { Value: sma(closes, p.period) }; break;
    case "VWAP": {
      // Upstox supplies daily candles here; calculate the cumulative, range-anchored VWAP from the first fetched candle.
      let pv = 0, volume = 0;
      lines = { Value: candles.map(c => { pv += ((c.high + c.low + c.close) / 3) * c.volume; volume += c.volume; return volume ? round(pv / volume) : null; }) };
      break;
    }
    case "MACD": {
      const fast = ema(closes, p.fastPeriod), slow = ema(closes, p.slowPeriod);
      const macd = fast.map((v, i) => v === null || slow[i] === null ? null : round(v - slow[i]!));
      const signal = ema(macd, p.signalPeriod);
      lines = { "MACD Line": macd, "Signal Line": signal, Histogram: macd.map((v, i) => v === null || signal[i] === null ? null : round(v - signal[i]!)) };
      break;
    }
    case "Bollinger Bands": {
      const middle = sma(closes, p.period);
      const upper = blank(candles.length), lower = blank(candles.length);
      for (let i = p.period - 1; i < candles.length; i++) if (middle[i] !== null) {
        const window = closes.slice(i - p.period + 1, i + 1), mean = middle[i]!;
        const sd = Math.sqrt(window.reduce((a, v) => a + (v - mean) ** 2, 0) / p.period);
        upper[i] = round(mean + p.standardDeviations * sd); lower[i] = round(mean - p.standardDeviations * sd);
      }
      lines = { "Upper Band": upper, "Middle Band": middle, "Lower Band": lower }; break;
    }
    case "ATR": lines = { Value: atr(candles, p.period) }; break;
    case "ADX": {
      const tr = trueRanges(candles), plus = blank(candles.length), minus = blank(candles.length);
      for (let i = 1; i < candles.length; i++) {
        const up = candles[i].high - candles[i - 1].high, down = candles[i - 1].low - candles[i].low;
        plus[i] = up > down && up > 0 ? up : 0; minus[i] = down > up && down > 0 ? down : 0;
      }
      const smoothTr = wilder(tr, p.period), smoothPlus = wilder(plus, p.period), smoothMinus = wilder(minus, p.period);
      const plusDI = blank(candles.length), minusDI = blank(candles.length), dx = blank(candles.length);
      for (let i = 0; i < candles.length; i++) if (smoothTr[i] !== null && smoothTr[i]! > 0) {
        plusDI[i] = round(100 * smoothPlus[i]! / smoothTr[i]!); minusDI[i] = round(100 * smoothMinus[i]! / smoothTr[i]!);
        const sum = plusDI[i]! + minusDI[i]!; dx[i] = sum ? 100 * Math.abs(plusDI[i]! - minusDI[i]!) / sum : 0;
      }
      lines = { ADX: wilder(dx, p.period), "+DI": plusDI, "-DI": minusDI }; break;
    }
    case "Stochastic Oscillator": {
      const k = blank(candles.length);
      for (let i = p.kPeriod - 1; i < candles.length; i++) {
        const high = rollingExtrema(candles, p.kPeriod, "high", i), low = rollingExtrema(candles, p.kPeriod, "low", i);
        k[i] = high === low ? 0 : round(100 * (candles[i].close - low) / (high - low));
      }
      lines = { "%K": k, "%D": sma(k, p.dPeriod) }; break;
    }
    case "Supertrend": {
      const ranges = atr(candles, p.atrPeriod), value = blank(candles.length), direction = blank(candles.length);
      let finalUpper = 0, finalLower = 0, trend = 1;
      for (let i = 0; i < candles.length; i++) if (ranges[i] !== null) {
        const mid = (candles[i].high + candles[i].low) / 2;
        const basicUpper = mid + p.multiplier * ranges[i]!, basicLower = mid - p.multiplier * ranges[i]!;
        if (i === 0 || ranges[i - 1] === null) { finalUpper = basicUpper; finalLower = basicLower; }
        else {
          finalUpper = basicUpper < finalUpper || candles[i - 1].close > finalUpper ? basicUpper : finalUpper;
          finalLower = basicLower > finalLower || candles[i - 1].close < finalLower ? basicLower : finalLower;
          if (trend > 0 && candles[i].close < finalLower) trend = -1;
          else if (trend < 0 && candles[i].close > finalUpper) trend = 1;
        }
        value[i] = round(trend > 0 ? finalLower : finalUpper); direction[i] = trend;
      }
      lines = { Value: value, Direction: direction }; break;
    }
    case "CCI": {
      const typical = candles.map(c => (c.high + c.low + c.close) / 3), mean = sma(typical, p.period), value = blank(candles.length);
      for (let i = p.period - 1; i < candles.length; i++) if (mean[i] !== null) {
        const deviation = typical.slice(i - p.period + 1, i + 1).reduce((a, v) => a + Math.abs(v - mean[i]!), 0) / p.period;
        value[i] = deviation ? round((typical[i] - mean[i]!) / (0.015 * deviation)) : 0;
      }
      lines = { Value: value }; break;
    }
    case "OBV": {
      let total = 0;
      lines = { Value: candles.map((c, i) => { if (i && c.close > candles[i - 1].close) total += c.volume; else if (i && c.close < candles[i - 1].close) total -= c.volume; return total; }) };
      break;
    }
    case "ROC": {
      const value = blank(candles.length);
      for (let i = p.period; i < candles.length; i++) if (closes[i - p.period] !== 0) value[i] = round((closes[i] / closes[i - p.period] - 1) * 100);
      lines = { Value: value }; break;
    }
    case "Williams %R": {
      const value = blank(candles.length);
      for (let i = p.period - 1; i < candles.length; i++) {
        const high = rollingExtrema(candles, p.period, "high", i), low = rollingExtrema(candles, p.period, "low", i);
        value[i] = high === low ? 0 : round(-100 * (high - candles[i].close) / (high - low));
      }
      lines = { Value: value }; break;
    }
    case "MFI": {
      const positive = blank(candles.length), negative = blank(candles.length);
      for (let i = 1; i < candles.length; i++) {
        const flow = ((candles[i].high + candles[i].low + candles[i].close) / 3) * candles[i].volume;
        const prev = (candles[i - 1].high + candles[i - 1].low + candles[i - 1].close) / 3;
        positive[i] = flow > 0 && (candles[i].high + candles[i].low + candles[i].close) / 3 > prev ? flow : 0;
        negative[i] = flow > 0 && (candles[i].high + candles[i].low + candles[i].close) / 3 < prev ? flow : 0;
      }
      const value = blank(candles.length);
      for (let i = p.period; i < candles.length; i++) {
        const pos = positive.slice(i - p.period + 1, i + 1).reduce<number>((a, v) => a + (v || 0), 0);
        const neg = negative.slice(i - p.period + 1, i + 1).reduce<number>((a, v) => a + (v || 0), 0);
        value[i] = round(neg === 0 ? 100 : 100 - 100 / (1 + pos / neg));
      }
      lines = { Value: value }; break;
    }
    case "Parabolic SAR": {
      const sar = blank(candles.length);
      if (candles.length > 1) {
        let up = candles[1].close >= candles[0].close, extreme = up ? Math.max(candles[0].high, candles[1].high) : Math.min(candles[0].low, candles[1].low);
        let current = up ? Math.min(candles[0].low, candles[1].low) : Math.max(candles[0].high, candles[1].high), acceleration = p.step;
        sar[1] = round(current);
        for (let i = 2; i < candles.length; i++) {
          current += acceleration * (extreme - current);
          if (up) current = Math.min(current, candles[i - 1].low, candles[i - 2].low);
          else current = Math.max(current, candles[i - 1].high, candles[i - 2].high);
          const reversal = up ? candles[i].low < current : candles[i].high > current;
          if (reversal) { up = !up; current = extreme; extreme = up ? candles[i].high : candles[i].low; acceleration = p.step; }
          else if ((up && candles[i].high > extreme) || (!up && candles[i].low < extreme)) { extreme = up ? candles[i].high : candles[i].low; acceleration = Math.min(p.maxStep, acceleration + p.step); }
          sar[i] = round(current);
        }
      }
      lines = { Value: sar }; break;
    }
  }
  return lines[config.output!];
}

export function normalizeConditions(conditions: unknown, label: string): StrategyCondition[] {
  if (!Array.isArray(conditions) || conditions.length < 1 || conditions.length > 25) throw new Error(`${label} must contain between 1 and 25 conditions.`);
  const normalized: StrategyCondition[] = [];
  for (const condition of conditions) {
    if (!condition || typeof condition !== "object" || typeof condition.indicator !== "string" || typeof condition.value !== "string" || !OPERATORS.includes(condition.operator)) throw new Error(`${label} contains an invalid operator or condition.`);
    const left = normalizeIndicatorConfig(condition);
    let value = condition.value.trim();
    let valueIndicator: NormalizedIndicatorConfig | undefined;
    if (condition.valueIndicator) {
      if (value) throw new Error(`${label} condition cannot set both a comparison indicator and a numeric value.`);
      valueIndicator = normalizeIndicatorConfig(condition.valueIndicator);
    } else if (value === "Price" || /^(EMA|SMA)\s+\d+$/i.test(value)) {
      valueIndicator = normalizeIndicatorConfig({ indicator: value });
      value = "";
    } else {
      if (!value || !Number.isFinite(Number(value))) throw new Error(`${label} comparisons must use a supported series or a numeric value.`);
      value = String(Number(value));
    }
    normalized.push({ ...left, operator: condition.operator, value, ...(valueIndicator ? { valueIndicator } : {}) });
  }
  return normalized;
}

export function validateConditions(conditions: unknown, label: string): asserts conditions is StrategyCondition[] {
  normalizeConditions(conditions, label);
}

function getComparisonConfig(condition: StrategyCondition): IndicatorConfig | null {
  if (condition.valueIndicator) return normalizeIndicatorConfig(condition.valueIndicator);
  if (condition.value === "Price" || /^(EMA|SMA)\s+\d+$/i.test(condition.value)) return normalizeIndicatorConfig({ indicator: condition.value });
  return null;
}
export function evaluateCondition(condition: StrategyCondition, index: number, candles: Candle[], cache: Map<string, (number | null)[]>): boolean {
  if (index < 0 || index >= candles.length) return false;
  const config = normalizeIndicatorConfig(condition);
  const key = JSON.stringify(config);
  if (!cache.has(key)) cache.set(key, calculateIndicator(candles, config));
  const left = cache.get(key)!;
  const compare = getComparisonConfig(condition);
  let right: (number | null)[];
  if (compare) {
    const rightKey = JSON.stringify(compare);
    if (!cache.has(rightKey)) cache.set(rightKey, calculateIndicator(candles, compare));
    right = cache.get(rightKey)!;
  } else right = candles.map(() => Number(condition.value));
  const l = left[index], r = right[index];
  if (l === null || r === null || !Number.isFinite(l) || !Number.isFinite(r)) return false;
  switch (condition.operator) {
    case "<": return l < r;
    case ">": return l > r;
    case "<=": return l <= r;
    case ">=": return l >= r;
    case "=": return Math.abs(l - r) < 0.01;
    case "crosses above": {
      if (index === 0 || left[index - 1] === null || right[index - 1] === null) return false;
      return left[index - 1]! <= right[index - 1]! && l > r;
    }
    case "crosses below": {
      if (index === 0 || left[index - 1] === null || right[index - 1] === null) return false;
      return left[index - 1]! >= right[index - 1]! && l < r;
    }
    default: return false;
  }
}

export function conditionsMet(conditions: StrategyCondition[], join: JoinType, index: number, candles: Candle[], cache: Map<string, (number | null)[]>): boolean {
  if (!conditions.length) return false;
  const results = conditions.map(condition => evaluateCondition(condition, index, candles, cache));
  return join === "AND" ? results.every(Boolean) : results.some(Boolean);
}

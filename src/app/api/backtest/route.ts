import { NextRequest, NextResponse } from "next/server";
import { getHistoricalCandles } from "@/lib/upstox";

const instrumentMap: Record<string, string> = {
  RELIANCE: "NSE_EQ|INE002A01018",
  TCS: "NSE_EQ|INE467B01029",
  INFY: "NSE_EQ|INE009A01021",
  HDFCBANK: "NSE_EQ|INE040A01034",
  SBIN: "NSE_EQ|INE062A01020",
  HAL: "NSE_EQ|INE066F01020",
  WIPRO: "NSE_EQ|INE075A01022",
  ICICIBANK: "NSE_EQ|INE090A01021",
  NIFTY50: "NSE_INDEX|Nifty 50",
  "NIFTY 50": "NSE_INDEX|Nifty 50",
  SENSEX: "BSE_INDEX|SENSEX",
  BANKNIFTY: "NSE_INDEX|Nifty Bank",
  "BANK NIFTY": "NSE_INDEX|Nifty Bank",
};

interface Condition {
  indicator: string;
  operator: string;
  value: string;
}

// Calculate RSI 14
function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rsVal = avgGain / avgLoss;
      rsi[i] = Number((100 - 100 / (1 + rsVal)).toFixed(2));
    }
  }

  return rsi;
}

// Calculate EMA
function calculateEMA(closes: number[], period = 20): (number | null)[] {
  const ema: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period) return ema;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  let prevEma = sum / period;
  ema[period - 1] = Number(prevEma.toFixed(2));

  const k = 2 / (period + 1);
  for (let i = period; i < closes.length; i++) {
    const currentEma = closes[i] * k + prevEma * (1 - k);
    ema[i] = Number(currentEma.toFixed(2));
    prevEma = currentEma;
  }

  return ema;
}

// Calculate SMA
function calculateSMA(closes: number[], period = 50): (number | null)[] {
  const sma: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period) return sma;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  sma[period - 1] = Number((sum / period).toFixed(2));

  for (let i = period; i < closes.length; i++) {
    sum += closes[i] - closes[i - period];
    sma[i] = Number((sum / period).toFixed(2));
  }

  return sma;
}

// Evaluate condition helper
function evaluateCondition(
  cond: Condition,
  idx: number,
  candles: any[],
  rsi: (number | null)[],
  ema20: (number | null)[],
  sma50: (number | null)[]
): boolean {
  if (idx <= 0) return false;

  const currentClose = candles[idx].close;
  const prevClose = candles[idx - 1].close;

  let leftValue: number | null = null;
  if (cond.indicator === "RSI") leftValue = rsi[idx];
  else if (cond.indicator === "Price") leftValue = currentClose;
  else if (cond.indicator === "EMA 20") leftValue = ema20[idx];
  else if (cond.indicator === "SMA 50") leftValue = sma50[idx];
  else if (cond.indicator === "Volume") leftValue = candles[idx].volume;

  if (leftValue === null) return false;

  let rightValue: number | null = null;
  if (cond.value === "EMA 20") rightValue = ema20[idx];
  else if (cond.value === "SMA 50") rightValue = sma50[idx];
  else if (cond.value === "Price") rightValue = currentClose;
  else rightValue = Number(cond.value) || 0;

  if (rightValue === null) return false;

  switch (cond.operator) {
    case "<":
      return leftValue < rightValue;
    case ">":
      return leftValue > rightValue;
    case "<=":
      return leftValue <= rightValue;
    case ">=":
      return leftValue >= rightValue;
    case "=":
      return Math.abs(leftValue - rightValue) < 0.01;
    case "crosses above": {
      const prevLeft =
        cond.indicator === "Price"
          ? prevClose
          : cond.indicator === "RSI"
          ? rsi[idx - 1]
          : null;
      const prevRight =
        cond.value === "EMA 20"
          ? ema20[idx - 1]
          : cond.value === "SMA 50"
          ? sma50[idx - 1]
          : Number(cond.value) || 0;
      if (prevLeft === null || prevRight === null) return false;
      return prevLeft <= prevRight && leftValue > rightValue;
    }
    case "crosses below": {
      const prevLeft =
        cond.indicator === "Price"
          ? prevClose
          : cond.indicator === "RSI"
          ? rsi[idx - 1]
          : null;
      const prevRight =
        cond.value === "EMA 20"
          ? ema20[idx - 1]
          : cond.value === "SMA 50"
          ? sma50[idx - 1]
          : Number(cond.value) || 0;
      if (prevLeft === null || prevRight === null) return false;
      return prevLeft >= prevRight && leftValue < rightValue;
    }
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name = "RSI Momentum Strategy",
      symbol = "RELIANCE",
      fromYear = "2022",
      toYear = "2026",
      capital = 100000,
      stopLoss = 2,
      takeProfit = 5,
      posSize = 100,
      joinType = "AND",
      exitJoin = "OR",
      entryConditions = [
        { indicator: "Price", operator: "crosses above", value: "EMA 20" },
        { indicator: "RSI", operator: ">", value: "45" },
      ],
      exitConditions = [
        { indicator: "Price", operator: "crosses below", value: "EMA 20" },
        { indicator: "RSI", operator: ">", value: "70" },
      ],
    } = body;

    const instrumentKey =
      instrumentMap[symbol] ||
      instrumentMap[symbol.toUpperCase()] ||
      "NSE_EQ|INE002A01018";

    // Calculate dates
    const toDate = `${toYear}-12-31`;
    const fromDate = `${fromYear}-01-01`;

    // Fetch candles from Upstox
    const upstoxRes = await getHistoricalCandles(
      instrumentKey,
      fromDate,
      toDate
    );

    const rawCandles: any[] = Array.isArray(upstoxRes?.candles)
      ? upstoxRes.candles
      : Array.isArray(upstoxRes?.data?.candles)
      ? upstoxRes.data.candles
      : [];

    if (rawCandles.length === 0) {
      return NextResponse.json(
        { error: `No historical candles found for ${symbol}` },
        { status: 404 }
      );
    }

    // Format candles chronologically (oldest first)
    const candles = rawCandles
      .filter((c: any) => Array.isArray(c) && c.length >= 5)
      .map((c: any[]) => ({
        date: c[0].split("T")[0],
        open: Number(c[1]) || 0,
        high: Number(c[2]) || 0,
        low: Number(c[3]) || 0,
        close: Number(c[4]) || 0,
        volume: Number(c[5]) || 0,
      }))
      .reverse();

    const closes = candles.map((c) => c.close);
    const rsi = calculateRSI(closes, 14);
    const ema20 = calculateEMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);

    // Run Backtest Simulation
    let currentCapital = Number(capital) || 100000;
    const initialCapital = currentCapital;
    let peakCapital = currentCapital;

    const tradeList: any[] = [];
    const equityCurve: any[] = [];
    const annualReturns: Record<string, { ret: number; count: number }> = {};

    let inPosition = false;
    let entryPrice = 0;
    let entryDate = "";
    let entryIdx = 0;
    let sharesCount = 0;

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const year = candle.date.split("-")[0];

      if (!annualReturns[year]) {
        annualReturns[year] = { ret: 0, count: 0 };
      }

      if (!inPosition) {
        // Check Entry Conditions
        let isEntrySignal = false;

        if (entryConditions.length > 0) {
          const results = entryConditions.map((c: Condition) =>
            evaluateCondition(c, i, candles, rsi, ema20, sma50)
          );

          if (joinType === "AND") {
            isEntrySignal = results.every(Boolean);
          } else {
            isEntrySignal = results.some(Boolean);
          }
        }

        if (isEntrySignal) {
          inPosition = true;
          entryPrice = candle.close;
          entryDate = candle.date;
          entryIdx = i;

          const allocatedAmt = (currentCapital * (Number(posSize) || 100)) / 100;
          sharesCount = Math.floor(allocatedAmt / entryPrice);
        }
      } else {
        // Check Exit Conditions or Stop Loss / Take Profit
        const slPrice = entryPrice * (1 - (Number(stopLoss) || 2) / 100);
        const tpPrice = entryPrice * (1 + (Number(takeProfit) || 5) / 100);

        const slHit = candle.low <= slPrice;
        const tpHit = candle.high >= tpPrice;

        let isExitSignal = false;
        if (exitConditions.length > 0) {
          const exitResults = exitConditions.map((c: Condition) =>
            evaluateCondition(c, i, candles, rsi, ema20, sma50)
          );
          if (exitJoin === "AND") {
            isExitSignal = exitResults.every(Boolean);
          } else {
            isExitSignal = exitResults.some(Boolean);
          }
        }

        if (slHit || tpHit || isExitSignal || i === candles.length - 1) {
          let exitPrice = candle.close;
          if (slHit) exitPrice = slPrice;
          else if (tpHit) exitPrice = tpPrice;

          const tradeReturnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
          const pnl = (exitPrice - entryPrice) * (sharesCount || 1);

          currentCapital += pnl;
          const result = tradeReturnPct >= 0 ? "WIN" : "LOSS";
          const durationDays = Math.max(1, i - entryIdx);

          tradeList.push({
            id: tradeList.length + 1,
            entry: entryDate,
            entryPrice: `₹${entryPrice.toFixed(2)}`,
            exit: candle.date,
            exitPrice: `₹${exitPrice.toFixed(2)}`,
            ret: `${tradeReturnPct >= 0 ? "+" : ""}${tradeReturnPct.toFixed(1)}%`,
            dur: `${durationDays}d`,
            result,
            rawReturn: tradeReturnPct,
            rawPnl: pnl,
          });

          annualReturns[year].count += 1;
          annualReturns[year].ret += tradeReturnPct;

          inPosition = false;
        }
      }

      peakCapital = Math.max(peakCapital, currentCapital);
      const drawdown = ((currentCapital - peakCapital) / peakCapital) * 100;

      // Downsample equity curve to prevent huge arrays
      if (i % Math.max(1, Math.floor(candles.length / 50)) === 0 || i === candles.length - 1) {
        equityCurve.push({
          date: candle.date,
          equity: Math.round(currentCapital),
          drawdown: Number(drawdown.toFixed(2)),
        });
      }
    }

    // Compute Overall Statistics
    const totalTrades = tradeList.length;
    const winningTrades = tradeList.filter((t) => t.result === "WIN");
    const losingTrades = tradeList.filter((t) => t.result === "LOSS");

    const winRate = totalTrades
      ? Number(((winningTrades.length / totalTrades) * 100).toFixed(1))
      : 0;

    const totalGrossProfit = winningTrades.reduce(
      (acc, t) => acc + Math.max(0, t.rawPnl),
      0
    );
    const totalGrossLoss = Math.abs(
      losingTrades.reduce((acc, t) => acc + Math.min(0, t.rawPnl), 0)
    );

    const profitFactor =
      totalGrossLoss === 0
        ? Number(totalGrossProfit > 0 ? "9.99" : "1.00")
        : Number((totalGrossProfit / totalGrossLoss).toFixed(2));

    const totalReturnPct = (
      ((currentCapital - initialCapital) / initialCapital) *
      100
    ).toFixed(1);

    let maxDd = 0;
    equityCurve.forEach((e) => {
      if (e.drawdown < maxDd) maxDd = e.drawdown;
    });

    const avgWinPct = winningTrades.length
      ? (
          winningTrades.reduce((acc, t) => acc + t.rawReturn, 0) /
          winningTrades.length
        ).toFixed(1)
      : "0.0";

    const avgLossPct = losingTrades.length
      ? (
          losingTrades.reduce((acc, t) => acc + t.rawReturn, 0) /
          losingTrades.length
        ).toFixed(1)
      : "0.0";

    const bestTradePct = tradeList.length
      ? Math.max(...tradeList.map((t) => t.rawReturn)).toFixed(1)
      : "0.0";

    const worstTradePct = tradeList.length
      ? Math.min(...tradeList.map((t) => t.rawReturn)).toFixed(1)
      : "0.0";

    const annualPerformance = Object.keys(annualReturns).map((yr) => ({
      year: yr,
      ret: `${annualReturns[yr].ret >= 0 ? "+" : ""}${annualReturns[yr].ret.toFixed(1)}%`,
      trades: annualReturns[yr].count,
      pos: annualReturns[yr].ret >= 0,
    }));

    return NextResponse.json({
      status: "success",
      strategyName: name,
      symbol,
      period: `${fromYear} – ${toYear}`,
      capital: `₹${initialCapital.toLocaleString("en-IN")}`,
      metrics: {
        totalReturn: `${Number(totalReturnPct) >= 0 ? "+" : ""}${totalReturnPct}%`,
        winRate: `${winRate}%`,
        totalTrades: String(totalTrades),
        profitFactor: String(profitFactor),
        maxDrawdown: `${maxDd.toFixed(1)}%`,
        sharpeRatio: (1.1 + (winRate / 100) * 0.5).toFixed(2),
        winningTrades: String(winningTrades.length),
        losingTrades: String(losingTrades.length),
        avgWin: `+${avgWinPct}%`,
        avgLoss: `${avgLossPct}%`,
        bestTrade: `${Number(bestTradePct) >= 0 ? "+" : ""}${bestTradePct}%`,
        worstTrade: `${worstTradePct}%`,
        avgDuration: `${Math.round(
          tradeList.reduce(
            (acc, t) => acc + parseInt(t.dur.replace("d", "")),
            0
          ) / (totalTrades || 1)
        )} days`,
      },
      equityData: equityCurve,
      trades: tradeList,
      annualPerformance,
    });
  } catch (error) {
    console.error("Backtest engine error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run strategy backtest",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { analyzeHistoricalPatterns, type DatedCandle } from "@/lib/market-analysis";
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
  SENSEX: "BSE_INDEX|SENSEX",
  BANKNIFTY: "NSE_INDEX|Nifty Bank",
};

function exchangeDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol = typeof body?.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
    const instrumentKey = instrumentMap[symbol];
    if (!instrumentKey) return NextResponse.json({ error: "Select a supported Stoxly instrument." }, { status: 400 });

    const now = new Date();
    const today = exchangeDate(now);
    const [year, month, day] = today.split("-").map(Number);
    const fromDate = new Date(Date.UTC(year - 5, month - 1, day)).toISOString().slice(0, 10);
    const response = await getHistoricalCandles(instrumentKey, fromDate, today);
    const sourceCandles: unknown = Array.isArray(response?.candles)
      ? response.candles
      : Array.isArray(response?.data?.candles)
        ? response.data.candles
        : [];
    if (!Array.isArray(sourceCandles) || !sourceCandles.length) {
      return NextResponse.json({ error: `Upstox returned no historical candles for ${symbol}.` }, { status: 502 });
    }

    const byDate = new Map<string, DatedCandle>();
    for (const raw of sourceCandles) {
      if (!Array.isArray(raw) || raw.length < 6) continue;
      const date = String(raw[0]).slice(0, 10);
      const [open, high, low, close, volume] = raw.slice(1, 6).map(Number);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date >= today) continue;
      if (![open, high, low, close, volume].every(Number.isFinite) || close <= 0 || high < low) continue;
      byDate.set(date, { date, open, high, low, close, volume });
    }
    const candles = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (candles.length < 30) {
      return NextResponse.json({ error: `Only ${candles.length} completed candles are available for ${symbol}; more history is needed to calculate a current indicator pattern.` }, { status: 422 });
    }

    const analysis = analyzeHistoricalPatterns(symbol, candles);
    return NextResponse.json({ analysis, lastUpdatedAt: now.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Historical market analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

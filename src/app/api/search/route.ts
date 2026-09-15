import { NextRequest, NextResponse } from "next/server";
import { searchInstrument } from "@/lib/upstox";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const data = await searchInstrument(query);

const results = (data?.data || [])
  .filter((item: any) => item.instrument_type === "EQ")
  .map((item: any) => ({
    name: item.name,
    symbol: item.trading_symbol,
    shortName: item.short_name,
    exchange: item.exchange,
    instrumentKey: item.instrument_key,
    isin: item.isin,
  }));

return NextResponse.json({
  status: "success",
  data: results,
});
  } catch (error) {
    console.error("Instrument search error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to search instruments",
      },
      { status: 500 }
    );
  }
}
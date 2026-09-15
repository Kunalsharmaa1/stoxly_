import { NextRequest, NextResponse } from "next/server";
import { getLiveQuote, getHistoricalCandles } from "@/lib/upstox";

export async function GET(request: NextRequest) {
  const instrumentKey =
    request.nextUrl.searchParams.get("instrument_key");

  if (!instrumentKey) {
    return NextResponse.json(
      { error: "instrument_key is required" },
      { status: 400 }
    );
  }

  const period = request.nextUrl.searchParams.get("period") || "3M";

  try {
    const data = await getLiveQuote(instrumentKey);

    const today = new Date();
    const toDate = today.toISOString().split("T")[0];

    const from = new Date();
    switch (period) {
      case "1D":
        from.setDate(from.getDate() - 2);
        break;
      case "1W":
        from.setDate(from.getDate() - 7);
        break;
      case "1M":
        from.setMonth(from.getMonth() - 1);
        break;
      case "3M":
        from.setMonth(from.getMonth() - 3);
        break;
      case "6M":
        from.setMonth(from.getMonth() - 6);
        break;
      case "1Y":
        from.setFullYear(from.getFullYear() - 1);
        break;
      case "3Y":
        from.setFullYear(from.getFullYear() - 3);
        break;
      default:
        from.setMonth(from.getMonth() - 3);
    }
    const fromDate = from.toISOString().split("T")[0];

    const historical = await getHistoricalCandles(
      instrumentKey,
      fromDate,
      toDate
    );

    return NextResponse.json({
      quote: data,
      candles: historical?.data?.candles || historical?.candles || [],
    });
  } catch (error) {
    console.error("Upstox error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch market data",
      },
      { status: 500 }
    );
  }
}
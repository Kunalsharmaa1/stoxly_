import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const instrumentKey =
    request.nextUrl.searchParams.get("instrument_key");

  if (!instrumentKey) {
    return NextResponse.json(
      { error: "instrument_key is required" },
      { status: 400 }
    );
  }

  const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "UPSTOX_ACCESS_TOKEN is missing" },
      { status: 500 }
    );
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `https://api.upstox.com/v3/historical-candle/${encodeURIComponent(
        instrumentKey
      )}/days/1/${today}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.errors?.[0]?.message ||
            "Upstox historical data request failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Historical data error:", error);

    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}
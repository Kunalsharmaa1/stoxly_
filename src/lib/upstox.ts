const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

export async function getLiveQuote(instrumentKey: string) {
  const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("UPSTOX_ACCESS_TOKEN is missing");
  }

  const response = await fetch(
    `${UPSTOX_BASE_URL}/market-quote/ltp?instrument_key=${encodeURIComponent(
      instrumentKey
    )}`,
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
    throw new Error(
      data?.errors?.[0]?.message || "Upstox API request failed"
    );
  }

  return data;
}

export async function getHistoricalCandles(
  instrumentKey: string,
  fromDate: string,
  toDate: string
) {
  const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("UPSTOX_ACCESS_TOKEN is missing");
  }

  const url =
    `${UPSTOX_BASE_URL}/historical-candle/` +
    `${encodeURIComponent(instrumentKey)}/day/${toDate}/${fromDate}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Historical candle error:", data);
    return { candles: [] };
  }

  console.log("HISTORICAL DATA FROM UPSTOX:", data)
return data
}
export async function searchInstrument(query: string, segment: "EQ" | "INDEX" = "EQ") {
  const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("UPSTOX_ACCESS_TOKEN is missing");
  }

  const params = new URLSearchParams({
    query: query.trim(),
    exchanges: "NSE",
    segments: segment,
    page_number: "1",
    records: "20",
  });

  const response = await fetch(
    `https://api.upstox.com/v2/instruments/search?${params.toString()}`,
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
    throw new Error(
      data?.errors?.[0]?.message || "Instrument search failed"
    );
  }

  return data;
}

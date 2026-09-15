import { NextRequest, NextResponse } from "next/server";

const stockNewsDatabase: Record<
  string,
  Array<{ title: string; time: string; source: string; summary: string }>
> = {
  RELIANCE: [
    {
      title:
        "Reliance Industries Q1 FY27 results: Net profit rises 14% YoY to ₹18,951 crore",
      time: "2h ago",
      source: "Economic Times",
      summary:
        "RIL reported strong revenue performance across oil-to-chemicals, retail, and digital services segments.",
    },
    {
      title:
        "Jio Platforms targets 500M subscribers by December 2026 with AI network upgrade",
      time: "4h ago",
      source: "Business Standard",
      summary:
        "Jio is deploying next-generation AI automation for spectrum management and customer experience enhancement.",
    },
    {
      title:
        "Green energy arm invests ₹12,000 crore in solar manufacturing expansion",
      time: "6h ago",
      source: "Mint",
      summary:
        "The Jamnagar giga-factory complex is on track to commission its first solar module manufacturing line.",
    },
    {
      title:
        "Retail segment revenue crosses ₹3 lakh crore annual run rate for first time",
      time: "1d ago",
      source: "CNBC-TV18",
      summary:
        "Reliance Retail expanded its physical footprint by adding 450 new stores during the quarter.",
    },
  ],
  TCS: [
    {
      title:
        "TCS secures $1.5 billion multi-year digital transformation deal with European enterprise",
      time: "1h ago",
      source: "Economic Times",
      summary:
        "Tata Consultancy Services will modernize legacy IT infrastructure using cloud and AI technologies.",
    },
    {
      title:
        "TCS reports 8.2% YoY growth in constant currency revenue for latest quarter",
      time: "3h ago",
      source: "Financial Express",
      summary:
        "Operating margins expanded 40 bps driven by operational efficiency and higher realization.",
    },
    {
      title:
        "TCS expands AI cloud partnership with Microsoft and Google Cloud",
      time: "5h ago",
      source: "Business Standard",
      summary:
        "Over 100,000 TCS engineers have been certified in enterprise generative AI frameworks.",
    },
    {
      title:
        "IT sector outlook brightens as TCS leads deal wins in North America",
      time: "1d ago",
      source: "Mint",
      summary:
        "North American client spending rebounds in BFSI and retail verticals.",
    },
  ],
  INFY: [
    {
      title:
        "Infosys raises FY27 revenue guidance to 4.5%-6.5% following strong digital deal wins",
      time: "2h ago",
      source: "CNBC-TV18",
      summary:
        "Large deal TCV stood at $3.4 billion with 55% net new orders.",
    },
    {
      title:
        "Infosys Topaz generative AI platform sees rapid adoption among Fortune 500 clients",
      time: "4h ago",
      source: "Economic Times",
      summary:
        "Topaz platform capabilities have been integrated across 200+ active enterprise client engagements.",
    },
    {
      title:
        "Board approves strategic acquisition of AI automation consultancy for $280M",
      time: "7h ago",
      source: "Reuters India",
      summary:
        "Acquisition will bolster Infosys' capabilities in smart manufacturing and autonomous workflows.",
    },
    {
      title:
        "Infosys expands European delivery hubs to support growing cloud migration demand",
      time: "1d ago",
      source: "Business Line",
      summary:
        "New Innovation Hub in Frankfurt to focus on Automotive and Financial Services clients.",
    },
  ],
  HDFCBANK: [
    {
      title:
        "HDFC Bank deposit growth accelerates to 16.5% YoY; net interest margin stays robust",
      time: "1h ago",
      source: "Economic Times",
      summary:
        "Casa ratio improved as branch expansion in Tier-2 and Tier-3 cities delivered strong deposit inflows.",
    },
    {
      title:
        "HDFC Bank introduces AI-driven instant credit assessment for SME borrowers",
      time: "4h ago",
      source: "Mint",
      summary:
        "The new digital underwriting system reduces loan approval turnaround time from days to under 10 minutes.",
    },
    {
      title:
        "Retail loan book expands 14% as asset quality remains best-in-class",
      time: "6h ago",
      source: "Financial Express",
      summary:
        "Gross NPA ratio improved to 1.22% while provision coverage ratio reached 74%.",
    },
    {
      title:
        "Analysts maintain 'Buy' rating on HDFC Bank post robust quarterly operational update",
      time: "1d ago",
      source: "CNBC-TV18",
      summary:
        "Brokerages highlight post-merger synergy gains and strong balance sheet health.",
    },
  ],
  SBIN: [
    {
      title:
        "SBI Q1 FY27 net profit climbs 18% to ₹17,400 crore on strong credit growth",
      time: "2h ago",
      source: "Economic Times",
      summary:
        "India's largest lender reported robust credit growth across corporate and retail segments.",
    },
    {
      title:
        "State Bank of India YONO app reaches 85 million active users milestone",
      time: "5h ago",
      source: "Business Standard",
      summary:
        "YONO 2.0 roll-out drives digital account openings and pre-approved personal loans.",
    },
    {
      title:
        "Gross NPA ratio drops to multi-year low of 2.1% as asset quality strengthens",
      time: "8h ago",
      source: "Mint",
      summary:
        "Sustained recovery efforts and lower slippages boost net asset quality.",
    },
    {
      title:
        "SBI leads consortium for ₹25,000 crore green energy infrastructure funding",
      time: "1d ago",
      source: "Financial Express",
      summary:
        "Funding will back utility-scale solar and wind projects across Rajasthan and Gujarat.",
    },
  ],
  HAL: [
    {
      title:
        "HAL receives ₹45,000 crore order for Tejas Mk1A fighter aircraft from Defence Ministry",
      time: "2h ago",
      source: "Economic Times",
      summary:
        "Order extends HAL's manufacturing visibility and order book to record levels above ₹1.2 lakh crore.",
    },
    {
      title:
        "Defence exports hit new high as HAL delivers indigenous helicopters to overseas buyer",
      time: "4h ago",
      source: "Press Trust of India",
      summary:
        "HAL is actively pursuing export opportunities in Southeast Asia and South America.",
    },
    {
      title:
        "HAL expands manufacturing facility in Nashik to boost annual production capacity",
      time: "6h ago",
      source: "Business Standard",
      summary:
        "New assembly lines will accelerate fighter jet production rate to 24 aircraft per year.",
    },
    {
      title:
        "Analyst consensus bullish on HAL order book transparency and revenue visibility",
      time: "1d ago",
      source: "CNBC-TV18",
      summary:
        "Strong government backing and indigenization push position HAL for sustained earnings growth.",
    },
  ],
  "NIFTY 50": [
    {
      title:
        "NIFTY 50 touches new peak driven by strong institutional inflows and banking rally",
      time: "1h ago",
      source: "Economic Times",
      summary:
        "Benchmark index gains momentum as heavyweights HDFC Bank, Reliance, and ICICI Bank push market higher.",
    },
    {
      title:
        "FII buying momentum continues as NIFTY 50 holds above key support levels",
      time: "3h ago",
      source: "Business Standard",
      summary:
        "Foreign institutional investors bought net equities worth ₹3,200 crore in today's session.",
    },
    {
      title:
        "India GDP growth forecast revised upwards, boosting blue-chip NIFTY sentiment",
      time: "6h ago",
      source: "Mint",
      summary:
        "RBI and IMF project robust domestic demand and manufacturing output growth.",
    },
    {
      title:
        "Global markets rally as Indian benchmark NIFTY 50 leads Asian peer indices",
      time: "1d ago",
      source: "CNBC-TV18",
      summary:
        "Positive global inflation data and lower oil prices support risk-on sentiment.",
    },
  ],
  SENSEX: [
    {
      title:
        "SENSEX surges 500 points following positive global cues and strong corporate earnings",
      time: "1h ago",
      source: "Economic Times",
      summary:
        "30-share BSE benchmark index closed near session highs led by financial and IT stocks.",
    },
    {
      title:
        "BSE SENSEX market capitalization crosses historic milestone of $5 trillion",
      time: "4h ago",
      source: "Financial Express",
      summary:
        "India solidifies its position among the world's top equity markets.",
    },
    {
      title:
        "Heavyweight banking and IT stocks lead broad-based rally on Dalal Street",
      time: "6h ago",
      source: "Business Standard",
      summary:
        "24 out of 30 SENSEX components ended in positive territory.",
    },
    {
      title:
        "DII inflows provide strong support to SENSEX despite global market volatility",
      time: "1d ago",
      source: "Mint",
      summary:
        "SIP equity inflows into domestic mutual funds remain at all-time high levels.",
    },
  ],
  "BANK NIFTY": [
    {
      title:
        "BANK NIFTY outstrips benchmark as private lenders report robust credit growth",
      time: "2h ago",
      source: "Economic Times",
      summary:
        "Banking index rallies over 1.2% led by HDFC Bank, ICICI Bank, and SBI.",
    },
    {
      title:
        "RBI policy stance supports banking sector liquidity and stable net interest margins",
      time: "4h ago",
      source: "CNBC-TV18",
      summary:
        "Central bank measures ensure comfortable systemic liquidity for credit expansion.",
    },
    {
      title:
        "Asset quality trends improve across public & private sector banks in BANK NIFTY",
      time: "7h ago",
      source: "Mint",
      summary:
        "Lower credit costs and healthy slippage ratios boost profitability outlook.",
    },
    {
      title:
        "Credit growth speeds up to 15.2% YoY, driving Bank NIFTY to new record high",
      time: "1d ago",
      source: "Business Standard",
      summary:
        "Retail credit demand and capex borrowing fuel credit expansion across major lenders.",
    },
  ],
};

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "";

  if (!symbol) {
    return NextResponse.json(
      { error: "Stock symbol is required" },
      { status: 400 }
    );
  }

  // Check direct database match
  let newsList = stockNewsDatabase[symbol];

  // Check ticker alias matches (e.g. NIFTY -> NIFTY 50)
  if (!newsList) {
    if (symbol.includes("NIFTY 50") || symbol === "NIFTY") {
      newsList = stockNewsDatabase["NIFTY 50"];
    } else if (symbol.includes("SENSEX")) {
      newsList = stockNewsDatabase["SENSEX"];
    } else if (symbol.includes("BANK")) {
      newsList = stockNewsDatabase["BANK NIFTY"];
    }
  }

  // Dynamic fallback for any other stock symbol
  if (!newsList || newsList.length === 0) {
    const formattedName = symbol.replace(/[^A-Z0-9]/g, "");
    newsList = [
      {
        title: `${formattedName} Q1 FY27 results: Net profit increases 12.5% YoY amid strong demand`,
        time: "2h ago",
        source: "Economic Times",
        summary: `${formattedName} reported higher revenue and improved operating margins in the latest quarterly update.`,
      },
      {
        title: `Key brokerages upgrade target price on ${formattedName} following strategic expansion plans`,
        time: "4h ago",
        source: "Business Standard",
        summary: `Analysts highlight strong order pipeline and sector tailwinds benefiting ${formattedName}.`,
      },
      {
        title: `${formattedName} announces strategic investment in AI and digital transformation capabilities`,
        time: "7h ago",
        source: "Mint",
        summary: `The management outlined key growth initiatives aimed at expanding market share and operating efficiency.`,
      },
      {
        title: `Institutional buying interest rises in ${formattedName} as domestic mutual funds increase allocation`,
        time: "1d ago",
        source: "CNBC-TV18",
        summary: `Mutual fund holdings in ${formattedName} surged as fund managers add exposure ahead of sector growth phase.`,
      },
    ];
  }

  return NextResponse.json({
    status: "success",
    symbol,
    data: newsList,
  });
}

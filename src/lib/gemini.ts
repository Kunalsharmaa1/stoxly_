import { INDICATORS, OPERATORS, normalizeIndicatorConfig, validateConditions, type IndicatorConfig, type StrategyCondition } from "@/lib/backtest/indicators";

const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type StrategyDraft = {
  status: "ready" | "clarification";
  clarification: string;
  name: string;
  symbol: string;
  joinType: "AND" | "OR";
  exitJoin: "AND" | "OR";
  entryConditions: StrategyCondition[];
  exitConditions: StrategyCondition[];
};

const supportedSymbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "SBIN", "HAL", "WIPRO", "ICICIBANK", "NIFTY50", "SENSEX", "BANKNIFTY"];
const parameterSchema = { type: "OBJECT", properties: {
  period: { type: "NUMBER" }, fastPeriod: { type: "NUMBER" }, slowPeriod: { type: "NUMBER" }, signalPeriod: { type: "NUMBER" },
  standardDeviations: { type: "NUMBER" }, kPeriod: { type: "NUMBER" }, dPeriod: { type: "NUMBER" }, atrPeriod: { type: "NUMBER" },
  multiplier: { type: "NUMBER" }, step: { type: "NUMBER" }, maxStep: { type: "NUMBER" },
} };
const indicatorConfigSchema = { type: "OBJECT", properties: {
  indicator: { type: "STRING", enum: INDICATORS }, output: { type: "STRING" }, params: parameterSchema,
}, required: ["indicator"] };
const conditionSchema = { type: "OBJECT", properties: {
  indicator: { type: "STRING", enum: INDICATORS }, output: { type: "STRING" }, params: parameterSchema,
  operator: { type: "STRING", enum: OPERATORS }, value: { type: "STRING" }, valueIndicator: indicatorConfigSchema,
}, required: ["indicator", "operator", "value"] };

const responseSchema = {
  type: "OBJECT",
  properties: {
    status: { type: "STRING", enum: ["ready", "clarification"] },
    clarification: { type: "STRING" },
    name: { type: "STRING" },
    symbol: { type: "STRING" },
    joinType: { type: "STRING", enum: ["AND", "OR"] },
    exitJoin: { type: "STRING", enum: ["AND", "OR"] },
    entryConditions: { type: "ARRAY", items: conditionSchema },
    exitConditions: { type: "ARRAY", items: conditionSchema },
  },
  required: ["status", "clarification", "name", "symbol", "joinType", "exitJoin", "entryConditions", "exitConditions"],
};

function validateDraft(value: unknown): StrategyDraft {
  const draft = value as StrategyDraft;
  if (!draft || !["ready", "clarification"].includes(draft.status)) throw new Error("Gemini returned an invalid strategy response.");
  if (draft.status === "clarification") {
    return { ...draft, clarification: String(draft.clarification || "Please clarify the missing strategy details."), entryConditions: [], exitConditions: [] };
  }
  if (!supportedSymbols.includes(draft.symbol.toUpperCase()) || !draft.name?.trim()) throw new Error("That symbol is not supported by the existing backtest engine. Choose a supported NSE instrument.");
  if (!["AND", "OR"].includes(draft.joinType) || !["AND", "OR"].includes(draft.exitJoin)) {
    throw new Error("The strategy contains a rule the backtest engine does not support.");
  }
  try {
    validateConditions(draft.entryConditions, "Entry conditions");
    validateConditions(draft.exitConditions, "Exit conditions");
    draft.entryConditions.forEach(condition => normalizeIndicatorConfig(condition));
  } catch { throw new Error("The strategy contains an unsupported indicator, output, parameter, operator, or comparison."); }
  return draft;
}

export async function generateStrategy(prompt: string, selectedSymbol: string): Promise<StrategyDraft> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured. Set GEMINI_API_KEY on the server.");

  const systemInstructions = `Translate the user's natural-language trading strategy into JSON only, matching the supplied schema. This is a rule translator only: never calculate indicators, prices, backtest results, trades, returns, or performance metrics. Supported symbols are RELIANCE, TCS, INFY, HDFCBANK, SBIN, HAL, WIPRO, ICICIBANK, NIFTY50, SENSEX, and BANKNIFTY. Supported indicators: Price (Close/Open/High/Low), Volume, RSI, EMA, SMA, VWAP, MACD (MACD Line/Signal Line/Histogram), Bollinger Bands (Upper Band/Middle Band/Lower Band), ATR, ADX (ADX/+DI/-DI), Stochastic Oscillator (%K/%D), Supertrend (Value/Direction), CCI, OBV, ROC, Williams %R, MFI, Parabolic SAR. Supported operators: <, >, <=, >=, =, crosses above, crosses below. Configure periods with params using indicator defaults when omitted: RSI14, EMA20, SMA50, MACD 12/26/9, Bollinger 20 with 2 deviations, ATR14, ADX14, Stochastic 14/3, Supertrend ATR10 multiplier3, CCI20, ROC12, Williams %R14, MFI14, Parabolic SAR step .02 max .2. For Price/Volume/EMA/SMA/RSI/ATR and every other indicator, use default output line when the user does not request a specific line. For series-vs-series conditions, put the right side in valueIndicator and set value to an empty string; for numeric comparisons, set value to the numeric string and omit valueIndicator. For crosses, compare previous and current values for two valid numeric series. Require an unambiguous supported symbol explicitly in the user's request, at least one entry rule, and at least one exit rule. Selected instrument is context only and must not fill in a missing symbol. If any required part is unclear or symbol unsupported, return status clarification, ask a concise question, and include no conditions. Normalize symbol uppercase. Preserve requested logic and joins; use AND entry and OR exit only when unspecified. Do not include stop loss, take profit, timeframe, or dates.`;
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstructions }] },
      contents: [{ role: "user", parts: [{ text: `Selected instrument: ${selectedSymbol}\nStrategy request: ${prompt}` }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema },
    }),
  });

  if (response.status === 429) throw new Error("Gemini free-tier quota is exhausted or rate limited. Please try again after the quota resets.");
  if (!response.ok) {
    if ([400, 403].includes(response.status)) throw new Error("Gemini could not process this request with the configured API access. Check the key and free-tier availability; no paid model fallback was attempted.");
    throw new Error("Gemini is temporarily unavailable. No paid model fallback was attempted.");
  }
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty response. Please revise the strategy request.");
  try { return validateDraft(JSON.parse(text)); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error("Gemini returned an unreadable strategy. Please try a more specific request.");
    throw error;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateStrategy } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const selectedSymbol = typeof body?.selectedSymbol === "string" ? body.selectedSymbol.trim() : "";
    if (!prompt || prompt.length > 2000) return NextResponse.json({ error: "Enter a strategy request (up to 2,000 characters)." }, { status: 400 });
    if (!selectedSymbol || selectedSymbol.length > 30) return NextResponse.json({ error: "Select a valid instrument before generating rules." }, { status: 400 });
    const strategy = await generateStrategy(prompt, selectedSymbol);
    return NextResponse.json({ strategy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate a strategy.";
    return NextResponse.json({ error: message }, { status: message.includes("quota") ? 429 : 502 });
  }
}

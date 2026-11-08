import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are AB Agent, a helpful, friendly, capable AI assistant.
Respond to the user's question clearly and directly. Match their language (including Urdu, Roman Urdu, and English).
You are excellent at programming, debugging, explaining code, writing, planning, and everyday questions.
When writing code, provide complete useful code and explain how to run it when relevant.
Be honest about limitations. Do not claim that you completed actions outside this chat (such as deploying websites, sending messages, or changing accounts) unless a connected tool actually performed them.
Use readable markdown and fenced code blocks.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Gateway API key missing. Add AI_GATEWAY_API_KEY in Vercel Project Settings → Environment Variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const rawMessages = body?.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: "Please send a message." }, { status: 400 });
    }

    // Bound payload and allow only user/assistant text messages to protect the API route.
    const messages = rawMessages.slice(-24).map((m: any) => {
      const role = m?.role === "assistant" ? "assistant" : "user";
      const content = typeof m?.content === "string" ? m.content.slice(0, 16000) : "";
      return { role, content };
    }).filter((m: {content:string}) => m.content.trim().length > 0);

    if (!messages.length) return NextResponse.json({ error: "Message content is empty." }, { status: 400 });

    const upstream = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "openai/gpt-5.5",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(55000),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = data?.error?.message || data?.message || `AI Gateway request failed (${upstream.status}).`;
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message.includes("timeout") ? "The AI took too long. Please retry." : message }, { status: 500 });
  }
}

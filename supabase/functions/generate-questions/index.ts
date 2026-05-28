// Supabase Edge Function — Generate Questions
// Deploy: supabase functions deploy generate-questions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { case_summary, key_facts, all_document_text, set_type, client_name } =
      await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const prompt = `You are a legal preparation assistant. A lawyer is preparing their client for an upcoming legal proceeding.

Case summary: ${case_summary}

Key facts: ${key_facts}

Case documents: ${all_document_text || "(no documents uploaded yet)"}

Client name: ${client_name}

Question set type: ${set_type}

Generate exactly 3 practice questions that this client is likely to face during their deposition or testimony. These questions must be:
- Highly specific to this case — not generic
- Appropriate for the selected set type
- Grounded in the actual facts and documents provided
- Ordered from less challenging to more challenging
- Phrased exactly as opposing counsel might phrase them in a real deposition

Return a JSON array of exactly 3 question strings. Nothing else. No explanations. No markdown. Just the raw JSON array.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await response.json();
    const text = data.content[0].text.trim();
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) throw new Error("AI did not return an array");

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-questions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

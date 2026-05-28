// Supabase Edge Function — Per-Answer Session Feedback
// Deploy: supabase functions deploy session-feedback
// Env vars needed: ANTHROPIC_API_KEY

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
    const {
      case_summary,
      key_facts,
      set_type,
      prior_qa,          // string — formatted Q&A history before this answer
      question,          // string — the current question
      answer,            // string — the client's answer
      question_number,   // number — 1-based index for context
      total_questions,   // number
      next_question,     // string | null — the upcoming question, for forward-looking coaching
    } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const priorContext = prior_qa
      ? `\nConversation so far:\n${prior_qa}\n`
      : "";

    const nextQuestionHint = next_question
      ? `\nThe next question will be: "${next_question}"\nIf the client's current answer leaves something unresolved that will be exposed by the next question, flag it briefly so they can prepare.`
      : "";

    const prompt = `You are a legal preparation coach. A client is practicing for a ${set_type} session (question ${question_number} of ${total_questions}).

Case summary: ${case_summary}

Key facts: ${key_facts}
${priorContext}
Latest question: ${question}
Client's answer: ${answer}

Assess this answer in exactly 2-3 sentences. Look for:
- Information volunteered that wasn't asked (opposing counsel will use this)
- Speculation or guessing instead of "I don't know" / "I don't recall"
- Inconsistency with the stated case facts or prior answers
- Whether the answer was appropriately concise and direct

If the answer was strong, say so briefly. If it was weak, be specific about what to fix.
Be direct — do not soften feedback. The client needs honest coaching, not validation.
${nextQuestionHint}
Return ONLY the feedback text. No labels, no JSON, no markdown.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await response.json();
    const feedback = data.content[0].text.trim();

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("session-feedback error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Supabase Edge Function — Analyse Session & Generate Report
// Deploy: supabase functions deploy analyse-session
// Env vars needed: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callClaude(apiKey: string, prompt: string, maxTokens = 4096): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      question_set_id,
      case_id,
      client_id,
      case_summary,
      key_facts,
      all_document_text,
      set_type,
      questions_and_answers,
    } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env vars not set");

    // ── Step 1: Analyse responses ──────────────────────────────────────────
    const analysisPrompt = `You are a legal analyst reviewing a client's practice deposition responses on behalf of their lawyer.

Case summary: ${case_summary}

Key facts: ${key_facts}

Case documents: ${all_document_text || "(no documents)"}

The client completed a "${set_type}" practice session. Here are their questions and answers:

${questions_and_answers}

Analyse the client's responses and return a JSON object with EXACTLY this structure (no extra fields, no markdown):

{
  "overall_assessment": "2-3 sentence overall assessment",
  "consistency_score": 6,
  "strong_points": ["string", "string"],
  "weak_points": [
    {
      "question_refs": ["Q1", "Q3"],
      "finding": "description of weakness",
      "risk_level": "High"
    }
  ],
  "contradictions": [
    {
      "question_a": "question text",
      "answer_a": "client answer",
      "question_b": "question text",
      "answer_b": "client answer",
      "description": "description of contradiction"
    }
  ],
  "document_conflicts": [
    {
      "question_ref": "Q7",
      "client_answer": "what client said",
      "document_excerpt": "relevant excerpt from case documents",
      "description": "description of conflict"
    }
  ],
  "volunteered_information": [
    "description of what was volunteered and in which question"
  ],
  "recommended_next_set": "which set type to assign next and why"
}

Be strict. A score of 8 or above should be rare and earned. Flag every inconsistency, every instance of volunteering information, every vague answer where documents suggest the client should have specifics. If there are no contradictions, document_conflicts, or volunteered_information items, return empty arrays for those fields. Return ONLY the JSON object, no markdown fences.`;

    const analysisRaw = await callClaude(apiKey, analysisPrompt, 4096);
    const cleanedAnalysis = analysisRaw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const analysis = JSON.parse(cleanedAnalysis);

    // ── Step 2: Format human-readable report ────────────────────────────────
    const formatPrompt = `Convert the following JSON analysis into a clean, professional written report formatted for a lawyer to read. Use clear section headers (##). Be direct and specific. Do not soften findings. The lawyer needs actionable intelligence, not polite summaries.

JSON:
${JSON.stringify(analysis, null, 2)}

Write the full report now.`;

    const rawReportText = await callClaude(apiKey, formatPrompt, 2048);

    // ── Step 3: Save report to Supabase ─────────────────────────────────────
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        question_set_id,
        case_id,
        client_id,
        overall_assessment: analysis.overall_assessment,
        consistency_score: analysis.consistency_score,
        strong_points: analysis.strong_points,
        weak_points: analysis.weak_points,
        contradictions: analysis.contradictions,
        document_conflicts: analysis.document_conflicts,
        volunteered_information: analysis.volunteered_information,
        recommended_next_set: analysis.recommended_next_set,
        raw_report_text: rawReportText,
      }),
    });

    if (!insertResponse.ok) {
      const err = await insertResponse.text();
      throw new Error(`Failed to save report: ${err}`);
    }

    const [report] = await insertResponse.json();

    return new Response(JSON.stringify({ success: true, report_id: report.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyse-session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { supabase } from './supabase';
import type { QuestionSetType, SessionResponse } from '@/types';

// Get real-time coaching feedback on a single answer
export async function getSessionFeedback(params: {
  case_summary: string;
  key_facts: string;
  set_type: QuestionSetType;
  prior_responses: SessionResponse[];
  question: string;
  answer: string;
  question_number: number;
  total_questions: number;
  next_question?: string;
}): Promise<string> {
  const prior_qa = params.prior_responses
    .map((r, i) => `Q${i + 1}: ${r.question_text}\nA: ${r.answer_text}`)
    .join('\n\n');

  const { data, error } = await supabase.functions.invoke('session-feedback', {
    body: {
      case_summary: params.case_summary,
      key_facts: params.key_facts,
      set_type: params.set_type,
      prior_qa: prior_qa || null,
      question: params.question,
      answer: params.answer,
      question_number: params.question_number,
      total_questions: params.total_questions,
      next_question: params.next_question ?? null,
    },
  });

  if (error) throw new Error(`Feedback failed: ${error.message}`);
  if (!data?.feedback) throw new Error('No feedback returned');
  return data.feedback as string;
}

// Generate practice questions via Supabase Edge Function
export async function generateQuestions(params: {
  case_summary: string;
  key_facts: string;
  all_document_text: string;
  set_type: string;
  client_name: string;
  off_limits_topics?: string[];
}): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: params,
  });

  if (error) throw new Error(`Question generation failed: ${error.message}`);
  if (!data?.questions || !Array.isArray(data.questions)) {
    throw new Error('Invalid response from question generation');
  }
  return data.questions as string[];
}

// Trigger session analysis + report generation via Supabase Edge Function
export async function analyseSession(params: {
  question_set_id: string;
  case_id: string;
  client_id: string;
  case_summary: string;
  key_facts: string;
  all_document_text: string;
  set_type: QuestionSetType;
  responses: SessionResponse[];
}): Promise<{ report_id: string }> {
  const questionsAndAnswers = params.responses
    .map((r, i) => `Q${i + 1}: ${r.question_text}\nA: ${r.answer_text}`)
    .join('\n\n');

  const { data, error } = await supabase.functions.invoke('analyse-session', {
    body: {
      question_set_id: params.question_set_id,
      case_id: params.case_id,
      client_id: params.client_id,
      case_summary: params.case_summary,
      key_facts: params.key_facts,
      all_document_text: params.all_document_text,
      set_type: params.set_type,
      questions_and_answers: questionsAndAnswers,
    },
  });

  if (error) throw new Error(`Session analysis failed: ${error.message}`);
  if (!data?.report_id) throw new Error('No report ID returned from analysis');
  return { report_id: data.report_id };
}

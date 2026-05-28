import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { analyseSession } from '@/lib/claude';
import { useAuth } from '@/hooks/useAuth';
import { VoiceRecorder } from '@/components/client/VoiceRecorder';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { isMicrophoneSupported } from '@/lib/elevenlabs';
import type { QuestionSet, SessionResponse } from '@/types';

async function fetchCaseContext(caseId: string) {
  const [{ data: caseData }, { data: docs }] = await Promise.all([
    supabase.from('cases').select('summary, key_facts').eq('id', caseId).single(),
    supabase.from('case_documents').select('extracted_text').eq('case_id', caseId),
  ]);
  return {
    summary: caseData?.summary ?? '',
    key_facts: caseData?.key_facts ?? '',
    allDocText:
      docs?.map((d) => d.extracted_text ?? '').filter(Boolean).join('\n\n---\n\n') ?? '',
  };
}

export default function Session() {
  const { questionSetId } = useParams<{ questionSetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answerType, setAnswerType] = useState<'voice' | 'text'>('voice');
  const [textMode, setTextMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedResponses, setSavedResponses] = useState<SessionResponse[]>([]);
  const [caseContext, setCaseContext] = useState<{
    summary: string;
    key_facts: string;
    allDocText: string;
  } | null>(null);

  const micSupported = isMicrophoneSupported();

  useEffect(() => {
    if (!questionSetId) return;
    supabase
      .from('question_sets')
      .select('*')
      .eq('id', questionSetId)
      .single()
      .then(async ({ data, error: qsErr }) => {
        if (qsErr || !data) {
          setError('Session not found.');
          setLoading(false);
          return;
        }
        const qs = data as QuestionSet;
        setQuestionSet(qs);

        const ctx = await fetchCaseContext(qs.case_id);
        setCaseContext(ctx);

        const { data: responses } = await supabase
          .from('session_responses')
          .select('*')
          .eq('question_set_id', questionSetId)
          .order('question_index');
        if (responses && responses.length > 0) {
          setSavedResponses(responses as SessionResponse[]);
          setCurrentIndex(responses.length);
        }
        setLoading(false);
      });
  }, [questionSetId]);

  useEffect(() => {
    if (questionSet && questionSet.status === 'pending') {
      supabase.from('question_sets').update({ status: 'in_progress' }).eq('id', questionSet.id);
    }
  }, [questionSet]);

  const handleVoiceTranscript = (text: string) => {
    setAnswer(text);
    setAnswerType('voice');
  };

  const handleSubmitAnswer = async () => {
    if (!questionSet || !user || !answer.trim()) return;
    setSubmitting(true);
    setError(null);

    const question = questionSet.questions[currentIndex];
    const isLast = currentIndex === questionSet.questions.length - 1;

    const { data: savedResp, error: saveErr } = await supabase
      .from('session_responses')
      .insert({
        question_set_id: questionSet.id,
        question_index: currentIndex,
        question_text: question,
        answer_text: answer.trim(),
        answer_type: answerType,
      })
      .select()
      .single();

    if (saveErr) {
      setError('Failed to save answer. Please try again.');
      setSubmitting(false);
      return;
    }

    const allResponses = [...savedResponses, savedResp as SessionResponse];
    setSavedResponses(allResponses);

    if (isLast) {
      await supabase
        .from('question_sets')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', questionSet.id);

      if (caseContext) {
        analyseSession({
          question_set_id: questionSet.id,
          case_id: questionSet.case_id,
          client_id: user.id,
          case_summary: caseContext.summary,
          key_facts: caseContext.key_facts,
          all_document_text: caseContext.allDocText,
          set_type: questionSet.set_type,
          responses: allResponses,
        }).catch(console.error);
      }

      navigate('/prepare/complete', { replace: true });
    } else {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setAnswerType('voice');
      setTextMode(false);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-emerald border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !questionSet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
        <p className="text-emerald/60 italic mb-4">{error ?? 'Session not found.'}</p>
        <button
          onClick={() => navigate('/prepare')}
          className="text-sm text-emerald underline underline-offset-4"
        >
          Go back
        </button>
      </div>
    );
  }

  const total = questionSet.questions.length;
  const question = questionSet.questions[currentIndex];
  const canSubmit = answer.trim().length > 0 && !submitting;

  return (
    <div className="min-h-screen bg-background text-emerald flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-emerald/5 px-6 py-5">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <span className="font-serif text-2xl italic tracking-tight">Prepd</span>
          <Eyebrow>Practice Session</Eyebrow>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 pt-8 pb-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1 h-px bg-emerald/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-emerald-soft transition-all duration-500"
              style={{ width: `${(Math.min(currentIndex, total) / total) * 100}%` }}
            />
          </div>
          <Eyebrow>
            Question {currentIndex + 1} of {total}
          </Eyebrow>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12 animate-fade-up">
        <div className="w-full max-w-2xl space-y-10">
          {/* Question */}
          <h1 className="font-serif text-3xl lg:text-4xl italic leading-snug text-balance text-center">
            "{question}"
          </h1>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 border border-[#f3c5c5] bg-[#fde9e9] text-[#8a1a1a] text-sm text-center">
              {error}
            </div>
          )}

          {/* Voice mode */}
          {micSupported && !textMode && (
            <div className="flex flex-col items-center gap-6">
              <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={submitting} />
              {answer && (
                <div className="w-full bg-card border border-emerald/10 p-6">
                  <Eyebrow className="block mb-2">Transcribed answer</Eyebrow>
                  <p className="text-sm leading-relaxed text-emerald/80">{answer}</p>
                </div>
              )}
              <button
                type="button"
                className="text-[10px] uppercase tracking-[0.2em] text-emerald/45 hover:text-emerald transition-colors"
                onClick={() => { setTextMode(true); setAnswer(''); }}
              >
                Type instead
              </button>
            </div>
          )}

          {/* Text mode */}
          {(textMode || !micSupported) && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => { setAnswer(e.target.value); setAnswerType('text'); }}
                  placeholder="Speak or type your answer here…"
                  rows={6}
                  disabled={submitting}
                  autoFocus
                  className="w-full bg-card border border-emerald/15 p-6 focus:outline-none focus:border-emerald/40 text-base leading-relaxed text-emerald/85 placeholder:text-emerald/30 resize-none font-sans"
                />
              </div>
              {micSupported && (
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-[0.2em] text-emerald/45 hover:text-emerald transition-colors"
                  onClick={() => { setTextMode(false); setAnswer(''); }}
                >
                  Use voice instead
                </button>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmitAnswer}
              disabled={!canSubmit}
              className="px-10 py-4 bg-emerald text-cream text-sm font-semibold uppercase tracking-[0.18em] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-soft transition-colors"
            >
              {submitting
                ? 'Saving…'
                : currentIndex === total - 1
                ? 'Submit final answer'
                : 'Submit answer'}
            </button>
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-emerald/35">
            Your answers are reviewed only by your lawyer
          </p>
        </div>
      </div>
    </div>
  );
}

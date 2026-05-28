import { useState } from 'react';
import { Loader2, Zap, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateQuestions } from '@/lib/claude';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QUESTION_SET_TYPES } from '@/types';
import type { QuestionSetType, Case, CaseDocument, User, QuestionSet } from '@/types';

const FOUNDATION_TYPE = 'Background & Timeline' as QuestionSetType;

interface AssignSetModalProps {
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
  case_: Case;
  client: User;
  documents: CaseDocument[];
  clientSessions: QuestionSet[];
}

export function AssignSetModal({
  open,
  onClose,
  onAssigned,
  case_,
  client,
  documents,
  clientSessions,
}: AssignSetModalProps) {
  const isFirstSession = clientSessions.length === 0;

  const [setType, setSetType] = useState<QuestionSetType | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'generating'>('select');

  const handleAssign = async () => {
    const resolvedType = isFirstSession ? FOUNDATION_TYPE : (setType as QuestionSetType);
    if (!isFirstSession && !setType) { setError('Please select a session type'); return; }

    setLoading(true);
    setError(null);
    setStep('generating');

    try {
      const allDocumentText = documents
        .map((d) => d.extracted_text ?? '')
        .filter(Boolean)
        .join('\n\n---\n\n');

      const promptType = isFirstSession
        ? 'Essential Foundation — generate the 3 most critical questions covering: core timeline and events, key facts and contradictions in the evidence, client credibility, and anything a lawyer must know before the first deposition. Prioritise questions that expose weakness or risk early.'
        : resolvedType;

      const questions = await generateQuestions({
        case_summary: case_.summary ?? '',
        key_facts: case_.key_facts ?? '',
        all_document_text: allDocumentText,
        set_type: promptType,
        client_name: client.full_name,
      });

      const { error: dbError } = await supabase.from('question_sets').insert({
        case_id: case_.id,
        client_id: client.id,
        set_type: resolvedType,
        questions,
        status: 'pending',
      });

      if (dbError) throw new Error(dbError.message);

      onAssigned();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSetType('');
    setError(null);
    setStep('select');
    onClose();
  };

  const selectedTypeInfo = QUESTION_SET_TYPES.find((t) => t.value === setType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md !bg-[#faf6ea] border border-emerald/20 text-[#064e3b]">
        <DialogHeader>
          <DialogTitle className="text-[#064e3b] font-serif text-xl italic font-normal">
            {isFirstSession ? 'Start first session' : 'Assign follow-up session'}
          </DialogTitle>
          <DialogDescription className="text-[#064e3b]/70 text-sm">
            For <strong className="text-[#064e3b] font-semibold">{client.full_name}</strong> —{' '}
            {isFirstSession
              ? 'AI will generate 3 targeted questions covering the most critical aspects of the case.'
              : 'Choose a focus area for the next round of practice questions.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'generating' ? (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#064e3b]" />
            <div>
              <p className="font-medium text-[#064e3b]">Generating questions…</p>
              <p className="text-sm text-[#064e3b]/60 mt-1">
                Claude is reading your case documents and crafting targeted questions.
                This takes 10–20 seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-[#8a1a1a] bg-[#fde9e9] border border-[#f3c5c5] px-3 py-2">
                {error}
              </div>
            )}

            {isFirstSession ? (
              <div className="border border-emerald/15 bg-[#064e3b]/5 p-4">
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-[#064e3b] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#064e3b]">Essential Foundation session</p>
                    <p className="text-sm text-[#064e3b]/70 mt-1 leading-relaxed">
                      Claude will generate 3 questions covering the core timeline, key facts,
                      and credibility — the most important things to establish before the first deposition.
                    </p>
                  </div>
                </div>
                {documents.length === 0 && (
                  <div className="bg-gold/10 border border-gold/25 px-3 py-2 text-sm text-[#064e3b]/80 mt-3">
                    No documents uploaded — questions will be based on the case summary and key facts only.
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#064e3b]/45">
                    Focus area
                  </Label>
                  <Select value={setType} onValueChange={(v) => setSetType(v as QuestionSetType)}>
                    <SelectTrigger className="bg-[#f5f0e0] border-emerald/15 text-[#064e3b]">
                      <SelectValue placeholder="Select a focus area…" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#faf6ea] border-emerald/15 text-[#064e3b]">
                      {QUESTION_SET_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-[#064e3b] focus:bg-[#064e3b]/5">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTypeInfo && (
                  <div className="border border-emerald/10 bg-[#064e3b]/[0.03] px-4 py-3 text-sm text-[#064e3b]/70">
                    {selectedTypeInfo.description}
                  </div>
                )}

                {documents.length === 0 && (
                  <div className="bg-gold/10 border border-gold/25 px-3 py-2 text-sm text-[#064e3b]/80">
                    No documents uploaded — questions will be based on the case summary and key facts only.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'select' && (
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-emerald/15 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#064e3b] hover:bg-[#064e3b]/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={(!isFirstSession && !setType) || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#064e3b] text-[#f5f0e0] text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-[#0d7a5f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              Generate &amp; assign
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

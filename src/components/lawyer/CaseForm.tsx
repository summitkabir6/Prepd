import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Case } from '@/types';

const CASE_TYPES = [
  'Civil Litigation',
  'Criminal Defense',
  'Employment',
  'Family',
  'Real Estate',
  'Personal Injury',
  'Other',
];

const DRAFT_KEY = 'prepd_new_case_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface CaseFormProps {
  existingCase?: Case;
  onSaved?: () => void;
}

export function CaseForm({ existingCase, onSaved }: CaseFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = !!existingCase;
  const draft = !isEdit ? loadDraft() : null;

  const [name, setName] = useState(existingCase?.name ?? draft?.name ?? '');
  const [caseType, setCaseType] = useState(existingCase?.case_type ?? draft?.caseType ?? '');
  const [trialDate, setTrialDate] = useState(existingCase?.trial_date ?? draft?.trialDate ?? '');
  const [courtName, setCourtName] = useState(existingCase?.court_name ?? draft?.courtName ?? '');
  const [summary, setSummary] = useState(existingCase?.summary ?? draft?.summary ?? '');
  const [keyFacts, setKeyFacts] = useState(existingCase?.key_facts ?? draft?.keyFacts ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save draft on every keystroke (new case only)
  useEffect(() => {
    if (isEdit) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, caseType, trialDate, courtName, summary, keyFacts }));
  }, [name, caseType, trialDate, courtName, summary, keyFacts, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { setError('Case name is required'); return; }
    if (!caseType) { setError('Case type is required'); return; }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      case_type: caseType,
      trial_date: trialDate || null,
      court_name: courtName.trim() || null,
      summary: summary.trim(),
      key_facts: keyFacts.trim(),
    };

    let caseId: string;

    if (isEdit) {
      const { error: updateErr } = await supabase
        .from('cases')
        .update(payload)
        .eq('id', existingCase.id);

      if (updateErr) { setError(updateErr.message); setLoading(false); return; }
      caseId = existingCase.id;
      onSaved?.();
    } else {
      const { data, error: insertErr } = await supabase
        .from('cases')
        .insert({ ...payload, lawyer_id: user.id })
        .select()
        .single();

      if (insertErr || !data) { setError(insertErr?.message ?? 'Failed to create case'); setLoading(false); return; }
      caseId = data.id;
      localStorage.removeItem(DRAFT_KEY);
      navigate('/cases/' + caseId);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="name">Case name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smith v. Acme Corporation"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caseType">Case type *</Label>
          <Select value={caseType} onValueChange={setCaseType}>
            <SelectTrigger id="caseType">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {CASE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trialDate">Trial date (optional)</Label>
          <Input
            id="trialDate"
            type="date"
            value={trialDate}
            onChange={(e) => setTrialDate(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="courtName">Court name (optional)</Label>
          <Input
            id="courtName"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            placeholder="e.g. Ontario Superior Court of Justice"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="summary">Case summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Describe the case in your own words..."
            rows={5}
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="keyFacts">Key facts</Label>
          <Textarea
            id="keyFacts"
            value={keyFacts}
            onChange={(e) => setKeyFacts(e.target.value)}
            placeholder="Bullet-point the critical facts, dates, contradictions..."
            rows={5}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create case'}
        </Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onSaved}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

import { useNavigate } from 'react-router-dom';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { formatTrialDate, daysUntil } from '@/lib/utils';
import type { Case } from '@/types';

interface CaseCardProps {
  case_: Case;
  clientCount: number;
  hasNewReport: boolean;
  hasActiveSession: boolean;
}

export function CaseCard({ case_, clientCount, hasNewReport, hasActiveSession }: CaseCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="group p-8 border border-emerald/10 bg-card hover:bg-emerald/[0.04] transition-colors cursor-pointer"
      onClick={() => navigate(`/cases/${case_.id}`)}
    >
      <Eyebrow tone="gold">{case_.case_type}</Eyebrow>
      <h3 className="font-serif text-2xl mt-4 mb-2 italic">{case_.name}</h3>
      <p className="text-sm text-emerald/60 mb-6">
        {clientCount} {clientCount === 1 ? 'client' : 'clients'}
        {case_.trial_date && ` · ${formatTrialDate(case_.trial_date)}`}
      </p>
      <div className="h-px bg-emerald/10 mb-6" />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold underline decoration-gold/50 underline-offset-4">
          View Case
        </span>
        <div className="flex items-center gap-2">
          {hasNewReport && (
            <span className="size-2 rounded-full bg-gold" title="Report ready" />
          )}
          {hasActiveSession && !hasNewReport && (
            <span className="size-2 rounded-full bg-emerald-soft" title="Session in progress" />
          )}
        </div>
      </div>
    </div>
  );
}

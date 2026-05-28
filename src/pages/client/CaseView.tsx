import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientCaseDetail } from '@/hooks/useCase';
import { Layout } from '@/components/shared/Layout';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { EmptyState } from '@/components/prepd/EmptyState';
import { RiskPill } from '@/components/prepd/RiskPill';
import { daysUntil, formatTrialDate, formatDateTime } from '@/lib/utils';
import type { QuestionSet, Report } from '@/types';

type Tab = 'overview' | 'sessions';

function SessionRow({
  qs,
  report,
  onBegin,
}: {
  qs: QuestionSet;
  report?: Report;
  onBegin?: () => void;
}) {
  const isPending = qs.status === 'pending' || qs.status === 'in_progress';

  return (
    <li className="py-6 border-b border-emerald/10 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <Eyebrow tone="gold">{qs.set_type}</Eyebrow>
          <p className="font-serif text-xl italic mt-1">
            {isPending
              ? qs.status === 'in_progress'
                ? 'In progress'
                : 'Ready to begin'
              : `Completed ${formatDateTime(qs.completed_at ?? qs.created_at)}`}
          </p>
        </div>
        {isPending && onBegin && (
          <button
            onClick={onBegin}
            className="px-5 py-2.5 bg-emerald-soft text-cream text-[11px] uppercase tracking-[0.18em] font-semibold hover:brightness-110 transition-all"
          >
            {qs.status === 'in_progress' ? 'Continue' : 'Begin'}
          </button>
        )}
        {!isPending && report && (
          <div className="text-right">
            <Eyebrow>Score</Eyebrow>
            <p className="font-serif text-3xl italic text-gold">
              {report.consistency_score.toFixed(1)}
              <span className="text-sm text-emerald/45 font-sans not-italic"> / 10</span>
            </p>
          </div>
        )}
      </div>

      {report && (report.strong_points?.length > 0 || report.weak_points?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-6 mt-4 pt-4 border-t border-emerald/10">
          {report.strong_points?.length > 0 && (
            <div>
              <Eyebrow tone="emerald" className="block mb-2">What went well</Eyebrow>
              <p className="text-sm text-emerald/75 leading-relaxed">
                {report.strong_points[0]}
              </p>
            </div>
          )}
          {report.weak_points?.length > 0 && (
            <div>
              <Eyebrow className="block mb-2">Where to focus</Eyebrow>
              <div className="flex items-start gap-2">
                <p className="text-sm text-emerald/75 leading-relaxed flex-1">
                  {report.weak_points[0].finding}
                </p>
                <RiskPill risk={report.weak_points[0].risk_level} />
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function CaseView() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tab = (searchParams.get('tab') ?? 'overview') as Tab;
  const setTab = (t: Tab) =>
    setSearchParams(t === 'overview' ? {} : { tab: t });

  const { caseData, questionSets, reports, loading } = useClientCaseDetail(caseId, user?.id);

  if (loading) {
    return (
      <Layout maxWidth="narrow">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-emerald border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout maxWidth="narrow">
        <div className="text-center py-20">
          <p className="text-emerald/60 italic">Case not found.</p>
          <button
            onClick={() => navigate('/prepare')}
            className="mt-4 text-sm text-emerald underline underline-offset-4"
          >
            Back
          </button>
        </div>
      </Layout>
    );
  }

  const pendingSet = questionSets.find(
    (qs) => qs.status === 'pending' || qs.status === 'in_progress',
  );
  const completedSets = questionSets.filter((qs) => qs.status === 'completed');
  const reportByQS = new Map(reports.map((r) => [r.question_set_id, r]));

  return (
    <Layout maxWidth="narrow">
      <div className="max-w-3xl mx-auto animate-fade-up">
        <button onClick={() => navigate('/prepare')} className="inline-block mb-4">
          <Eyebrow>← Home</Eyebrow>
        </button>

        {/* Header */}
        <header className="mb-10">
          <Eyebrow tone="gold" className="block mb-3">{caseData.case_type}</Eyebrow>
          <h1 className="font-serif text-5xl italic mb-2">{caseData.name}</h1>
          {caseData.trial_date && (
            <p className="text-sm text-emerald/55">
              {daysUntil(caseData.trial_date)} days until trial ·{' '}
              {formatTrialDate(caseData.trial_date)}
              {caseData.court_name && ` · ${caseData.court_name}`}
            </p>
          )}
        </header>

        {/* Inline tabs */}
        <nav className="flex gap-8 border-b border-emerald/10 mb-10">
          {(['overview', 'sessions'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'pb-3 text-[11px] uppercase tracking-[0.18em] font-semibold transition-colors ' +
                (tab === t
                  ? 'text-emerald border-b-2 border-emerald'
                  : 'text-emerald/40 hover:text-emerald/70')
              }
            >
              {t === 'sessions' ? 'My Sessions' : 'Overview'}
              {t === 'sessions' && questionSets.length > 0 && (
                <span className="ml-2 text-[9px] text-emerald/40">{questionSets.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-10">
            <section>
              <Eyebrow className="block mb-3">About this case</Eyebrow>
              <p className="font-serif text-lg leading-relaxed text-emerald/85">
                {caseData.summary || <span className="italic text-emerald/40">No summary provided.</span>}
              </p>
            </section>
            {caseData.key_facts && (
              <section>
                <Eyebrow className="block mb-3">Key facts</Eyebrow>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-card border border-emerald/10 p-6">
                  {caseData.key_facts}
                </pre>
              </section>
            )}
            {pendingSet && (
              <div className="p-8 bg-emerald text-cream">
                <Eyebrow className="block mb-3 text-cream/55">Session ready</Eyebrow>
                <p className="font-serif text-2xl italic mb-4">
                  Your {pendingSet.set_type.toLowerCase()} session is waiting.
                </p>
                <button
                  onClick={() => navigate(`/prepare/session/${pendingSet.id}`)}
                  className="inline-block px-6 py-3 bg-gold text-emerald text-[11px] uppercase tracking-[0.18em] font-bold hover:brightness-105 transition-all"
                >
                  Begin Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sessions */}
        {tab === 'sessions' && (
          <div>
            {questionSets.length === 0 ? (
              <EmptyState
                title="No sessions yet."
                description="Your lawyer will assign practice sessions here."
              />
            ) : (
              <ul className="border-t border-emerald/10">
                {pendingSet && (
                  <SessionRow
                    key={pendingSet.id}
                    qs={pendingSet}
                    onBegin={() => navigate(`/prepare/session/${pendingSet.id}`)}
                  />
                )}
                {completedSets.map((qs) => (
                  <SessionRow
                    key={qs.id}
                    qs={qs}
                    report={reportByQS.get(qs.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

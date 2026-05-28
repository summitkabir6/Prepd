import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCase';
import { Layout } from '@/components/shared/Layout';
import { CaseCard } from '@/components/lawyer/CaseCard';
import { EmptyState } from '@/components/prepd/EmptyState';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { daysUntil, formatTrialDate } from '@/lib/utils';
import type { Case } from '@/types';

interface CaseMeta {
  clientCount: number;
  hasNewReport: boolean;
  hasActiveSession: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, loading } = useCases(user?.id);
  const [meta, setMeta] = useState<Record<string, CaseMeta>>({});

  useEffect(() => {
    if (cases.length === 0) return;
    fetchMeta(cases);
  }, [cases]);

  const fetchMeta = async (cases: Case[]) => {
    const caseIds = cases.map((c) => c.id);
    const [clientsRes, qsRes, reportsRes] = await Promise.all([
      supabase.from('case_clients').select('case_id, client_id').in('case_id', caseIds),
      supabase
        .from('question_sets')
        .select('case_id, status')
        .in('case_id', caseIds)
        .eq('status', 'in_progress'),
      supabase
        .from('reports')
        .select('case_id, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false }),
    ]);

    const newMeta: Record<string, CaseMeta> = {};
    for (const c of cases) {
      const clients = clientsRes.data?.filter((x) => x.case_id === c.id) ?? [];
      const activeSession = qsRes.data?.some((x) => x.case_id === c.id) ?? false;
      const latestReport = reportsRes.data?.find((x) => x.case_id === c.id);
      const hasNewReport = latestReport
        ? Date.now() - new Date(latestReport.created_at).getTime() < 24 * 60 * 60 * 1000
        : false;
      newMeta[c.id] = {
        clientCount: clients.length,
        hasNewReport,
        hasActiveSession: activeSession,
      };
    }
    setMeta(newMeta);
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-fade-up space-y-12">
          <div className="h-8 w-48 bg-emerald/5 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 border border-emerald/10 bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (cases.length === 0) {
    return (
      <Layout>
        <div className="animate-fade-up">
          <Eyebrow className="block mb-8">Active Litigation</Eyebrow>
          <EmptyState
            title="No cases yet."
            description="Create your first case to start preparing clients."
          >
            <button
              onClick={() => navigate('/cases/new')}
              className="px-6 py-3 bg-emerald text-cream text-sm font-medium hover:bg-emerald-soft transition-colors"
            >
              + Open a new matter
            </button>
          </EmptyState>
        </div>
      </Layout>
    );
  }

  const featured = cases[0];
  const rest = cases.slice(1);
  const featuredMeta = meta[featured.id];

  return (
    <Layout>
      <div className="animate-fade-up">
        <Eyebrow className="block mb-8">Active Litigation</Eyebrow>

        {/* Featured hero case */}
        <section className="grid lg:grid-cols-12 gap-12 items-start mb-20">
          <div className="lg:col-span-8">
            {featuredMeta?.hasNewReport && (
              <span className="inline-block px-3 py-1 bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6 italic">
                Report Ready
              </span>
            )}
            <Link to={`/cases/${featured.id}`}>
              <h1 className="font-serif text-5xl lg:text-7xl leading-[0.95] text-balance mb-6 italic hover:text-emerald-soft transition-colors">
                {featured.name}
              </h1>
            </Link>
            {featured.summary && (
              <p className="text-lg leading-relaxed text-emerald/80 max-w-[56ch] mb-8">
                {featured.summary}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-emerald/60">
              <span>
                {featuredMeta?.clientCount ?? 0}{' '}
                {(featuredMeta?.clientCount ?? 0) === 1 ? 'client' : 'clients'} attached
              </span>
              {featuredMeta?.hasActiveSession && (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-soft" />
                  Session in progress
                </span>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 border-l border-emerald/10 pl-10 lg:pl-12 space-y-8">
            {featured.trial_date && (
              <div>
                <Eyebrow className="block mb-2">Trial Countdown</Eyebrow>
                <p className="font-serif text-4xl italic">{daysUntil(featured.trial_date)} Days</p>
                <p className="mt-1 text-xs text-emerald/50">{formatTrialDate(featured.trial_date)}</p>
              </div>
            )}
            <div>
              <Eyebrow className="block mb-2">Case Type</Eyebrow>
              <p className="text-lg font-medium">{featured.case_type}</p>
            </div>
            {featured.court_name && (
              <div>
                <Eyebrow className="block mb-2">Venue</Eyebrow>
                <p className="text-sm text-emerald/80">{featured.court_name}</p>
              </div>
            )}
            <Link
              to={`/cases/${featured.id}`}
              className="block w-full py-4 bg-emerald text-cream text-center text-sm font-medium hover:bg-emerald-soft transition-colors"
            >
              {featuredMeta?.hasNewReport ? 'Review Full Report' : 'Open Case File'}
            </Link>
          </aside>
        </section>

        {/* All other cases */}
        {(rest.length > 0 || true) && (
          <>
            <Eyebrow className="block mb-6">All Cases</Eyebrow>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rest.map((c) => (
                <CaseCard
                  key={c.id}
                  case_={c}
                  clientCount={meta[c.id]?.clientCount ?? 0}
                  hasNewReport={meta[c.id]?.hasNewReport ?? false}
                  hasActiveSession={meta[c.id]?.hasActiveSession ?? false}
                />
              ))}
              {/* New case card */}
              <div
                className="group p-8 border border-dashed border-emerald/20 flex flex-col items-center justify-center text-center hover:border-emerald/40 transition-colors cursor-pointer"
                onClick={() => navigate('/cases/new')}
              >
                <span className="font-serif text-3xl italic text-emerald/40 group-hover:text-emerald transition-colors">
                  + New Case
                </span>
                <p className="mt-2 text-xs text-emerald/40 uppercase tracking-[0.2em]">
                  Start a new file
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/shared/Layout';
import { CaseForm } from '@/components/lawyer/CaseForm';
import { DocumentUpload } from '@/components/lawyer/DocumentUpload';
import { ClientList } from '@/components/lawyer/ClientList';
import { EmptyState } from '@/components/prepd/EmptyState';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { useCaseDetail } from '@/hooks/useCase';
import { buildReportPdfBlob } from '@/lib/pdf';
import { daysUntil, formatTrialDate, formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';

type Tab = 'overview' | 'documents' | 'clients' | 'reports';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'documents',  label: 'Documents'  },
  { id: 'clients',    label: 'Clients'    },
  { id: 'reports',    label: 'Reports'    },
];

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const tab = (searchParams.get('tab') ?? 'overview') as Tab;
  const setTab = (t: Tab) => setSearchParams(t === 'overview' ? {} : { tab: t });

  const { caseData, clients, documents, questionSets, reports, loading, refetch } =
    useCaseDetail(caseId);

  const handleDownloadReport = (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    const client = report.users;
    const qs = report.question_sets;
    if (!client || !qs || !caseData) return;
    const blob = buildReportPdfBlob(report, qs, client, caseData);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepd-report-${client.full_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-emerald border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-emerald/60 italic">Case not found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-sm text-emerald underline underline-offset-4"
          >
            Back to dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-up space-y-0">
        {/* Header */}
        <header className="mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-block mb-4"
          >
            <Eyebrow>← All Cases</Eyebrow>
          </button>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <Eyebrow tone="gold" className="block mb-3">{caseData.case_type}</Eyebrow>
              <h1 className="font-serif text-5xl lg:text-7xl leading-[0.95] italic text-balance">
                {caseData.name}
              </h1>
            </div>
            {caseData.trial_date && (
              <div className="text-right">
                <Eyebrow className="block mb-2">Trial</Eyebrow>
                <p className="font-serif text-3xl italic">{daysUntil(caseData.trial_date)} Days</p>
                <p className="text-xs text-emerald/50">{formatTrialDate(caseData.trial_date)}</p>
              </div>
            )}
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex gap-10 border-b border-emerald/10 mb-12 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'pb-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ' +
                (tab === t.id
                  ? 'text-emerald border-b-2 border-emerald'
                  : 'text-emerald/40 hover:text-emerald/70')
              }
            >
              {t.label}
              {t.id === 'documents' && documents.length > 0 && (
                <span className="ml-2 text-[9px] text-emerald/40">{documents.length}</span>
              )}
              {t.id === 'clients' && clients.length > 0 && (
                <span className="ml-2 text-[9px] text-emerald/40">{clients.length}</span>
              )}
              {t.id === 'reports' && reports.length > 0 && (
                <span className="ml-2 text-[9px] text-emerald/40">{reports.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-12">
              {editing ? (
                <div>
                  <Eyebrow className="block mb-6">Edit Case Details</Eyebrow>
                  <CaseForm
                    existingCase={caseData}
                    onSaved={() => { setEditing(false); refetch(); }}
                  />
                </div>
              ) : (
                <>
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <Eyebrow>Case Summary</Eyebrow>
                      <button
                        onClick={() => setEditing(true)}
                        className="text-[10px] uppercase tracking-[0.2em] text-emerald/50 hover:text-emerald transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="font-serif text-lg leading-relaxed text-emerald/85">
                      {caseData.summary || <span className="italic text-emerald/40">Not provided</span>}
                    </p>
                  </section>

                  <section>
                    <Eyebrow className="block mb-4">Key Facts</Eyebrow>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-emerald/80 bg-card border border-emerald/10 p-6">
                      {caseData.key_facts || <span className="italic text-emerald/40">Not provided</span>}
                    </pre>
                  </section>
                </>
              )}
            </div>

            <aside className="lg:col-span-4 space-y-8 border-l border-emerald/10 lg:pl-10">
              <div>
                <Eyebrow className="block mb-2">Case Type</Eyebrow>
                <p className="text-lg">{caseData.case_type}</p>
              </div>
              {caseData.court_name && (
                <div>
                  <Eyebrow className="block mb-2">Venue</Eyebrow>
                  <p className="text-sm">{caseData.court_name}</p>
                </div>
              )}
              {caseData.trial_date && (
                <div>
                  <Eyebrow className="block mb-2">Trial Date</Eyebrow>
                  <p className="text-sm">{formatTrialDate(caseData.trial_date)}</p>
                </div>
              )}
              <div>
                <Eyebrow className="block mb-2">Clients</Eyebrow>
                <p className="text-sm">{clients.length} attached</p>
              </div>
            </aside>
          </div>
        )}

        {/* Documents */}
        {tab === 'documents' && (
          <DocumentUpload caseId={caseData.id} documents={documents} onUpdate={refetch} />
        )}

        {/* Clients */}
        {tab === 'clients' && (
          <ClientList
            caseId={caseData.id}
            case_={caseData}
            clients={clients}
            documents={documents}
            questionSets={questionSets}
            reports={reports}
            onUpdate={refetch}
          />
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div>
            {reports.length === 0 ? (
              <EmptyState
                eyebrow="No reports yet"
                title="Reports appear here as sessions complete."
                description="Assign a session to a client, and their consistency report will land here for your review."
              />
            ) : (
              <ul className="divide-y divide-emerald/10 border-y border-emerald/10">
                {reports.map((report) => {
                  const client = report.users;
                  const qs = report.question_sets;
                  return (
                    <li
                      key={report.id}
                      className="py-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-emerald/[0.02] transition-colors px-1"
                      onClick={() =>
                        navigate(
                          `/cases/${caseId}/clients/${report.client_id}/report/${report.id}`,
                        )
                      }
                    >
                      <div>
                        <Eyebrow tone="gold">{qs?.set_type ?? 'Session'}</Eyebrow>
                        <p className="font-serif text-2xl italic mt-1">
                          {client?.full_name ?? 'Client'}
                        </p>
                        <p className="text-xs text-emerald/50 mt-0.5">
                          Completed {formatDateTime(report.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <Eyebrow>Consistency</Eyebrow>
                          <p className="font-serif text-4xl italic text-gold">
                            {report.consistency_score.toFixed(1)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleDownloadReport(e, report)}
                            className="px-4 py-2 border border-emerald/15 text-[11px] uppercase tracking-[0.15em] font-semibold hover:bg-emerald/5 transition-colors"
                          >
                            PDF
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/cases/${caseId}/clients/${report.client_id}/report/${report.id}`,
                              );
                            }}
                            className="px-4 py-2 bg-emerald text-cream text-[11px] uppercase tracking-[0.15em] font-semibold hover:bg-emerald-soft transition-colors"
                          >
                            Open Report
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

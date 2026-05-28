import { useNavigate } from 'react-router-dom';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { RiskPill } from '@/components/prepd/RiskPill';
import { buildReportPdfBlob } from '@/lib/pdf';
import { formatDateTime } from '@/lib/utils';
import type { Report, QuestionSet, User, Case } from '@/types';

interface ReportViewProps {
  report: Report;
  questionSet: QuestionSet;
  client: User;
  case_: Case;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-emerald/55">{label}</dt>
      <dd className="font-serif text-2xl italic">{value}</dd>
    </div>
  );
}

// Truncate to first N sentences
function firstSentences(text: string, n: number): string {
  const matches = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return matches.slice(0, n).join(' ').trim();
}

export function ReportView({ report, questionSet, client, case_ }: ReportViewProps) {
  const navigate = useNavigate();

  const highRisk    = report.weak_points.filter(wp => wp.risk_level === 'High').slice(0, 2);
  const weakToShow  = report.weak_points.slice(0, 3);
  const strongToShow = report.strong_points.slice(0, 2);
  const contraToShow = report.contradictions.slice(0, 2);
  const docToShow   = report.document_conflicts.slice(0, 2);
  const volToShow   = report.volunteered_information.slice(0, 2);

  const redFlagCount =
    highRisk.length + contraToShow.length + docToShow.length;

  const handleDownloadPDF = () => {
    const blob = buildReportPdfBlob(report, questionSet, client, case_);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepd-report-${client.full_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-up">
      {/* Back */}
      <div className="mb-6 print:hidden">
        <button onClick={() => navigate(`/cases/${case_.id}?tab=reports`)}>
          <Eyebrow>← All Reports</Eyebrow>
        </button>
      </div>

      {/* Header */}
      <header className="mb-12 pb-8 border-b border-emerald/10">
        <Eyebrow tone="gold">{questionSet.set_type} · Session Report</Eyebrow>
        <h1 className="font-serif text-5xl lg:text-6xl italic leading-[0.95] mt-3 mb-4">
          {client.full_name}
        </h1>
        <p className="text-sm text-emerald/55">
          {case_.name} · Completed {formatDateTime(report.created_at)}
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* ── Main column ── */}
        <div className="lg:col-span-8 space-y-14">

          {/* Overall Assessment — 2 sentences */}
          <section>
            <Eyebrow className="block mb-4">Overall Assessment</Eyebrow>
            <p className="font-serif text-lg leading-relaxed text-emerald/85 max-w-[58ch]">
              {firstSentences(report.overall_assessment, 2)}
            </p>
          </section>

          {/* Red Flags — max 2 high-risk items */}
          {highRisk.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="size-2 bg-gold rounded-full" />
                <Eyebrow tone="gold">
                  High Priority Flags · {redFlagCount}
                </Eyebrow>
              </div>
              <div className="space-y-3">
                {highRisk.map((wp, i) => (
                  <div key={i} className="p-6 bg-gold/5 border border-gold/20">
                    <p className="text-sm text-emerald/80 leading-relaxed">{wp.finding}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weak Points — max 3, no question refs */}
          {weakToShow.length > 0 && (
            <section>
              <Eyebrow className="block mb-4">Risk Assessment</Eyebrow>
              <ul className="divide-y divide-emerald/10 border-y border-emerald/10">
                {weakToShow.map((wp, i) => (
                  <li key={i} className="py-4 flex items-start justify-between gap-4">
                    <p className="text-sm text-emerald/80 leading-relaxed max-w-[42ch]">
                      {wp.finding}
                    </p>
                    <RiskPill risk={wp.risk_level} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Strong Points — max 2 */}
          {strongToShow.length > 0 && (
            <section>
              <Eyebrow className="block mb-4">Strong Points</Eyebrow>
              <ul className="space-y-2">
                {strongToShow.map((sp, i) => (
                  <li key={i} className="flex gap-4 text-sm text-emerald/80 leading-relaxed">
                    <span className="text-gold font-serif text-lg leading-none mt-0.5">·</span>
                    <span>{sp}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contradictions — max 2, description + quotes only */}
          {contraToShow.length > 0 && (
            <section>
              <Eyebrow className="block mb-4">Contradictions</Eyebrow>
              <div className="space-y-6">
                {contraToShow.map((cd, i) => (
                  <div key={i}>
                    <p className="text-sm text-emerald/65 mb-3">{cd.description}</p>
                    <div className="grid md:grid-cols-2 border border-emerald/10 divide-x divide-emerald/10">
                      <div className="p-5">
                        <Eyebrow className="block mb-2">Earlier</Eyebrow>
                        <p className="font-serif italic text-sm leading-snug">
                          "{cd.answer_a.length > 100 ? cd.answer_a.slice(0, 100) + '…' : cd.answer_a}"
                        </p>
                      </div>
                      <div className="p-5 bg-emerald/[0.03]">
                        <Eyebrow tone="emerald" className="block mb-2">Later</Eyebrow>
                        <p className="font-serif italic text-sm leading-snug text-emerald-soft">
                          "{cd.answer_b.length > 100 ? cd.answer_b.slice(0, 100) + '…' : cd.answer_b}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Document Conflicts — max 2 */}
          {docToShow.length > 0 && (
            <section>
              <Eyebrow className="block mb-4">Document Conflicts</Eyebrow>
              <div className="space-y-4">
                {docToShow.map((dc, i) => (
                  <div key={i} className="border border-emerald/10">
                    <div className="px-5 py-3 border-b border-emerald/10 bg-emerald/[0.02]">
                      <span className="text-sm font-serif italic">{dc.description}</span>
                    </div>
                    <div className="grid md:grid-cols-2 divide-x divide-emerald/10">
                      <div className="p-5">
                        <Eyebrow className="block mb-2">Client said</Eyebrow>
                        <p className="font-serif italic text-sm leading-snug">
                          "{dc.client_answer.length > 100 ? dc.client_answer.slice(0, 100) + '…' : dc.client_answer}"
                        </p>
                      </div>
                      <div className="p-5 bg-gold/[0.04]">
                        <Eyebrow tone="gold" className="block mb-2">Document</Eyebrow>
                        <p className="font-serif italic text-sm leading-snug text-emerald-soft">
                          "{dc.document_excerpt.length > 100 ? dc.document_excerpt.slice(0, 100) + '…' : dc.document_excerpt}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Volunteered Info — max 2 */}
          {volToShow.length > 0 && (
            <section>
              <Eyebrow className="block mb-4">Volunteered Information</Eyebrow>
              <ul className="space-y-2">
                {volToShow.map((v, i) => (
                  <li
                    key={i}
                    className="text-sm text-emerald/80 leading-relaxed border-l-2 border-gold/40 pl-4"
                  >
                    {v}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recommended Next — name only, no paragraph */}
          {report.recommended_next_set && (
            <section className="border-t border-emerald/10 pt-8">
              <Eyebrow className="block mb-3">Recommended Next Session</Eyebrow>
              <p className="font-serif text-2xl italic">{report.recommended_next_set}</p>
            </section>
          )}
        </div>

        {/* ── Sticky sidebar ── */}
        <aside className="lg:col-span-4 print:hidden">
          <div className="sticky top-28 space-y-5">
            {/* Score */}
            <div className="p-8 bg-emerald text-cream">
              <Eyebrow className="block mb-3 text-cream/55">Consistency Score</Eyebrow>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-7xl italic">
                  {report.consistency_score.toFixed(1)}
                </span>
                <span className="text-xl text-cream/40">/ 10</span>
              </div>
              <div className="mt-5 h-1 w-full bg-cream/10 overflow-hidden">
                <div
                  className="h-full bg-gold transition-all"
                  style={{ width: `${report.consistency_score * 10}%` }}
                />
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownloadPDF}
              className="w-full py-3 bg-cream border border-emerald/15 text-emerald text-sm font-semibold hover:bg-emerald/5 transition-colors"
            >
              Download PDF
            </button>

            {/* Quick stats */}
            <div className="p-5 border border-emerald/10 bg-card">
              <Eyebrow className="block mb-4">At a Glance</Eyebrow>
              <dl className="space-y-3">
                <Stat label="Red flags"      value={String(redFlagCount)} />
                <Stat label="Contradictions" value={String(report.contradictions.length)} />
                <Stat label="Doc conflicts"  value={String(report.document_conflicts.length)} />
                <Stat label="Strong points"  value={String(report.strong_points.length)} />
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

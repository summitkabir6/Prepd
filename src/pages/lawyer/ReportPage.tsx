import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/shared/Layout';
import { ReportView } from '@/components/lawyer/ReportView';
import type { Report, QuestionSet, User, Case } from '@/types';

export default function ReportPage() {
  const { caseId, clientId, reportId } = useParams<{
    caseId: string;
    clientId: string;
    reportId: string;
  }>();

  const [report, setReport] = useState<Report | null>(null);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [case_, setCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId || !clientId || !caseId) return;

    Promise.all([
      supabase.from('reports').select('*').eq('id', reportId).single(),
      supabase.from('users').select('*').eq('id', clientId).single(),
      supabase.from('cases').select('*').eq('id', caseId).single(),
    ]).then(async ([reportRes, clientRes, caseRes]) => {
      if (reportRes.error || clientRes.error || caseRes.error) {
        setError('Failed to load report data.');
        setLoading(false);
        return;
      }

      const reportData = reportRes.data as Report;
      const qsRes = await supabase
        .from('question_sets')
        .select('*')
        .eq('id', reportData.question_set_id)
        .single();

      setReport(reportData);
      setQuestionSet(qsRes.data as QuestionSet);
      setClient(clientRes.data as User);
      setCase(caseRes.data as Case);
      setLoading(false);
    });
  }, [reportId, clientId, caseId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !report || !questionSet || !client || !case_) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error ?? 'Report not found.'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ReportView
        report={report}
        questionSet={questionSet}
        client={client}
        case_={case_}
      />
    </Layout>
  );
}

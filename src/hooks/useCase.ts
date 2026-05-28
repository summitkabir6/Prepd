import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Case, CaseClient, CaseDocument, QuestionSet, Report, PendingInvite } from '@/types';

export function useCases(lawyerId: string | undefined) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    if (!lawyerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setCases(data as Case[]);
    setLoading(false);
  }, [lawyerId]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  return { cases, loading, error, refetch: fetchCases };
}

export function useCaseDetail(caseId: string | undefined) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [clients, setClients] = useState<CaseClient[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);

    const [caseRes, clientsRes, docsRes, qsRes, reportsRes] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase.from('case_clients').select('*, users(*)').eq('case_id', caseId),
      supabase.from('case_documents').select('*').eq('case_id', caseId).order('uploaded_at', { ascending: false }),
      supabase.from('question_sets').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
      supabase.from('reports').select('*, question_sets(*), users(*)').eq('case_id', caseId).order('created_at', { ascending: false }),
    ]);

    if (caseRes.data) setCaseData(caseRes.data as Case);
    if (clientsRes.data) setClients(clientsRes.data as CaseClient[]);
    if (docsRes.data) setDocuments(docsRes.data as CaseDocument[]);
    if (qsRes.data) setQuestionSets(qsRes.data as QuestionSet[]);
    if (reportsRes.data) setReports(reportsRes.data as Report[]);

    setLoading(false);
  }, [caseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Real-time: refetch when question_sets or reports change for this case
  useEffect(() => {
    if (!caseId) return;

    const qsChannel = supabase
      .channel(`qs_changes_${caseId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'question_sets',
        filter: `case_id=eq.${caseId}`,
      }, () => fetchAll())
      .subscribe();

    const reportsChannel = supabase
      .channel(`reports_changes_${caseId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
        filter: `case_id=eq.${caseId}`,
      }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(qsChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [caseId, fetchAll]);

  return { caseData, clients, documents, questionSets, reports, loading, refetch: fetchAll };
}

export function useClientSession(clientId: string | undefined) {
  const [pendingSet, setPendingSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const { data } = await supabase
      .from('question_sets')
      .select('*')
      .eq('client_id', clientId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);

    setPendingSet(data?.[0] as QuestionSet ?? null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  return { pendingSet, loading, refetch: fetchPending };
}

export function useClientCases(clientId: string | undefined) {
  const [cases, setCases] = useState<Array<{ id: string; name: string; case_type: string; trial_date: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('case_clients')
      .select('cases(id, name, case_type, trial_date)')
      .eq('client_id', clientId);
    const mapped = ((data ?? []) as unknown as Array<{ cases: { id: string; name: string; case_type: string; trial_date: string | null } | null }>)
      .map((row) => row.cases)
      .filter(Boolean) as Array<{ id: string; name: string; case_type: string; trial_date: string | null }>;
    setCases(mapped);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchCases(); }, [fetchCases]);
  return { cases, loading, refetch: fetchCases };
}

export function useClientCaseDetail(caseId: string | undefined, clientId: string | undefined) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!caseId || !clientId) return;
    setLoading(true);

    const [caseRes, docsRes, qsRes, reportsRes] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase.from('case_documents').select('*').eq('case_id', caseId).order('uploaded_at', { ascending: false }),
      supabase.from('question_sets').select('*').eq('case_id', caseId).eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('reports').select('*, question_sets(*)').eq('case_id', caseId).eq('client_id', clientId).order('created_at', { ascending: false }),
    ]);

    if (caseRes.data) setCaseData(caseRes.data as Case);
    if (docsRes.data) setDocuments(docsRes.data as CaseDocument[]);
    if (qsRes.data) setQuestionSets(qsRes.data as QuestionSet[]);
    if (reportsRes.data) setReports(reportsRes.data as Report[]);

    setLoading(false);
  }, [caseId, clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { caseData, documents, questionSets, reports, loading, refetch: fetchAll };
}

export function usePendingInvites(userEmail: string | undefined) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!userEmail) {
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.rpc('get_pending_invites_for_user');
    setInvites((data as PendingInvite[] | null) ?? []);
    setLoading(false);
  }, [userEmail]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  return { invites, loading, refetch: fetchInvites };
}

import { useState, useEffect } from 'react';
import { UserPlus, FileText, ClipboardList, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssignSetModal } from './AssignSetModal';
import { InviteClientModal } from './InviteClientModal';
import { formatDateTime } from '@/lib/utils';
import type { CaseClient, Case, CaseDocument, QuestionSet, Report } from '@/types';

interface ClientListProps {
  caseId: string;
  case_: Case;
  clients: CaseClient[];
  documents: CaseDocument[];
  questionSets: QuestionSet[];
  reports: Report[];
  onUpdate: () => void;
}

export function ClientList({
  caseId,
  case_,
  clients,
  documents,
  questionSets,
  reports,
  onUpdate,
}: ClientListProps) {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<CaseClient | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('case_clients_' + caseId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case_clients', filter: `case_id=eq.${caseId}` },
        () => onUpdate(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, onUpdate]);

  const getClientSessions = (clientId: string) =>
    questionSets.filter((qs) => qs.client_id === clientId);

  const getLatestReport = (clientId: string) =>
    reports.find((r) => r.client_id === clientId);

  const hasNewReport = (clientId: string) => {
    const report = getLatestReport(clientId);
    if (!report) return false;
    const latestQs = questionSets.find(
      (qs) => qs.client_id === clientId && qs.status === 'completed'
    );
    if (!latestQs) return false;
    return report.question_set_id === latestQs.id;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'} attached to this case
        </p>
        <Button onClick={() => setInviteOpen(true)} size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No clients yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Invite a client to start assigning practice sessions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((cc) => {
            if (!cc.users) return null;
            const client = cc.users;
            const sessions = getClientSessions(client.id);
            const completedCount = sessions.filter((s) => s.status === 'completed').length;
            const latestReport = getLatestReport(client.id);
            const reportReady = hasNewReport(client.id);
            const activeSession = sessions.find((s) => s.status === 'in_progress');
            const pendingSession = sessions.find((s) => s.status === 'pending');
            const hasOpenSession = !!(activeSession || pendingSession);

            return (
              <div
                key={cc.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{client.full_name}</p>
                    {reportReady && (
                      <Badge variant="amber" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Report ready
                      </Badge>
                    )}
                    {pendingSession && (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Session pending
                      </Badge>
                    )}
                    {activeSession && (
                      <Badge variant="green">Session in progress</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {client.email} · {completedCount} completed{' '}
                    {completedCount === 1 ? 'session' : 'sessions'}
                    {sessions.length > 0 &&
                      ` · Last: ${formatDateTime(sessions[0].created_at)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {latestReport && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        navigate(
                          `/cases/${caseId}/clients/${client.id}/report/${latestReport.id}`
                        )
                      }
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View report
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={hasOpenSession}
                    title={hasOpenSession ? 'Client has an incomplete session' : undefined}
                    onClick={() => setAssignTarget(cc)}
                  >
                    Assign session
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InviteClientModal
        caseId={caseId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => { setInviteOpen(false); onUpdate(); }}
      />

      {assignTarget && assignTarget.users && (
        <AssignSetModal
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => { setAssignTarget(null); onUpdate(); }}
          case_={case_}
          client={assignTarget.users}
          documents={documents}
          clientSessions={getClientSessions(assignTarget.users.id)}
        />
      )}
    </div>
  );
}

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientSession, usePendingInvites, useClientCases } from '@/hooks/useCase';
import { Layout } from '@/components/shared/Layout';
import { Eyebrow } from '@/components/prepd/Eyebrow';
import { EmptyState } from '@/components/prepd/EmptyState';
import { supabase } from '@/lib/supabase';
import { daysUntil, formatTrialDate } from '@/lib/utils';
import type { PendingInvite } from '@/types';

export default function Prepare() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingSet, loading } = useClientSession(user?.id);
  const { invites, loading: invitesLoading, refetch: refetchInvites } = usePendingInvites(user?.email);
  const { cases, loading: casesLoading, refetch: refetchCases } = useClientCases(user?.id);

  async function handleAccept(invite: PendingInvite) {
    if (!user) return;
    await supabase
      .from('case_clients')
      .insert({ case_id: invite.case_id, client_id: user.id, status: 'active' });
    await supabase
      .from('client_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
    refetchInvites();
  }

  async function handleDecline(invite: PendingInvite) {
    await supabase.from('client_invites').delete().eq('id', invite.id);
    refetchInvites();
    refetchCases();
  }

  if (loading || invitesLoading || casesLoading) {
    return (
      <Layout maxWidth="narrow">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-emerald border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Layout maxWidth="narrow">
      <div className="max-w-2xl mx-auto animate-fade-up">
        {/* Hero header */}
        <header className="text-center mb-14">
          <Eyebrow className="block mb-4">Welcome back</Eyebrow>
          <h1 className="font-serif text-5xl lg:text-6xl italic leading-[0.95]">
            {firstName}, you're in the right place.
          </h1>
          <p className="mt-4 text-emerald/65 text-sm leading-relaxed max-w-md mx-auto">
            Your case and your next practice session live here. There are no wrong answers in
            practice — only better ones.
          </p>
        </header>

        {cases.length === 0 && invites.length === 0 && (
          <EmptyState
            title="No cases yet."
            description="You'll see invitations from your lawyer here."
          />
        )}

        <div className="space-y-6">
          {/* Active cases */}
          {cases.map((c) => (
            <article
              key={c.id}
              className="bg-card border border-emerald/10 p-10"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                  <Eyebrow>Active Case</Eyebrow>
                  <Link to={`/prepare/case/${c.id}`}>
                    <h2 className="font-serif text-3xl italic mt-2 hover:text-emerald-soft transition-colors">
                      {c.name}
                    </h2>
                  </Link>
                  <p className="mt-2 text-xs text-emerald/55">{c.case_type}</p>
                </div>
                {c.trial_date && (
                  <div className="text-right">
                    <Eyebrow>Trial</Eyebrow>
                    <p className="font-serif text-xl italic mt-1">
                      {daysUntil(c.trial_date)} days
                    </p>
                    <p className="text-xs text-emerald/50">{formatTrialDate(c.trial_date)}</p>
                  </div>
                )}
              </div>

              {pendingSet && pendingSet.case_id === c.id ? (
                <button
                  onClick={() => navigate(`/prepare/session/${pendingSet.id}`)}
                  className="w-full py-5 bg-emerald-soft text-cream font-semibold hover:brightness-110 transition-all text-sm uppercase tracking-[0.18em]"
                >
                  {pendingSet.status === 'in_progress'
                    ? 'Continue Session'
                    : 'Begin Session'}
                </button>
              ) : (
                <Link
                  to={`/prepare/case/${c.id}`}
                  className="block w-full py-5 border border-emerald/15 text-center text-sm font-medium hover:bg-emerald/5 transition-colors"
                >
                  Open Case
                </Link>
              )}
            </article>
          ))}

          {/* Pending invitations */}
          {invites.map((invite) => (
            <article
              key={invite.id}
              className="p-8 border border-dashed border-emerald/25 bg-cream/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Eyebrow tone="gold">New Invitation</Eyebrow>
                  <p className="font-serif text-xl italic mt-2">{invite.case_name}</p>
                  <p className="text-xs text-emerald/55 mt-1">Sent by {invite.lawyer_name}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(invite)}
                    className="px-5 py-2.5 bg-emerald text-cream text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-emerald-soft transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invite)}
                    className="px-5 py-2.5 border border-emerald/15 text-[11px] uppercase tracking-[0.18em] font-semibold hover:bg-emerald/5 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scale, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientInvite } from '@/types';

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<ClientInvite | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    supabase
      .from('client_invites')
      .select('*, cases(name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setInviteError('This invite link is invalid or has already been used.');
        } else {
          setInvite(data as ClientInvite);
          setFullName(data.full_name);
        }
        setLoadingInvite(false);
      });
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setFormError(null);

    if (password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setFormError('Passwords do not match.'); return; }

    setSubmitting(true);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: { full_name: fullName.trim(), role: 'client' },
      },
    });

    if (authError || !authData.user) {
      setFormError(authError?.message ?? 'Signup failed. Try again.');
      setSubmitting(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Upsert user profile (trigger may already have created it)
    await supabase.from('users').upsert({
      id: userId,
      email: invite.email,
      full_name: fullName.trim(),
      role: 'client',
    });

    // 3. Attach client to case
    await supabase.from('case_clients').upsert({
      case_id: invite.case_id,
      client_id: userId,
      status: 'active',
    });

    // 4. Mark invite as accepted
    await supabase
      .from('client_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    navigate('/prepare', { replace: true });
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Scale className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Invalid invite</h1>
          <p className="text-sm text-muted-foreground">{inviteError}</p>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">You've been invited</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your lawyer has invited you to prepare for your upcoming case
              {invite?.cases?.name ? `: "${invite.cases.name}"` : ''}.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-8 space-y-6">
          <h2 className="text-lg font-semibold">Create your account</h2>

          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
              {formError}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invFullName">Full name</Label>
              <Input
                id="invFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invEmail">Email</Label>
              <Input
                id="invEmail"
                type="email"
                value={invite?.email ?? ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invPassword">Create password</Label>
              <Input
                id="invPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invConfirmPassword">Confirm password</Label>
              <Input
                id="invConfirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account & continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

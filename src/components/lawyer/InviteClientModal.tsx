import { useState } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface InviteClientModalProps {
  caseId: string;
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export function InviteClientModal({ caseId, open, onClose, onInvited }: InviteClientModalProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedName, setInvitedName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: inviteErr } = await supabase
      .from('client_invites')
      .insert({
        case_id: caseId,
        lawyer_id: user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
      })
      .select()
      .single();

    if (inviteErr || !data) {
      setError(inviteErr?.message ?? 'Failed to create invite');
      setLoading(false);
      return;
    }

    setInvitedName(fullName.trim());
    setLoading(false);
  };

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setInvitedName(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite client</DialogTitle>
          <DialogDescription>
            Enter your client's details. They will see the invitation when they log in.
          </DialogDescription>
        </DialogHeader>

        {invitedName ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800">Invitation sent.</p>
              <p className="text-sm text-green-700 mt-1">
                {invitedName} will see it when they log in.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => { handleClose(); onInvited(); }}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="inviteFullName">Client full name</Label>
              <Input
                id="inviteFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Client email</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@email.com"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <Mail className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send invite'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Eyebrow } from '@/components/prepd/Eyebrow';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !data.user) {
      setError(authError?.message ?? 'Login failed. Check your credentials.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'lawyer') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/prepare', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-emerald flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-emerald/5 px-6 py-5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <span className="font-serif text-2xl italic tracking-tight">Prepd</span>
          <Eyebrow>Counsel &amp; Client Portal</Eyebrow>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left — form */}
        <section className="px-8 lg:px-20 py-20 flex flex-col justify-center border-r border-emerald/5">
          <Eyebrow className="mb-6 block">Sign in</Eyebrow>
          <h1 className="font-serif text-5xl lg:text-7xl leading-[0.95] italic mb-6 text-balance">
            Practice the testimony that decides your case.
          </h1>
          <p className="text-emerald/70 max-w-md leading-relaxed mb-12 text-sm">
            Enter your credentials to access your workspace. The platform adapts to your role —
            lawyer or client.
          </p>

          {error && (
            <div className="mb-6 max-w-md px-4 py-3 border border-[#f3c5c5] bg-[#fde9e9] text-[#8a1a1a] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 max-w-md">
            <label className="block">
              <Eyebrow className="block mb-2">Email</Eyebrow>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com"
                required
                autoComplete="email"
                className="w-full bg-cream border border-emerald/15 px-4 py-3 font-sans text-emerald placeholder:text-emerald/30 focus:outline-none focus:border-emerald/40 rounded-sm"
              />
            </label>
            <label className="block">
              <Eyebrow className="block mb-2">Password</Eyebrow>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-cream border border-emerald/15 px-4 py-3 font-sans text-emerald placeholder:text-emerald/30 focus:outline-none focus:border-emerald/40 rounded-sm"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald text-cream text-sm font-semibold uppercase tracking-[0.18em] hover:bg-emerald-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 max-w-md text-xs text-emerald/45 leading-relaxed">
            Don't have an account? Your lawyer will send you an invite link.
          </p>
        </section>

        {/* Right — emerald sidebar */}
        <aside className="hidden lg:flex flex-col justify-between p-20 bg-emerald text-cream">
          <Eyebrow tone="gold">On Preparation</Eyebrow>
          <div>
            <p className="font-serif text-3xl italic leading-snug text-balance">
              "The right answer, delivered the right way, is the difference between a settlement
              offered and a settlement won."
            </p>
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-cream/50">
              — Prepd Coaching Manual
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cream/40">
            <span>Confidential</span>
            <span>End-to-end encrypted</span>
          </div>
        </aside>
      </main>
    </div>
  );
}

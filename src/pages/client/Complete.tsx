import { Link } from 'react-router-dom';
import { Eyebrow } from '@/components/prepd/Eyebrow';

export default function Complete() {
  return (
    <div className="min-h-screen bg-background text-emerald flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-emerald/5 px-6 py-5">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <span className="font-serif text-2xl italic tracking-tight">Prepd</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-fade-up">
        <div className="max-w-xl py-20 space-y-0">
          <Eyebrow tone="gold" className="block mb-6">
            Session Complete
          </Eyebrow>
          <h1 className="font-serif text-5xl italic mb-6 leading-tight">
            That's it. Well done.
          </h1>
          <p className="text-emerald/70 leading-relaxed mb-10 max-w-sm mx-auto">
            Your responses have been saved. Your lawyer will review them and reach out about
            what to practice next. There's nothing more to do right now — go take a breath.
          </p>
          <Link
            to="/prepare"
            className="inline-block px-8 py-4 bg-emerald text-cream text-sm font-medium uppercase tracking-[0.18em] hover:bg-emerald-soft transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

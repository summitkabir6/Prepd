import { type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, signOut } from '@/hooks/useAuth';
import { PrepdFooter } from '@/components/prepd/Footer';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
  maxWidth?: 'default' | 'narrow';
}

const LAWYER_NAV = [
  { to: '/dashboard', label: 'Cases' },
] as const;

export function Layout({ children, showNav = true, maxWidth = 'default' }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isLawyer = user?.role === 'lawyer';
  const widthClass = maxWidth === 'narrow' ? 'max-w-5xl' : 'max-w-7xl';

  return (
    <div className="min-h-screen bg-background text-emerald flex flex-col">
      {showNav && (
        <nav className="sticky top-0 z-40 w-full bg-[#f5f0e0]/85 backdrop-blur-md border-b border-emerald/5">
          <div className={`mx-auto ${widthClass} px-6 py-4 flex items-center justify-between`}>
            {/* Logo */}
            <Link
              to={isLawyer ? '/dashboard' : '/prepare'}
              className="font-serif text-2xl italic tracking-tight text-emerald"
            >
              Prepd
            </Link>

            {/* Lawyer nav links */}
            {isLawyer && (
              <div className="hidden md:flex gap-8 text-[11px] font-medium uppercase tracking-[0.18em]">
                {LAWYER_NAV.map((n) => {
                  const active =
                    location.pathname === n.to ||
                    (n.to === '/dashboard' && location.pathname.startsWith('/cases'));
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={
                        active
                          ? 'text-emerald border-b border-emerald pb-0.5'
                          : 'text-emerald/40 hover:text-emerald transition-colors'
                      }
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Client portal label */}
              {!isLawyer && (
                <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-emerald/40">
                  Client Portal
                </span>
              )}
              {/* New case CTA for lawyer */}
              {isLawyer && (
                <Link
                  to="/cases/new"
                  className="hidden sm:inline-flex px-4 py-2 bg-emerald text-cream text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-emerald-soft transition-colors"
                >
                  + New Case
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="text-[10px] uppercase tracking-[0.2em] text-emerald/50 hover:text-emerald transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className={`flex-1 px-6 py-12 mx-auto w-full ${widthClass}`}>
        {children}
      </main>

      <PrepdFooter />
    </div>
  );
}

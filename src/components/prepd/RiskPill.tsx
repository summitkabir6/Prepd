import { cn } from '@/lib/utils';

interface RiskPillProps {
  risk: 'High' | 'Medium' | 'Low';
}

export function RiskPill({ risk }: RiskPillProps) {
  const styles =
    risk === 'High'
      ? 'bg-[#fde9e9] text-[#8a1a1a] border-[#f3c5c5]'
      : risk === 'Medium'
      ? 'bg-gold/10 text-gold border-gold/30'
      : 'bg-emerald/5 text-emerald/70 border-emerald/15';
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border rounded-full whitespace-nowrap',
        styles,
      )}
    >
      {risk} Risk
    </span>
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div';
  tone?: 'muted' | 'gold' | 'emerald';
}

export function Eyebrow({ children, className, as: Tag = 'span', tone = 'muted' }: EyebrowProps) {
  const toneClass =
    tone === 'gold'
      ? 'text-gold'
      : tone === 'emerald'
      ? 'text-emerald'
      : 'text-emerald/45';
  return (
    <Tag
      className={cn(
        'text-[10px] font-bold uppercase tracking-[0.2em] leading-none',
        toneClass,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

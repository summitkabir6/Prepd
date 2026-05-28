import type { ReactNode } from 'react';
import { Eyebrow } from './Eyebrow';

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ eyebrow, title, description, children }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-emerald/15 px-10 py-16 text-center">
      {eyebrow && <Eyebrow className="mb-4 block">{eyebrow}</Eyebrow>}
      <h3 className="font-serif text-2xl italic">{title}</h3>
      {description && (
        <p className="mx-auto mt-3 max-w-md text-sm text-emerald/60">{description}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

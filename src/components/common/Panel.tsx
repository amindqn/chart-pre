import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Panel = ({ title, actions, children, className }: PanelProps) => (
  <section
    className={[
      'glass-panel rounded-2xl shadow-xl border border-slate-200/60 p-6 space-y-4',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {(title || actions) && (
      <header className="flex items-center justify-between gap-4">
        {title && (
          <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="space-y-4">{children}</div>
  </section>
);

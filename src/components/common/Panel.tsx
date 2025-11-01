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
      'glass-panel rounded-2xl shadow-xl border border-slate-200/60 p-4 space-y-4 transition-colors duration-300 sm:p-6',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {(title || actions) && (
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {title && (
          <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
        )}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        )}
      </header>
    )}
    <div className="space-y-4">{children}</div>
  </section>
);

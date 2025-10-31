import type { PlotStats } from '../../types/plot';
import { formatEquationForDisplay } from '../../utils/formatEquation';
import { Panel } from '../common/Panel';

interface FunctionSummaryProps {
  stats: PlotStats;
  expressions: Array<{ id: string; expression: string }>;
}

export const FunctionSummary = ({
  stats,
  expressions,
}: FunctionSummaryProps) => {
  if (stats.mode !== 'function') {
    return null;
  }

  const expressionMap = new Map(
    expressions.map((entry) => [entry.id, entry.expression])
  );

  return (
    <Panel title="Function details">
      <div className="space-y-3 text-sm text-slate-600">
        {stats.domain && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <span className="font-medium text-slate-700">X domain:</span>{' '}
              [{stats.domain.minX}, {stats.domain.maxX}]
            </div>
            <div>
              <span className="font-medium text-slate-700">
                Effective step:
              </span>{' '}
              {stats.domain.step}
            </div>
            <div>
              <span className="font-medium text-slate-700">Sample count:</span>{' '}
              {stats.sampleCount}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {stats.series.map((fn) => {
            const expression = expressionMap.get(fn.id) ?? '';
            return (
              <div
                key={fn.id}
                className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2"
              >
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-800">
                    {fn.label}(x)
                  </span>{' '}
                  ={' '}
                  <span className="math-display text-base">
                    {formatEquationForDisplay(expression)}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span>Valid samples: {fn.validPoints}</span>
                  <span>
                    Min f(x): {fn.minY ?? 'N/A'} | Max f(x): {fn.maxY ?? 'N/A'}
                  </span>
                  <span>Visible: {fn.visible ? 'yes' : 'no'}</span>
                </div>
              </div>
            );
        })}
      </div>
      </div>
    </Panel>
  );
};

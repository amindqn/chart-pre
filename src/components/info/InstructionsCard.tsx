import type { PlotMode } from '../../types/plot';
import { Panel } from '../common/Panel';

interface InstructionsCardProps {
  mode: PlotMode;
}

const FUNCTION_NOTES = [
  'Use the variable x to define expressions.',
  'Supported helpers: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, ln, log, sqrt, abs, min, max, pow.',
  'Use the ^ operator or pow(x, y) for exponentiation, e.g. x^2 or pow(x, 2).',
  'log(x) calculates base 10; provide log(x, base) to specify a different base.',
  'Constants pi and e are available.',
];

const DATA_NOTES = [
  'Upload CSV or Excel files with numeric columns for x and y.',
  'Only the first sheet and first two columns are parsed automatically.',
  'You can edit points inline or add new rows from the “Add point” button.',
  'Keep at least two valid points visible to render a curve.',
];

export const InstructionsCard = ({ mode }: InstructionsCardProps) => {
  const notes = mode === 'function' ? FUNCTION_NOTES : DATA_NOTES;

  return (
    <Panel title="Tips">
      <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </Panel>
  );
};

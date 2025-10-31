import { Panel } from '../common/Panel';

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

export const InstructionsCard = () => (
  <Panel title="Tips">
    <div className="space-y-3 text-sm text-slate-600">
      <div>
        <p className="mb-1 font-semibold text-slate-700">Functions</p>
        <ul className="list-inside list-disc space-y-1">
          {FUNCTION_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 font-semibold text-slate-700">Datasets</p>
        <ul className="list-inside list-disc space-y-1">
          {DATA_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  </Panel>
);

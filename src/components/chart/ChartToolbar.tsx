interface ChartToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onReset: () => void;
  onDownloadCsv: () => void;
}

const buttonStyles =
  'inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600';

export const ChartToolbar = ({
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onReset,
  onDownloadCsv,
}: ChartToolbarProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <button type="button" className={buttonStyles} onClick={onZoomIn}>
      Zoom in
    </button>
    <button type="button" className={buttonStyles} onClick={onZoomOut}>
      Zoom out
    </button>
    <button type="button" className={buttonStyles} onClick={onPanLeft}>
      Pan left
    </button>
    <button type="button" className={buttonStyles} onClick={onPanRight}>
      Pan right
    </button>
    <button type="button" className={buttonStyles} onClick={onReset}>
      Reset view
    </button>
    <button type="button" className={buttonStyles} onClick={onDownloadCsv}>
      Export CSV
    </button>
  </div>
);

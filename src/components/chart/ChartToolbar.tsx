interface ChartToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomYIn: () => void;
  onZoomYOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  onReset: () => void;
  onDownloadCsv: () => void;
}

const buttonStyles =
  'flex w-full items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600 sm:w-auto';

export const ChartToolbar = ({
  onZoomIn,
  onZoomOut,
  onZoomYIn,
  onZoomYOut,
  onPanLeft,
  onPanRight,
  onPanUp,
  onPanDown,
  onReset,
  onDownloadCsv,
}: ChartToolbarProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <button type="button" className={buttonStyles} onClick={onZoomIn}>
      Zoom in (X)
    </button>
    <button type="button" className={buttonStyles} onClick={onZoomOut}>
      Zoom out (X)
    </button>
    <button type="button" className={buttonStyles} onClick={onZoomYIn}>
      Zoom in (Y)
    </button>
    <button type="button" className={buttonStyles} onClick={onZoomYOut}>
      Zoom out (Y)
    </button>
    <button type="button" className={buttonStyles} onClick={onPanLeft}>
      Pan left
    </button>
    <button type="button" className={buttonStyles} onClick={onPanRight}>
      Pan right
    </button>
    <button type="button" className={buttonStyles} onClick={onPanUp}>
      Pan up
    </button>
    <button type="button" className={buttonStyles} onClick={onPanDown}>
      Pan down
    </button>
    <button type="button" className={buttonStyles} onClick={onReset}>
      Reset view
    </button>
    <button type="button" className={buttonStyles} onClick={onDownloadCsv}>
      Export CSV
    </button>
  </div>
);

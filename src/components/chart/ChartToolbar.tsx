import type { ThemeMode } from "../../hooks/useThemePreference";
import { JoystickSvg } from "./icons/JoystickSvg";

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
    theme: ThemeMode;
    className?: string;
}

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
    theme,
    className,
}: ChartToolbarProps) => {
    const isDark = theme === "dark";

    const directionalButtonClass = [
        "z-10 flex h-12 w-12 items-center justify-center rounded-xl text-[0.7rem] font-semibold uppercase tracking-wide transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark
            ? "bg-slate-900/90 text-slate-100 shadow-lg shadow-slate-900/60 hover:bg-blue-500 focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900"
            : "bg-white/95 text-slate-700 shadow-md shadow-slate-400/30 hover:bg-blue-500 hover:text-white focus-visible:ring-blue-500 focus-visible:ring-offset-white",
    ].join(" ");

    const zoomButtonClass = [
        "z-10 flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark
            ? "border-slate-700/70 bg-slate-900/80 text-slate-100 shadow-lg shadow-slate-900/40 hover:bg-blue-500 focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900"
            : "border-slate-300 bg-white/95 text-slate-600 shadow shadow-slate-400/20 hover:bg-blue-500 hover:text-white focus-visible:ring-blue-500 focus-visible:ring-offset-white",
    ].join(" ");

    const utilityButtonClass = [
        "flex min-w-[120px] items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark
            ? "border-slate-600 bg-slate-900/75 text-slate-100 shadow shadow-slate-900/40 hover:border-blue-400 hover:bg-blue-500/20 hover:text-blue-100 focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900"
            : "border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-200 hover:border-blue-400 hover:text-blue-600 focus-visible:ring-blue-500 focus-visible:ring-offset-white",
    ].join(" ");

    return (
        <div
            className={[
                "flex flex-col items-center gap-4 lg:gap-6",
                className ?? "",
            ]
                .join(" ")
                .trim()}
        >
            <div className="relative mx-auto h-48 w-48 max-w-full sm:h-52 sm:w-52">
                <div className="relative h-full w-full">
                    <JoystickSvg mode={theme} className="absolute inset-0 h-full w-full" />

                    <button
                        type="button"
                        aria-label="Pan up"
                        className={`${directionalButtonClass} absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2`}
                        onClick={onPanUp}
                    >
                        UP
                    </button>
                    <button
                        type="button"
                        aria-label="Pan down"
                        className={`${directionalButtonClass} absolute left-1/2 bottom-[34%] -translate-x-1/2 translate-y-1/2`}
                        onClick={onPanDown}
                    >
                        DN
                    </button>
                    <button
                        type="button"
                        aria-label="Pan left"
                        className={`${directionalButtonClass} absolute left-[34%] top-1/2 -translate-x-1/2 -translate-y-1/2`}
                        onClick={onPanLeft}
                    >
                        LT
                    </button>
                    <button
                        type="button"
                        aria-label="Pan right"
                        className={`${directionalButtonClass} absolute right-[34%] top-1/2 translate-x-1/2 -translate-y-1/2`}
                        onClick={onPanRight}
                    >
                        RT
                    </button>

                    <button
                        type="button"
                        aria-label="Zoom in X"
                        className={`${zoomButtonClass} absolute left-[10%] top-1/2 -translate-y-1/2`}
                        onClick={onZoomIn}
                    >
                        +X
                    </button>
                    <button
                        type="button"
                        aria-label="Zoom out X"
                        className={`${zoomButtonClass} absolute right-[10%] top-1/2 -translate-y-1/2`}
                        onClick={onZoomOut}
                    >
                        -X
                    </button>
                    <button
                        type="button"
                        aria-label="Zoom in Y"
                        className={`${zoomButtonClass} absolute left-1/2 top-[10%] -translate-x-1/2`}
                        onClick={onZoomYIn}
                    >
                        +Y
                    </button>
                    <button
                        type="button"
                        aria-label="Zoom out Y"
                        className={`${zoomButtonClass} absolute left-1/2 bottom-[10%] -translate-x-1/2`}
                        onClick={onZoomYOut}
                    >
                        -Y
                    </button>
                </div>
            </div>

            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
                <button type="button" className={`${utilityButtonClass} w-full sm:flex-1`} onClick={onReset}>
                    Reset View
                </button>
                <button type="button" className={`${utilityButtonClass} w-full sm:flex-1`} onClick={onDownloadCsv}>
                    Export CSV
                </button>
            </div>
        </div>
    );
};

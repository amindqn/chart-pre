import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WheelEvent as ReactWheelEvent } from "react";
import type { ChartData, ChartDataset, ChartOptions as ChartJsOptions, Plugin } from "chart.js";
import { Line } from "react-chartjs-2";

import type { ChartDisplayOptions } from "../../types/plot";
import type { ThemeMode } from "../../hooks/useThemePreference";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { Panel } from "../common/Panel";
import { ChartToolbar } from "./ChartToolbar";

const parseLabel = (value: number | string): number | null => {
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
};

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const EPSILON = 1e-6;

const INTERSECTION_DATASET_ID = "intersection-overlay";
const INTERSECTION_POINT_RADIUS = 5;
// const INTERSECTION_POINT_COLOR = "#f97316";
// const INTERSECTION_POINT_BORDER_COLOR = "#c2410c";

interface IntersectionPoint {
    x: number;
    y: number;
    seriesNames: [string, string];
    datasetIndices: [number, number];
}

const computeIntersections = (chartData: ChartData<"line">): IntersectionPoint[] => {
    const labels = (chartData.labels ?? []) as Array<number | string>;
    if (!labels.length) {
        return [];
    }

    const numericLabels = labels.map((label) => parseLabel(label));
    const intersections = new Map<string, IntersectionPoint>();

    for (let i = 0; i < chartData.datasets.length; i += 1) {
        const datasetA = chartData.datasets[i];
        if (datasetA.hidden || !Array.isArray(datasetA.data)) {
            continue;
        }
        const dataA = datasetA.data as Array<number | null>;

        for (let j = i + 1; j < chartData.datasets.length; j += 1) {
            const datasetB = chartData.datasets[j];
            if (datasetB.hidden || !Array.isArray(datasetB.data)) {
                continue;
            }
            const dataB = datasetB.data as Array<number | null>;

            for (let index = 0; index < numericLabels.length - 1; index += 1) {
                const x0 = numericLabels[index];
                const x1 = numericLabels[index + 1];

                if (!isFiniteNumber(x0) || !isFiniteNumber(x1)) {
                    continue;
                }

                const y0A = dataA[index];
                const y0B = dataB[index];
                const y1A = dataA[index + 1];
                const y1B = dataB[index + 1];

                if (!isFiniteNumber(y0A) || !isFiniteNumber(y0B) || !isFiniteNumber(y1A) || !isFiniteNumber(y1B)) {
                    continue;
                }

                const diff0 = y0A - y0B;
                const diff1 = y1A - y1B;
                const labelA = datasetA.label ?? `Series ${i + 1}`;
                const labelB = datasetB.label ?? `Series ${j + 1}`;
                const baseKey = `${i}-${j}`;

                if (Math.abs(diff0) <= EPSILON) {
                    const key = `${x0.toFixed(6)}|${y0A.toFixed(6)}|${baseKey}`;
                    if (!intersections.has(key)) {
                        intersections.set(key, {
                            x: x0,
                            y: y0A,
                            seriesNames: [labelA, labelB],
                            datasetIndices: [i, j],
                        });
                    }
                }

                if (Math.abs(diff1) <= EPSILON) {
                    const key = `${x1.toFixed(6)}|${y1A.toFixed(6)}|${baseKey}`;
                    if (!intersections.has(key)) {
                        intersections.set(key, {
                            x: x1,
                            y: y1A,
                            seriesNames: [labelA, labelB],
                            datasetIndices: [i, j],
                        });
                    }
                }

                if ((diff0 < 0 && diff1 > 0) || (diff0 > 0 && diff1 < 0)) {
                    const denominator = diff0 - diff1;
                    if (!Number.isFinite(denominator) || Math.abs(denominator) < EPSILON) {
                        continue;
                    }
                    const t = diff0 / denominator;
                    if (!Number.isFinite(t) || t < 0 || t > 1) {
                        continue;
                    }
                    const x = x0 + t * (x1 - x0);
                    const y = y0A + t * (y1A - y0A);
                    if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
                        continue;
                    }
                    const key = `${x.toFixed(6)}|${y.toFixed(6)}|${baseKey}`;
                    if (!intersections.has(key)) {
                        intersections.set(key, {
                            x,
                            y,
                            seriesNames: [labelA, labelB],
                            datasetIndices: [i, j],
                        });
                    }
                }
            }
        }
    }

    return Array.from(intersections.values());
};

const formatCoordinate = (value: number, digits = 4) => (Number.isFinite(value) ? value.toFixed(digits) : `${value}`);

const getCoordinateString = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? formatCoordinate(value) : "");

interface ChartViewport {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

interface ChartDisplayProps {
    chartData: ChartData<"line">;
    options: ChartDisplayOptions;
    viewport: ChartViewport | null;
    theme: ThemeMode;
    onDownloadCsv: () => void;
    onZoomIn: (anchor?: number, factor?: number) => void;
    onZoomOut: (anchor?: number, factor?: number) => void;
    onZoomYIn: (anchor?: number, factor?: number) => void;
    onZoomYOut: (anchor?: number, factor?: number) => void;
    onPanLeft: () => void;
    onPanRight: () => void;
    onPanUp: () => void;
    onPanDown: () => void;
    onResetView: () => void;
    onPanByOffset: (delta: number) => void;
    onPanYByOffset: (delta: number) => void;
}

export const ChartDisplay = ({
    chartData,
    options,
    viewport,
    theme,
    onDownloadCsv,
    onZoomIn,
    onZoomOut,
    onZoomYIn,
    onZoomYOut,
    onPanLeft,
    onPanRight,
    onPanUp,
    onPanDown,
    onResetView,
    onPanByOffset,
    onPanYByOffset,
}: ChartDisplayProps) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    const intersectionPoints = useMemo(() => computeIntersections(chartData), [chartData]);

    const palette = useMemo(
        () =>
            theme === "dark"
                ? {
                      textPrimary: "#e2e8f0",
                      textSecondary: "#cbd5f5",
                      grid: "rgba(148, 163, 184, 0.35)",
                      gridMinor: "rgba(148, 163, 184, 0.14)",
                      tooltipBg: "#0f172a",
                      tooltipBorder: "#1e293b",
                      tooltipText: "#e2e8f0",
                      tooltipSubtle: "#cbd5f5",
                  }
                : {
                      textPrimary: "#0f172a",
                      textSecondary: "#475569",
                      grid: "rgba(148, 163, 184, 0.35)",
                      gridMinor: "rgba(226, 232, 240, 0.6)",
                      tooltipBg: "#ffffff",
                      tooltipBorder: "#cbd5f1",
                      tooltipText: "#0f172a",
                      tooltipSubtle: "#475569",
                  },
        [theme]
    );

    const renderedChartData = useMemo<ChartData<"line">>(() => {
        const labels = (chartData.labels ?? []) as Array<number | string>;
        const numericLabels = labels.map((label) => parseLabel(label));

        const lineDatasets = chartData.datasets.map((dataset) => {
            if (!Array.isArray(dataset.data)) {
                return dataset;
            }

            const points = numericLabels.reduce<Array<{ x: number; y: number }>>((accumulator, label, index) => {
                if (label === null) {
                    return accumulator;
                }

                const value = dataset.data[index];
                if (typeof value === "number" && Number.isFinite(value)) {
                    accumulator.push({ x: label, y: value });
                }

                return accumulator;
            }, []);

            return {
                ...dataset,
                parsing: {
                    xAxisKey: "x",
                    yAxisKey: "y",
                },
                data: points,
            };
        });

        const datasetsWithIntersections: ChartDataset<"line">[] = [...lineDatasets];

        if (intersectionPoints.length > 0) {
            const intersectionDataset = {
                id: INTERSECTION_DATASET_ID,
                type: "scatter" as const,
                label: "Intersections",
                data: intersectionPoints.map((point) => ({
                    x: point.x,
                    y: point.y,
                    seriesNames: point.seriesNames,
                })),
                pointBackgroundColor: theme == "dark" ? "#eebda0" : "#e65501",
                pointBorderColor: theme == "dark" ? "#ffe5cc" : "#a65504",
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBorderWidth: 8,
                pointHoverBorderWidth: 10,
                pointHitRadius: INTERSECTION_POINT_RADIUS + 4,
                showLine: false,
                order: Number.MAX_SAFE_INTEGER,
                parsing: {
                    xAxisKey: "x",
                    yAxisKey: "y",
                },
                clip: false,
                _isIntersectionDataset: true,
            };

            datasetsWithIntersections.push(intersectionDataset as unknown as ChartDataset<"line">);
        }

        return {
            ...chartData,
            datasets: datasetsWithIntersections,
        };
    }, [chartData, intersectionPoints,theme]);

    const chartOptions = useMemo<ChartJsOptions<"line">>(
        () => ({
            responsive: true,
            maintainAspectRatio: isMobile ? false : options.maintainAspectRatio,
            animation: false,
            interaction: {
                intersect: false,
                mode: "nearest",
            },
            plugins: {
                legend: {
                    display: options.showLegend,
                    position: "top",
                    labels: {
                        color: palette.textSecondary,
                        usePointStyle: true,
                    },
                },
                title: {
                    display: Boolean(options.chartTitle),
                    text: options.chartTitle,
                    color: palette.textPrimary,
                },
                tooltip: {
                    backgroundColor: palette.tooltipBg,
                    borderColor: palette.tooltipBorder,
                    borderWidth: 1,
                    titleColor: palette.tooltipText,
                    bodyColor: palette.tooltipSubtle,
                    footerColor: palette.tooltipSubtle,
                    callbacks: {
                        title: (context) => {
                            const parsedX = context[0]?.parsed?.x;
                            return typeof parsedX === "number" ? `x = ${formatCoordinate(parsedX)}` : "";
                        },
                        label: (context) => {
                            const datasetType = (context.dataset as { type?: string }).type;
                            if (datasetType === "scatter") {
                                const raw = context.raw as {
                                    x?: number;
                                    y?: number;
                                    seriesNames?: [string, string];
                                };
                                const seriesLabel = Array.isArray(raw?.seriesNames)
                                    ? raw.seriesNames.join(" ∩ ")
                                    : context.dataset.label ?? "Intersection";
                                const xValue = getCoordinateString(context.parsed?.x) || getCoordinateString(raw?.x);
                                const yValue = getCoordinateString(context.parsed?.y) || getCoordinateString(raw?.y);
                                return `${seriesLabel}: (${xValue}, ${yValue})`;
                            }
                            const datasetLabel = context.dataset.label ?? "";
                            const value = typeof context.parsed?.y === "number" ? formatCoordinate(context.parsed.y) : context.formattedValue;
                            return datasetLabel ? `${datasetLabel}: ${value}` : `${value}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    type: "linear",
                    title: {
                        display: true,
                        text: "x",
                        color: palette.textPrimary,
                    },
                    min: viewport?.xMin,
                    max: viewport?.xMax,
                    grid: {
                        display: options.showGrid,
                        color: options.showGrid ? palette.gridMinor : undefined,
                    },
                    ticks: {
                        color: palette.textSecondary,
                    },
                    border: {
                        color: palette.grid,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "f(x)",
                        color: palette.textPrimary,
                    },
                    min: viewport?.yMin,
                    max: viewport?.yMax,
                    grid: {
                        display: options.showGrid,
                        color: options.showGrid ? palette.gridMinor : undefined,
                    },
                    ticks: {
                        color: palette.textSecondary,
                    },
                    border: {
                        color: palette.grid,
                    },
                },
            },
        }),
        [options, palette, viewport, isMobile]
    );

    const intersectionOverlayPlugin = useMemo<Plugin<"line"> | null>(() => {
        if (!intersectionPoints.length) {
            return null;
        }

        return {
            id: "intersectionOverlay",
            afterDatasetsDraw: (chart) => {
                const datasetIndex = chart.data.datasets.findIndex((dataset) => {
                    const candidate = dataset as unknown as Record<string, unknown>;
                    if (!candidate) {
                        return false;
                    }
                    if (candidate["id"] === INTERSECTION_DATASET_ID) {
                        return true;
                    }
                    return candidate["_isIntersectionDataset"] === true;
                });

                if (datasetIndex === -1) {
                    return;
                }

                const meta = chart.getDatasetMeta(datasetIndex);
                if (!meta || meta.hidden || !chart.isDatasetVisible(datasetIndex)) {
                    return;
                }

                const elements = meta.data ?? [];
                if (!elements.length) {
                    return;
                }

                const activeElements = typeof chart.tooltip?.getActiveElements === "function" ? chart.tooltip.getActiveElements() : [];
                const activeIndices = new Set(activeElements.filter((item) => item.datasetIndex === datasetIndex).map((item) => item.index));

                const ctx = chart.ctx;
                ctx.save();
                // ctx.fillStyle = INTERSECTION_POINT_COLOR;
                // ctx.strokeStyle = INTERSECTION_POINT_BORDER_COLOR;
                ctx.lineWidth = 2;

                elements.forEach((element, index) => {
                    const point = element as unknown as {
                        x?: number;
                        y?: number;
                        skip?: boolean;
                    };

                    if (point.skip) {
                        return;
                    }

                    const x = point.x;
                    const y = point.y;

                    if (typeof x !== "number" || typeof y !== "number") {
                        return;
                    }

                    const radius = activeIndices.has(index) ? INTERSECTION_POINT_RADIUS + 2 : INTERSECTION_POINT_RADIUS;

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });

                ctx.restore();
            },
        };
    }, [intersectionPoints]);

    const chartPlugins = useMemo<Plugin<"line">[]>(() => (intersectionOverlayPlugin ? [intersectionOverlayPlugin] : []), [intersectionOverlayPlugin]);

    const lineChart = (
        <Line
            options={chartOptions}
            data={renderedChartData}
            plugins={chartPlugins}
            className={isMobile ? "h-full w-full origin-center rotate-90" : "h-full w-full"}
            style={{ width: "100%", height: "100%" }}
        />
    );

    const hasData = (chartData.labels ?? []).length > 0;
    const dragStateRef = useRef<{
        pointerId: number;
        lastClientX: number;
        lastClientY: number;
        isActive: boolean;
        mode: "x" | "y";
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const overflowRestoreRef = useRef<string | null>(null);

    const lockBodyScroll = useCallback(() => {
        if (typeof document === "undefined") {
            return;
        }
        if (overflowRestoreRef.current !== null) {
            return;
        }
        overflowRestoreRef.current = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }, []);

    const unlockBodyScroll = useCallback(() => {
        if (typeof document === "undefined") {
            return;
        }
        if (overflowRestoreRef.current === null) {
            return;
        }
        document.body.style.overflow = overflowRestoreRef.current;
        overflowRestoreRef.current = null;
    }, []);

    useEffect(
        () => () => {
            unlockBodyScroll();
        },
        [unlockBodyScroll]
    );

    useEffect(() => {
        if (!hasData || !viewport) {
            unlockBodyScroll();
        }
    }, [hasData, viewport, unlockBodyScroll]);

    const handleWheel = useCallback(
        (event: ReactWheelEvent<HTMLDivElement>) => {
            if (!hasData || !viewport) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.preventDefault();

            const rect = event.currentTarget.getBoundingClientRect();
            const modifierPressed = event.shiftKey || event.altKey || event.metaKey || event.ctrlKey;
            const isMostlyHorizontalScroll = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 0;
            const isVerticalZoom = modifierPressed || isMostlyHorizontalScroll;
            const horizontalDimension = isMobile ? rect.height : rect.width;
            const verticalDimension = rect.height;
            const strength = 1 + Math.min(Math.abs(event.deltaY) / 500, 0.7);

            if (isVerticalZoom) {
                if (verticalDimension <= 0) {
                    return;
                }
                const verticalOffset = event.clientY - rect.top;
                const ratio = Math.min(Math.max(verticalOffset / verticalDimension, 0), 1);
                const anchor = viewport.yMax - ratio * (viewport.yMax - viewport.yMin);
                if (event.deltaY < 0) {
                    onZoomYIn(anchor, 1 / strength);
                } else if (event.deltaY > 0) {
                    onZoomYOut(anchor, strength);
                }
                return;
            }

            if (horizontalDimension <= 0) {
                return;
            }

            const horizontalOffset = isMobile ? event.clientY - rect.top : event.clientX - rect.left;
            const ratio = Math.min(Math.max(horizontalOffset / horizontalDimension, 0), 1);
            const anchor = viewport.xMin + ratio * (viewport.xMax - viewport.xMin);
            if (event.deltaY < 0) {
                onZoomIn(anchor, 1 / strength);
            } else if (event.deltaY > 0) {
                onZoomOut(anchor, strength);
            }
        },
        [hasData, viewport, onZoomIn, onZoomOut, onZoomYIn, onZoomYOut, isMobile]
    );

    const handlePointerEnter = useCallback(() => {
        if (!hasData || !viewport) {
            return;
        }
        lockBodyScroll();
    }, [hasData, viewport, lockBodyScroll]);

    const handleMouseEnter = useCallback(() => {
        if (!hasData || !viewport) {
            return;
        }
        lockBodyScroll();
    }, [hasData, viewport, lockBodyScroll]);

    const handleMouseLeave = useCallback(() => {
        unlockBodyScroll();
    }, [unlockBodyScroll]);

    const resolveDragMode = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" && ((event.buttons & 2) !== 0 || event.button === 2)) {
            return "y";
        }
        return event.shiftKey || event.altKey || event.metaKey || event.ctrlKey ? "y" : "x";
    }, []);

    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!hasData || !viewport) {
                return;
            }
            if (event.pointerType === "mouse") {
                if (event.button === 2) {
                    event.preventDefault();
                } else if (event.button !== 0) {
                    return;
                }
            }

            dragStateRef.current = {
                pointerId: event.pointerId,
                lastClientX: event.clientX,
                lastClientY: event.clientY,
                isActive: false,
                mode: resolveDragMode(event),
            };
        },
        [hasData, viewport, resolveDragMode]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const dragState = dragStateRef.current;
            if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
            }
            if (!viewport) {
                return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const desiredMode = resolveDragMode(event);
            if (dragState.mode !== desiredMode) {
                dragState.mode = desiredMode;
                dragState.lastClientX = event.clientX;
                dragState.lastClientY = event.clientY;
                return;
            }

            const isHorizontalMode = dragState.mode === "x";
            const dimension = isHorizontalMode
                ? isMobile
                    ? rect.height
                    : rect.width
                : rect.height;
            if (dimension <= 0) {
                return;
            }

            const deltaPrimary = isHorizontalMode
                ? isMobile
                    ? event.clientY - dragState.lastClientY
                    : event.clientX - dragState.lastClientX
                : event.clientY - dragState.lastClientY;
            const hasSignificantMovement = Math.abs(deltaPrimary) >= 1;

            if (!dragState.isActive) {
                if (!hasSignificantMovement) {
                    return;
                }
                dragState.isActive = true;
                setIsDragging(true);
                if (event.currentTarget.setPointerCapture) {
                    event.currentTarget.setPointerCapture(event.pointerId);
                }
            }

            event.preventDefault();
            event.stopPropagation();

            dragState.lastClientX = event.clientX;
            dragState.lastClientY = event.clientY;

            const range = isHorizontalMode ? viewport.xMax - viewport.xMin : viewport.yMax - viewport.yMin;
            if (range <= 0) {
                return;
            }

            const ratio = deltaPrimary / dimension;
            const delta = -ratio * range;
            if (isHorizontalMode) {
                onPanByOffset(delta);
            } else {
                onPanYByOffset(delta);
            }
        },
        [viewport, onPanByOffset, onPanYByOffset, isMobile, resolveDragMode]
    );

    const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
            return false;
        }

        const wasActive = dragState.isActive;
        dragStateRef.current = null;
        if (wasActive) {
            setIsDragging(false);
        }

        if (
            event.currentTarget.releasePointerCapture &&
            event.currentTarget.hasPointerCapture &&
            event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return wasActive;
    }, []);

    const handlePointerUp = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragStateRef.current) {
                return;
            }
            const wasActive = endDrag(event);
            if (wasActive) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        [endDrag]
    );

    const handlePointerLeave = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const wasActive = endDrag(event);
            if (wasActive) {
                event.preventDefault();
                event.stopPropagation();
            }
            unlockBodyScroll();
        },
        [endDrag, unlockBodyScroll]
    );

    const surfaceBackground =
        theme === "dark"
            ? "bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-800/80"
            : "bg-gradient-to-br from-slate-900/5 via-white to-blue-100";

    const cursorClass = hasData && viewport ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default";

    const containerClasses = [
        "relative w-full overflow-hidden rounded-2xl transition-colors duration-300",
        surfaceBackground,
        cursorClass,
        isMobile
            ? "aspect-square min-h-[260px] p-2 touch-pan-y flex items-center justify-center"
            : "h-[60vh] min-h-[320px] p-3 touch-none sm:h-[60vh] sm:min-h-[320px] sm:p-4 md:h-[68vh] md:min-h-[380px] lg:h-[70vh] lg:min-h-[420px]",
    ].join(" ");

    const emptyStateClasses =
        theme === "dark"
            ? "flex h-full items-center justify-center rounded-xl border border-dashed border-slate-500/60 bg-slate-900/60"
            : "flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70";

    const emptyStateTextClass = theme === "dark" ? "text-sm font-medium text-slate-200" : "text-sm font-medium text-slate-500";

    return (
        <Panel
            title="Chart"
            className="space-y-4 sm:space-y-5"
        >
            <ChartToolbar
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onZoomYIn={onZoomYIn}
                onZoomYOut={onZoomYOut}
                onPanLeft={onPanLeft}
                onPanRight={onPanRight}
                onPanUp={onPanUp}
                onPanDown={onPanDown}
                onReset={onResetView}
                onDownloadCsv={onDownloadCsv}
            />
            <div
                className={containerClasses}
                onWheelCapture={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerLeave}
                onPointerLeave={handlePointerLeave}
                onPointerEnter={handlePointerEnter}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(event) => event.preventDefault()}
            >
                {hasData ? (isMobile ? <div className="h-full w-full">{lineChart}</div> : lineChart) : (
                    <div className={emptyStateClasses}>
                        <p className={emptyStateTextClass}>Configure a function or import data to see the graph.</p>
                    </div>
                )}
            </div>
        </Panel>
    );
};

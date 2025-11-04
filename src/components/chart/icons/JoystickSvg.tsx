import { useId } from "react";
import type { SVGProps } from "react";
import type { ThemeMode } from "../../../hooks/useThemePreference";

interface JoystickSvgProps extends SVGProps<SVGSVGElement> {
    mode?: ThemeMode;
}

export const JoystickSvg = ({ className, mode = "dark", ...props }: JoystickSvgProps) => {
    const gradientId = useId();
    const outerId = `${gradientId}-outer`;
    const crossId = `${gradientId}-cross`;
    const centerId = `${gradientId}-center`;

    const palette =
        mode === "dark"
            ? {
                  outerStart: "#475569",
                  outerMid: "#1e293b",
                  outerEnd: "#0f172a",
                  crossTop: "#94a3b8",
                  crossMid: "#e2e8f0",
                  crossBottom: "#94a3b8",
                  centerStart: "#1f2937",
                  centerEnd: "#0f172a",
                  ringStroke: "rgba(148,163,184,0.35)",
                  innerRingFill: "rgba(15,23,42,0.45)",
                  midFill: "rgba(226,232,240,0.15)",
                  midStroke: "rgba(226,232,240,0.25)",
                  indicatorFill: "rgba(226,232,240,0.2)",
                  indicatorStroke: "rgba(148,163,184,0.35)",
              }
            : {
                  outerStart: "#f8fafc",
                  outerMid: "#e2e8f0",
                  outerEnd: "#cbd5f5",
                  crossTop: "#94a3b8",
                  crossMid: "#f8fafc",
                  crossBottom: "#94a3b8",
                  centerStart: "#e0f2fe",
                  centerEnd: "#93c5fd",
                  ringStroke: "rgba(148,163,184,0.28)",
                  innerRingFill: "rgba(148,163,184,0.12)",
                  midFill: "rgba(148,163,184,0.18)",
                  midStroke: "rgba(148,163,184,0.28)",
                  indicatorFill: "rgba(96,165,250,0.18)",
                  indicatorStroke: "rgba(59,130,246,0.4)",
              };

    return (
        <svg
            viewBox="0 0 200 200"
            role="img"
            aria-hidden="true"
            focusable="false"
            className={className}
            {...props}
        >
            <defs>
                <radialGradient id={outerId} cx="50%" cy="35%" r="75%">
                    <stop offset="0%" stopColor={palette.outerStart} />
                    <stop offset="70%" stopColor={palette.outerMid} />
                    <stop offset="100%" stopColor={palette.outerEnd} />
                </radialGradient>
                <linearGradient id={crossId} x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor={palette.crossTop} />
                    <stop offset="50%" stopColor={palette.crossMid} />
                    <stop offset="100%" stopColor={palette.crossBottom} />
                </linearGradient>
                <radialGradient id={centerId} cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor={palette.centerStart} />
                    <stop offset="100%" stopColor={palette.centerEnd} />
                </radialGradient>
            </defs>

            <circle cx="100" cy="100" r="98" fill={`url(#${outerId})`} />
            <circle cx="100" cy="100" r="92" fill={palette.innerRingFill} />
            <circle cx="100" cy="100" r="82" fill={`url(#${centerId})`} stroke={palette.ringStroke} strokeWidth="4" />

            <path
                d="M120 48h-40a12 12 0 0 0-12 12v28H40a12 12 0 0 0-12 12v16a12 12 0 0 0 12 12h28v28a12 12 0 0 0 12 12h40a12 12 0 0 0 12-12v-28h28a12 12 0 0 0 12-12v-16a12 12 0 0 0-12-12h-28V60a12 12 0 0 0-12-12Z"
                fill={`url(#${crossId})`}
                fillOpacity="0.85"
            />

            <circle cx="100" cy="100" r="26" fill={palette.midFill} stroke={palette.midStroke} strokeWidth="2" />

            <circle cx="100" cy="58" r="10" fill={palette.indicatorFill} stroke={palette.indicatorStroke} strokeWidth="3" />
            <circle cx="100" cy="142" r="10" fill={palette.indicatorFill} stroke={palette.indicatorStroke} strokeWidth="3" />
            <circle cx="58" cy="100" r="10" fill={palette.indicatorFill} stroke={palette.indicatorStroke} strokeWidth="3" />
            <circle cx="142" cy="100" r="10" fill={palette.indicatorFill} stroke={palette.indicatorStroke} strokeWidth="3" />
        </svg>
    );
};

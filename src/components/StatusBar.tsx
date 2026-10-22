import { useEffect, useRef, useState } from "react";
import "./StatusBar.css";
import { isSingular, translateBackendMessage, useTranslation } from "../i18n";

interface Props {
  activePresetName: string | null;
  version: string;
  stopReason: string | null;
  warning: string | null;
  running: boolean;
  paused: boolean;
  clickCount: number;
  activeClickPointIndex: number | null;
  totalClickPoints: number;
  clickLimit: number;
  clickLimitEnabled: boolean;
  timeLimitMs: number;
  onGoToPresets: () => void;
  onGoToVersionInfo: () => void;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StatusBar({
  activePresetName,
  version,
  stopReason,
  warning,
  running,
  paused,
  clickCount,
  activeClickPointIndex,
  totalClickPoints,
  clickLimit,
  clickLimitEnabled,
  timeLimitMs,
  onGoToPresets,
  onGoToVersionInfo,
}: Props) {
  const { language, t } = useTranslation();
  const clicksText = (count: number) => {
    const vars = { count: count.toLocaleString(language) };
    return isSingular(language, count)
      ? t("{count} click", vars)
      : t("{count} clicks", vars);
  };
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseElapsedRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && !paused) {
      segmentStartRef.current = Date.now();
      const tick = () => {
        setElapsedMs(
          baseElapsedRef.current + (Date.now() - segmentStartRef.current!),
        );
      };
      tick();
      intervalRef.current = setInterval(tick, 200);
    } else if (running && paused) {
      if (segmentStartRef.current !== null) {
        baseElapsedRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      baseElapsedRef.current = 0;
      segmentStartRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, paused]);

  let centerText = "";
  let hasWarning = false;

  if (warning) {
    centerText = `⚠ ${translateBackendMessage(warning, t)}`;
    hasWarning = true;
  } else if (running) {
    const parts: string[] = [];

    if (paused) {
      parts.push(t("Paused"));
    }

    if (totalClickPoints > 1 && activeClickPointIndex !== null) {
      parts.push(
        t("Pt {current}/{total}", {
          current: activeClickPointIndex + 1,
          total: totalClickPoints,
        }),
      );
    }

    const elapsed = formatElapsed(elapsedMs);
    if (timeLimitMs > 0) {
      parts.push(`${elapsed} / ${formatElapsed(timeLimitMs)}`);
    } else {
      parts.push(elapsed);
    }

    if (clickLimitEnabled && clickLimit > 0) {
      parts.push(
        t("{count} / {limit} clicks", {
          count: clickCount.toLocaleString(language),
          limit: clickLimit.toLocaleString(language),
        }),
      );
    } else if (clickCount > 0) {
      parts.push(clicksText(clickCount));
    }

    if (paused && stopReason) {
      parts.push(translateBackendMessage(stopReason, t));
    }

    centerText = parts.join("\u00A0\u00A0•\u00A0\u00A0");
  } else if (stopReason) {
    const reason = translateBackendMessage(stopReason, t);
    centerText =
      clickCount > 0 ? `${reason} • ${clicksText(clickCount)}` : reason;
  }

  return (
    <div className="status-bar" data-running={running}>
      <div className="status-bar-left">
        {activePresetName ? (
          <button
            className="status-bar-preset-btn"
            onClick={onGoToPresets}
            title={t("Go to presets")}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
            {activePresetName}
          </button>
        ) : (
          <button
            className="status-bar-hint-btn"
            onClick={onGoToPresets}
            title={t("Go to presets")}
          >
            {t("No preset active")}
          </button>
        )}
      </div>
      <div
        className={`status-bar-center ${hasWarning ? "status-bar-center--warning" : ""} ${centerText ? "" : "status-bar-center--empty"}`}
      >
        {centerText}
      </div>
      <div className="status-bar-right">
        <button
          className="status-bar-version-btn"
          onClick={onGoToVersionInfo}
          title={t("Info")}
        >
          v{version}
        </button>
      </div>
    </div>
  );
}

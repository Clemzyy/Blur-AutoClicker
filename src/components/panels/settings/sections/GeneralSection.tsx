import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { type Translate, useTranslation } from "../../../../i18n";
import type { AppInfo } from "../../../../store";
import { changelogEntries } from "../../../../changelog";
import ChangelogContent from "../../../ChangelogContent";
import { SettingsCard } from "./shared";

interface CumulativeStats {
  totalClicks: number;
  totalTimeSecs: number;
  totalSessions: number;
  avgCpu: number;
}

function formatTime(
  totalSeconds: number,
  language: string,
  t: Translate,
): string {
  const n = (value: number) => value.toLocaleString(language);
  if (totalSeconds < 0.01) return t("{s}s", { s: n(0) });
  if (totalSeconds < 60) {
    return t("{s}s", { s: n(Math.floor(totalSeconds)) });
  }
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return s > 0
      ? t("{m}m {s}s", { m: n(m), s: n(s) })
      : t("{m}m", { m: n(m) });
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return m > 0 ? t("{h}h {m}m", { h: n(h), m: n(m) }) : t("{h}h", { h: n(h) });
}

function formatNumber(n: number, language: string): string {
  return Math.floor(n).toLocaleString(language);
}

function formatCpu(
  cpu: number,
  language: string,
  notAvailable: string,
): string {
  if (!Number.isFinite(cpu) || cpu < 0) return notAvailable;
  return `${cpu.toLocaleString(language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

interface Props {
  appInfo: AppInfo;
  updateCheckStatus:
    "idle" | "checking" | "available" | "unavailable" | "error";
  onCheckForUpdate: () => void;
}

export default function GeneralSection({
  appInfo,
  updateCheckStatus,
  onCheckForUpdate,
}: Props) {
  const { language, t } = useTranslation();
  const [stats, setStats] = useState<CumulativeStats | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    invoke<CumulativeStats>("get_stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  const hasStats = stats !== null && stats.totalSessions > 0;

  const updateButtonLabel = {
    idle: t("Check for Update"),
    checking: t("Checking..."),
    available: t("Update found!"),
    unavailable: t("No update found"),
    error: t("Check failed"),
  }[updateCheckStatus];

  return (
    <>
      <SettingsCard
        title={t("About")}
        description={t("Version and project links.")}
      >
        <div className="social-links">
          <span className="settings-label">{t("Support Me")}</span>
          <div className="social-icons">
            <a
              className="social-icon social-icon--kofi"
              href="#"
              title="Ko-fi"
              onClick={(e) => {
                e.preventDefault();
                void openUrl("https://ko-fi.com/Z8Z71T8QD4");
              }}
            >
              <img
                height="28"
                style={{ border: 0, height: "28px" }}
                src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
                alt={t("Buy Me a Coffee at ko-fi.com")}
              />
            </a>
            <a
              className="social-icon social-icon--youtube"
              href="#"
              title="YouTube"
              onClick={(e) => {
                e.preventDefault();
                void openUrl("https://youtube.com/@Blur009");
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              className="social-icon social-icon--twitch"
              href="#"
              title="Twitch"
              onClick={(e) => {
                e.preventDefault();
                void openUrl("https://twitch.tv/Blur009");
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
              </svg>
            </a>
            <a
              className="social-icon social-icon--github"
              href="#"
              title="GitHub"
              onClick={(e) => {
                e.preventDefault();
                void openUrl("https://github.com/Blur009/Blur-AutoClicker");
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.8 1.8 3.4 1.2.1-.7.4-1.2.7-1.5-2.7-.3-5.4-1.3-5.4-6a4.7 4.7 0 0 1 1.2-3.2c-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6.1 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2a4.7 4.7 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.4 6 .4.3.8 1 .8 2.1v3.1c0 .4.2.7.8.6A12 12 0 0 0 12 .3" />
              </svg>
            </a>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label-group settings-label-group--inline">
            <span className="settings-label">{t("Version")}</span>
            <span className="settings-value">
              v{appInfo.version}
              {appInfo.portable ? ` ${t("portable (no auto update)")}` : ""}
            </span>
          </div>
          <div className="settings-row-actions">
            <button
              className="settings-btn-secondary changelog-toggle-btn"
              onClick={() => setShowChangelog((v) => !v)}
            >
              <svg
                className={`changelog-arrow${showChangelog ? " open" : ""}`}
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M3 1L7 5L3 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {showChangelog ? t("Hide Changes") : t("Show Changes")}
            </button>
            <button
              className="settings-btn-secondary check-update-btn"
              onClick={onCheckForUpdate}
              disabled={updateCheckStatus !== "idle"}
            >
              {updateButtonLabel}
            </button>
          </div>
        </div>
        {showChangelog && <ChangelogContent entries={changelogEntries} />}
      </SettingsCard>

      <SettingsCard
        title={t("Usage")}
        description={t(
          "Clicking statistics for all sessions (only stored locally).",
        )}
      >
        {hasStats ? (
          <div className="stats-grid">
            <div className="stats-cell">
              <span className="stats-cell-label">{t("Total Clicks")}</span>
              <span className="stats-cell-value">
                {formatNumber(stats.totalClicks, language)}
              </span>
            </div>
            <div className="stats-cell">
              <span className="stats-cell-label">
                {t("Total Clicking Time")}
              </span>
              <span className="stats-cell-value">
                {formatTime(stats.totalTimeSecs, language, t)}
              </span>
            </div>
            <div className="stats-cell">
              <span className="stats-cell-label">{t("Average CPU Usage")}</span>
              <span className="stats-cell-value">
                {formatCpu(stats.avgCpu, language, t("N/A"))}
              </span>
            </div>
            <div className="stats-cell">
              <span className="stats-cell-label">{t("Clicking Sessions")}</span>
              <span className="stats-cell-value">
                {formatNumber(stats.totalSessions, language)}
              </span>
            </div>
          </div>
        ) : (
          <div className="stats-empty">{t("No session data yet.")}</div>
        )}
      </SettingsCard>
    </>
  );
}

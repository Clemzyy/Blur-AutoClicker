import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { useTranslation } from "../../../../i18n";
import ConfirmDialog from "../../../ConfirmDialog";
import { SettingsCard } from "./shared";

interface CumulativeStats {
  totalClicks: number;
  totalTimeSecs: number;
  totalSessions: number;
  avgCpu: number;
}

interface Props {
  onReset: () => Promise<void>;
}

export default function MaintenanceSection({ onReset }: Props) {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<
    "reset-settings" | "reset-usage" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [diagnosticsStatus, setDiagnosticsStatus] = useState<string | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const handleConfirmResetSettings = async () => {
    setBusy(true);
    try {
      await onReset();
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  };

  const handleConfirmResetUsage = async () => {
    setBusy(true);
    try {
      await invoke<CumulativeStats>("reset_stats");
    } catch {
      // ignore
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <SettingsCard
        title={t("Reset")}
        description={t("Reset all settings or usage data.")}
      >
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Reset All Settings")}</span>
            <span className="settings-sublabel">
              {t("Reset all settings to their defaults.")}
            </span>
          </div>
          <button
            className="settings-btn-danger"
            onClick={() => setPendingAction("reset-settings")}
          >
            {t("Reset")}
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Reset Usage Data")}</span>
            <span className="settings-sublabel">
              {t("Clear all session statistics and usage history.")}
            </span>
          </div>
          <button
            className="settings-btn-danger"
            onClick={() => setPendingAction("reset-usage")}
          >
            {t("Reset")}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("Diagnostics")}
        description={t("Your logs & crash reports")}
      >
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Diagnostics")}</span>
            <span className="settings-sublabel">
              {t("View or export your diagnostics.")}
            </span>
          </div>
          <div className="settings-row-actions">
            <button
              className="settings-btn-secondary"
              onClick={async () => {
                try {
                  await invoke("open_diagnostics_folder");
                } catch (err) {
                  error(
                    JSON.stringify({
                      source: "SettingsPanel.openDiagnostics",
                      error: String(err),
                    }),
                  );
                }
              }}
            >
              {t("Open Folder")}
            </button>
            <button
              className="settings-btn-secondary"
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                setDiagnosticsStatus(null);
                try {
                  const path: string = await invoke(
                    "export_diagnostics_bundle",
                  );
                  setDiagnosticsStatus(t("Exported to {path}", { path }));
                } catch (err) {
                  setDiagnosticsStatus(t("Export failed"));
                  error(
                    JSON.stringify({
                      source: "SettingsPanel.exportDiagnostics",
                      error: String(err),
                    }),
                  );
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? t("Exporting...") : t("Export")}
            </button>
          </div>
        </div>
        {diagnosticsStatus && (
          <span className="settings-note">{diagnosticsStatus}</span>
        )}
      </SettingsCard>

      <ConfirmDialog
        open={pendingAction === "reset-settings"}
        title={t("Reset all settings")}
        message={t(
          "This will reset all settings to their default values. This action cannot be undone.",
        )}
        confirmLabel={t("Reset")}
        busy={busy}
        onConfirm={handleConfirmResetSettings}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmDialog
        open={pendingAction === "reset-usage"}
        title={t("Reset usage data")}
        message={t(
          "This will clear all session statistics and usage history. This action cannot be undone.",
        )}
        confirmLabel={t("Reset")}
        busy={busy}
        onConfirm={handleConfirmResetUsage}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}

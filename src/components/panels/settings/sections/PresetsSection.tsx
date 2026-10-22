import { useEffect, useRef, useState } from "react";
import {
  PRESET_NAME_MAX_LENGTH,
  buildPresetSnapshot,
  displayPresetName,
  getPresetSummary,
} from "../../../../settingsSchema";
import { useTranslation } from "../../../../i18n";
import type { PresetDefinition, PresetId, Settings } from "../../../../store";
import { SettingsCard } from "./shared";

function PresetRow({
  preset,
  isActive,
  isModified,
  isEditing,
  isConfirmingDelete,
  running,
  renameDraft,
  renameError,
  onRenameDraftChange,
  onStartRename,
  onCancelRename,
  onCommitRename,
  onApply,
  onUpdatePreset,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onDuplicate,
  onExport,
}: {
  preset: PresetDefinition;
  isActive: boolean;
  isModified: boolean;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  running: boolean;
  renameDraft: string;
  renameError: string;
  onRenameDraftChange: (value: string) => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onCommitRename: () => void;
  onApply: () => void;
  onUpdatePreset: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}) {
  const { language, t } = useTranslation();
  return (
    <div
      className={`preset-card ${isActive ? "preset-card--active" : ""}`}
      data-preset-id={preset.id}
    >
      <div className="preset-card-head">
        <div className="preset-card-meta">
          {isEditing ? (
            <input
              className="preset-rename-input"
              value={renameDraft}
              maxLength={PRESET_NAME_MAX_LENGTH}
              onChange={(event) => onRenameDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCommitRename();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelRename();
                }
              }}
              autoFocus
            />
          ) : (
            <span className="preset-name">{displayPresetName(preset, t)}</span>
          )}
          <div className="preset-badges">
            {isActive && !isModified && (
              <span className="preset-badge preset-badge--active">
                {t("Active")}
              </span>
            )}
            {isActive && isModified && (
              <span className="preset-badge preset-badge--modified">
                {t("Modified")}
              </span>
            )}
            <span className="preset-badge">
              {new Date(preset.updatedAt).toLocaleDateString(language)}
            </span>
          </div>
          <div className="preset-summary">
            {getPresetSummary(preset.settings, t)}
          </div>
        </div>
        <div className="preset-actions">
          {isEditing ? (
            <>
              <button
                className="settings-btn-secondary"
                onClick={onCommitRename}
                disabled={running}
              >
                {t("Save")}
              </button>
              <button className="settings-btn-quiet" onClick={onCancelRename}>
                {t("Cancel")}
              </button>
            </>
          ) : isConfirmingDelete ? (
            <>
              <button
                className="settings-btn-danger settings-btn-danger--compact"
                onClick={onConfirmDelete}
                disabled={running}
              >
                {t("Confirm?")}
              </button>
              <button className="settings-btn-quiet" onClick={onCancelDelete}>
                {t("Cancel")}
              </button>
            </>
          ) : (
            <>
              <button
                className="settings-btn-primary"
                onClick={onApply}
                disabled={running}
              >
                {t("Apply")}
              </button>
              <button
                className="settings-btn-secondary"
                onClick={onUpdatePreset}
                disabled={running}
              >
                {t("Update")}
              </button>
              <button
                className="settings-btn-secondary"
                onClick={onStartRename}
                disabled={running}
              >
                {t("Rename")}
              </button>
              <button
                className="settings-btn-secondary"
                onClick={onDuplicate}
                disabled={running}
              >
                {t("Duplicate")}
              </button>
              <button
                className="settings-btn-danger settings-btn-danger--compact"
                onClick={onRequestDelete}
                disabled={running}
              >
                {t("Delete")}
              </button>
              <button
                className="settings-btn-quiet"
                onClick={onExport}
                title={t("Export preset")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      {isEditing && renameError && (
        <div className="preset-rename-error">{renameError}</div>
      )}
    </div>
  );
}

interface Props {
  settings: Settings;
  running: boolean;
  onSavePreset: (name: string) => boolean;
  onApplyPreset: (presetId: PresetId) => boolean;
  onUpdatePreset: (presetId: PresetId) => boolean;
  onRenamePreset: (presetId: PresetId, name: string) => boolean;
  onDeletePreset: (presetId: PresetId) => boolean;
  onDuplicatePreset: (presetId: PresetId) => boolean;
  onExportPreset: (presetId: PresetId) => Promise<boolean>;
  onImportPreset: () => Promise<boolean | null>;
}

export default function PresetsSection({
  settings,
  running,
  onSavePreset,
  onApplyPreset,
  onUpdatePreset,
  onRenamePreset,
  onDeletePreset,
  onDuplicatePreset,
  onExportPreset,
  onImportPreset,
}: Props) {
  const { t } = useTranslation();
  const [newPresetName, setNewPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<PresetId | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<PresetId | null>(
    null,
  );
  const [presetsAtBottom, setPresetsAtBottom] = useState(true);
  const presetsListRef = useRef<HTMLDivElement>(null);

  const activeEditingPresetId = running ? null : editingPresetId;
  const activeConfirmingDeleteId = running ? null : confirmingDeleteId;

  const activePreset = settings.activePresetId
    ? (settings.presets.find((p) => p.id === settings.activePresetId) ?? null)
    : null;

  const currentSnapshot = buildPresetSnapshot(settings);
  const isActiveModified =
    activePreset !== null &&
    JSON.stringify(activePreset.settings) !== JSON.stringify(currentSnapshot);

  useEffect(() => {
    if (!confirmingDeleteId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const presetCard = target.closest("[data-preset-id]");
      if (presetCard?.getAttribute("data-preset-id") === confirmingDeleteId)
        return;
      setConfirmingDeleteId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [confirmingDeleteId]);

  const handlePresetsScroll = () => {
    const list = presetsListRef.current;
    if (!list) return;
    setPresetsAtBottom(
      list.scrollTop + list.clientHeight >= list.scrollHeight - 2,
    );
  };

  useEffect(() => {
    handlePresetsScroll();
  }, [settings.presets.length]);

  const handleSavePreset = () => {
    if (onSavePreset(newPresetName)) {
      setNewPresetName("");
      setConfirmingDeleteId(null);
    }
  };

  const handleStartRename = (preset: PresetDefinition) => {
    setConfirmingDeleteId(null);
    setEditingPresetId(preset.id);
    setRenameDraft(displayPresetName(preset, t));
    setRenameError("");
  };

  const handleCommitRename = () => {
    if (!editingPresetId) return;

    const trimmed = renameDraft.trim();
    if (!trimmed) {
      setRenameError(t("Name cannot be empty"));
      return;
    }

    const duplicate = settings.presets.some(
      (p) =>
        p.id !== editingPresetId &&
        p.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setRenameError(t("A preset with this name already exists"));
      return;
    }

    setRenameError("");
    if (onRenamePreset(editingPresetId, trimmed)) {
      setEditingPresetId(null);
      setRenameDraft("");
    }
  };

  const handleCancelRename = () => {
    setEditingPresetId(null);
    setRenameDraft("");
    setRenameError("");
  };

  const handleRequestDelete = (presetId: PresetId) => {
    setEditingPresetId(null);
    setRenameDraft("");
    setRenameError("");
    setConfirmingDeleteId(presetId);
  };

  const handleConfirmDelete = (presetId: PresetId) => {
    if (onDeletePreset(presetId)) {
      setConfirmingDeleteId(null);
    }
  };

  const handleImport = async () => {
    await onImportPreset();
  };

  return (
    <SettingsCard
      title={t("Presets")}
      description={t("Save and load presets.")}
    >
      <div className="settings-row settings-row--stacked">
        <div className="settings-label-group">
          <span className="settings-label">{t("Presets")}</span>
          <span className="settings-sublabel">
            {t("Save and restore to quickly switch configurations.")}
          </span>
        </div>
        <div className="preset-compose">
          <input
            className="preset-name-input"
            placeholder={t("Preset name")}
            value={newPresetName}
            maxLength={PRESET_NAME_MAX_LENGTH}
            onChange={(event) => setNewPresetName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (!running && newPresetName.trim()) {
                  handleSavePreset();
                }
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setNewPresetName("");
              }
            }}
            disabled={running}
          />
          <button
            className="settings-btn-primary"
            onClick={handleSavePreset}
            disabled={running || newPresetName.trim().length === 0}
          >
            {t("Save")}
          </button>
        </div>
        <div className="preset-toolbar">
          <button
            className="settings-btn-secondary preset-toolbar-btn"
            onClick={handleImport}
            disabled={running}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {t("Import")}
          </button>
          {settings.presets.length > 0 && (
            <span className="preset-count">
              {settings.presets.length === 1
                ? t("{count} preset", { count: 1 })
                : t("{count} presets", { count: settings.presets.length })}
            </span>
          )}
        </div>
        {running && (
          <span className="settings-note">{t("Disabled while clicking")}</span>
        )}
        {settings.presets.length > 0 ? (
          <div className="preset-list-shell">
            <div
              className="preset-list"
              ref={presetsListRef}
              onScroll={handlePresetsScroll}
            >
              {settings.presets.map((preset) => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  isActive={settings.activePresetId === preset.id}
                  isModified={
                    settings.activePresetId === preset.id && isActiveModified
                  }
                  isEditing={activeEditingPresetId === preset.id}
                  isConfirmingDelete={activeConfirmingDeleteId === preset.id}
                  running={running}
                  renameDraft={
                    activeEditingPresetId === preset.id
                      ? renameDraft
                      : preset.name
                  }
                  renameError={
                    activeEditingPresetId === preset.id ? renameError : ""
                  }
                  onRenameDraftChange={setRenameDraft}
                  onStartRename={() => handleStartRename(preset)}
                  onCancelRename={handleCancelRename}
                  onCommitRename={handleCommitRename}
                  onApply={() => {
                    setConfirmingDeleteId(null);
                    onApplyPreset(preset.id);
                  }}
                  onUpdatePreset={() => {
                    setConfirmingDeleteId(null);
                    onUpdatePreset(preset.id);
                  }}
                  onRequestDelete={() => handleRequestDelete(preset.id)}
                  onCancelDelete={() => setConfirmingDeleteId(null)}
                  onConfirmDelete={() => handleConfirmDelete(preset.id)}
                  onDuplicate={() => {
                    setConfirmingDeleteId(null);
                    onDuplicatePreset(preset.id);
                  }}
                  onExport={() => {
                    void onExportPreset(preset.id);
                  }}
                />
              ))}
            </div>
            <div
              className={`preset-list-fade ${presetsAtBottom ? "preset-list-fade--hidden" : ""}`}
            />
          </div>
        ) : (
          <div className="stats-empty">{t("No saved presets.")}</div>
        )}
      </div>
    </SettingsCard>
  );
}

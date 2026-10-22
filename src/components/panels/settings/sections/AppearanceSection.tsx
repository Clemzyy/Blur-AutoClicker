import { error } from "@tauri-apps/plugin-log";
import { open } from "@tauri-apps/plugin-dialog";
import {
  getExtension,
  IMAGE_EXTENSIONS,
  isLegacyVideoExtension,
  PLAYABLE_VIDEO_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from "../../../../backgroundMedia";
import { LANGUAGE_OPTIONS, msg, useTranslation } from "../../../../i18n";
import { DEFAULT_ACCENT_COLOR } from "../../../../settingsSchema";
import type { IconColor, IconTheme } from "../../../../settingsSchema";
import type { Settings } from "../../../../store";
import { SettingsCard } from "./shared";

const MEDIA_FILTERS = [
  {
    name: msg("All Media"),
    extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] as string[],
  },
  {
    name: msg("Images"),
    extensions: [...IMAGE_EXTENSIONS] as string[],
  },
  {
    name: msg("Videos (reliable)"),
    extensions: [...PLAYABLE_VIDEO_EXTENSIONS] as string[],
  },
];

const PAGES = [
  { suffix: "Simple", label: msg("Simple Page") },
  { suffix: "Advanced", label: msg("Advanced Page") },
  { suffix: "Zones", label: msg("Zones Page") },
  { suffix: "ClickPoints", label: msg("Click Points Page") },
  { suffix: "Settings", label: msg("Settings Page") },
] as const;

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

function PageAppearanceControls({
  settings,
  update,
  suffix,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  suffix: string;
}) {
  const { t } = useTranslation();
  const bgImageKey = `backgroundImage${suffix}` as keyof Settings;
  const bgOpacityKey = `backgroundOpacity${suffix}` as keyof Settings;
  const winOpacityKey = `windowOpacity${suffix}` as keyof Settings;
  const panelOpacityKey = `panelOpacity${suffix}` as keyof Settings;
  const panelBlurKey = `panelBlur${suffix}` as keyof Settings;
  const bgBlurKey = `backgroundBlur${suffix}` as keyof Settings;

  const bgImage = settings[bgImageKey] as string;
  const bgOpacity = settings[bgOpacityKey] as number;
  const winOpacity = settings[winOpacityKey] as number;
  const panelOpacity = settings[panelOpacityKey] as number;
  const panelBlur = settings[panelBlurKey] as number;
  const bgBlur = settings[bgBlurKey] as number;

  const handleBrowse = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: MEDIA_FILTERS.map((filter) => ({
          ...filter,
          name: t(filter.name),
        })),
      });
      if (selected) {
        update({ [bgImageKey]: selected as string });
      }
    } catch (err) {
      error(
        JSON.stringify({
          source: "SettingsPanel.pickImage",
          error: String(err),
        }),
      );
    }
  };

  return (
    <>
      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Background Media")}</span>
          <span className="settings-sublabel">
            {t(
              "Path or URL to an image or video. Images support transparency. Videos auto-loop muted.",
            )}
          </span>
        </div>
        <div className="settings-bg-image-row">
          <input
            className="settings-bg-input"
            type="text"
            value={bgImage}
            onChange={(e) => update({ [bgImageKey]: e.target.value })}
            placeholder={t(
              "https://example.com/image.png or C:\\Videos\\loop.mp4",
            )}
          />
          <div className="settings-bg-buttons">
            <button className="settings-btn-secondary" onClick={handleBrowse}>
              {t("Browse")}
            </button>
            <button
              className="settings-btn-danger settings-btn-danger--compact"
              onClick={() => update({ [bgImageKey]: "" })}
              disabled={!bgImage}
            >
              {t("Remove")}
            </button>
          </div>
        </div>
        {(() => {
          const ext = getExtension(bgImage);
          if (isLegacyVideoExtension(ext)) {
            return (
              <div className="settings-row" style={{ marginTop: "-0.5rem" }}>
                <span
                  className="settings-sublabel"
                  style={{ color: "var(--accent-yellow)" }}
                >
                  {t(
                    "MOV/M4V/AVI/MKV often fail. If video stays black, convert it to mp4.",
                  )}
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Background Opacity")}</span>
          <span className="settings-sublabel">
            {t("Transparency of the app window background.")}
          </span>
        </div>
        <div className="settings-opacity-controls">
          <input
            type="range"
            className="settings-opacity-slider"
            min="0"
            max="100"
            value={winOpacity}
            onChange={(e) =>
              update({ [winOpacityKey]: Number(e.target.value) })
            }
          />
          <span className="settings-slider-value">{winOpacity}%</span>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">
            {t("Background Media Opacity")}
          </span>
          <span className="settings-sublabel">
            {t("Transparency of the background image or video.")}
          </span>
        </div>
        <div className="settings-opacity-controls">
          <input
            type="range"
            className="settings-opacity-slider"
            min="0"
            max="100"
            value={bgOpacity}
            disabled={!bgImage}
            onChange={(e) => update({ [bgOpacityKey]: Number(e.target.value) })}
          />
          <span className="settings-slider-value">{bgOpacity}%</span>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Panel Opacity")}</span>
          <span className="settings-sublabel">
            {t("Transparency of the panel.")}
          </span>
        </div>
        <div className="settings-opacity-controls">
          <input
            type="range"
            className="settings-opacity-slider"
            min="0"
            max="100"
            value={panelOpacity}
            onChange={(e) =>
              update({ [panelOpacityKey]: Number(e.target.value) })
            }
          />
          <span className="settings-slider-value">{panelOpacity}%</span>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Background Blur")}</span>
          <span className="settings-sublabel">
            {t("Blur the background media itself, across the whole UI.")}
          </span>
        </div>
        <div className="settings-opacity-controls">
          <input
            type="range"
            className="settings-opacity-slider"
            min="0"
            max="20"
            value={bgBlur}
            disabled={!bgImage}
            onChange={(e) => update({ [bgBlurKey]: Number(e.target.value) })}
          />
          <span className="settings-slider-value">{bgBlur}px</span>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Panel Blur")}</span>
          <span className="settings-sublabel">
            {t("Blur effect behind the panel.")}
          </span>
        </div>
        <div className="settings-opacity-controls">
          <input
            type="range"
            className="settings-opacity-slider"
            min="0"
            max="20"
            value={panelBlur}
            onChange={(e) => update({ [panelBlurKey]: Number(e.target.value) })}
          />
          <span className="settings-slider-value">{panelBlur}px</span>
        </div>
      </div>
    </>
  );
}

export default function AppearanceSection({ settings, update }: Props) {
  const { t } = useTranslation();
  const isPerPage = settings.perPageAppearance;

  const handleModeChange = (individual: boolean) => {
    update({ perPageAppearance: individual });
  };

  const themeAccent = (
    <SettingsCard
      title={t("Theme & Accent")}
      description={t("Applied to all pages.")}
    >
      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Language")}</span>
          <span className="settings-sublabel">
            {t("System follows the Windows display language.")}
          </span>
        </div>
        <div className="settings-seg-group">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`settings-seg-btn ${settings.language === option.value ? "active" : ""}`}
              onClick={() => update({ language: option.value })}
            >
              {option.value === "auto" ? t(option.label) : option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Theme")}</span>
          <span className="settings-sublabel">
            {t("Choose between dark and light mode.")}
          </span>
        </div>
        <div className="settings-seg-group">
          {(["dark", "light"] as const).map((theme) => (
            <button
              key={theme}
              className={`settings-seg-btn ${settings.theme === theme ? "active" : ""}`}
              onClick={() => update({ theme })}
            >
              {theme === "dark" ? t("Dark") : t("Light")}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <div className="settings-label-group">
          <span className="settings-label">{t("Accent Color")}</span>
          <span className="settings-sublabel">
            {t("The primary accent color.")}
          </span>
        </div>
        <div className="settings-color-controls">
          <label className="settings-color-picker">
            <input
              type="color"
              value={settings.accentColor}
              onChange={(event) => update({ accentColor: event.target.value })}
            />
          </label>
          <span className="settings-value settings-value--mono">
            {settings.accentColor.toUpperCase()}
          </span>
          <button
            className="settings-btn-secondary"
            onClick={() => update({ accentColor: DEFAULT_ACCENT_COLOR })}
            disabled={settings.accentColor === DEFAULT_ACCENT_COLOR}
          >
            {t("Reset")}
          </button>
        </div>
      </div>
    </SettingsCard>
  );

  return (
    <>
      {themeAccent}

      <SettingsCard
        title={t("Appearance Mode")}
        description={t(
          "Use one style for all pages, or customize each page individually.",
        )}
      >
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Mode")}</span>
          </div>
          <div className="settings-seg-group">
            <button
              className={`settings-seg-btn ${!isPerPage ? "active" : ""}`}
              onClick={() => handleModeChange(false)}
            >
              {t("Global")}
            </button>
            <button
              className={`settings-seg-btn ${isPerPage ? "active" : ""}`}
              onClick={() => handleModeChange(true)}
            >
              {t("Individual")}
            </button>
          </div>
        </div>
      </SettingsCard>

      {!isPerPage ? (
        <SettingsCard title={t("Page Style")}>
          <PageAppearanceControls
            settings={settings}
            update={update}
            suffix=""
          />
        </SettingsCard>
      ) : (
        PAGES.map((page) => (
          <section className="settings-card" key={page.suffix}>
            <span className="settings-page-header">{t(page.label)}</span>
            <div className="settings-card-content">
              <PageAppearanceControls
                settings={settings}
                update={update}
                suffix={page.suffix}
              />
            </div>
          </section>
        ))
      )}

      <SettingsCard
        title={t("Taskbar Icon")}
        description={t("Control how the taskbar and tray icon looks.")}
      >
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Active Icon")}</span>
            <span className="settings-sublabel">
              {t("Show different icon when clicker is active.")}
            </span>
          </div>
          <div className="settings-toggle-wrapper">
            <button
              className={`settings-toggle ${settings.taskbarIconEnabled ? "on" : "off"}`}
              onClick={() =>
                update({ taskbarIconEnabled: !settings.taskbarIconEnabled })
              }
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Icon Theme")}</span>
            <span className="settings-sublabel">
              {t("Which themed icons to use. Auto follows app theme.")}
            </span>
          </div>
          <div className="settings-seg-group">
            {(["auto", "dark", "light"] as IconTheme[]).map((opt) => (
              <button
                key={opt}
                className={`settings-seg-btn ${settings.taskbarIconTheme === opt ? "active" : ""}`}
                onClick={() => update({ taskbarIconTheme: opt })}
              >
                {opt === "auto"
                  ? t("Auto")
                  : opt === "dark"
                    ? t("Dark")
                    : t("Light")}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`settings-row ${!settings.taskbarIconEnabled ? "settings-row--disabled" : ""}`}
        >
          <div className="settings-label-group">
            <span className="settings-label">{t("Icon Color")}</span>
            <span className="settings-sublabel">
              {t("Use accent color or default icon colors.")}
            </span>
          </div>
          <div className="settings-seg-group">
            {(["theme", "default"] as IconColor[]).map((opt) => (
              <button
                key={opt}
                className={`settings-seg-btn ${settings.taskbarIconColor === opt ? "active" : ""}`}
                onClick={() =>
                  settings.taskbarIconEnabled &&
                  update({ taskbarIconColor: opt })
                }
              >
                {opt === "theme" ? t("Theme") : t("Default")}
              </button>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("Status Bar")}
        description={t("Show the status bar at the bottom of the window.")}
      >
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Footer")}</span>
            <span className="settings-sublabel">
              {t("Shows active preset, version, and stop reasons.")}
            </span>
          </div>
          <div className="settings-toggle-wrapper">
            <button
              className={`settings-toggle ${settings.statusBarEnabled ? "on" : "off"}`}
              onClick={() =>
                update({ statusBarEnabled: !settings.statusBarEnabled })
              }
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

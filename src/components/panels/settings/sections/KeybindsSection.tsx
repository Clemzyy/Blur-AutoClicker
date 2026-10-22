import { msg, useTranslation } from "../../../../i18n";
import type { Settings } from "../../../../store";
import KeyCaptureInput from "../../../KeyCaptureInput";
import { SettingsCard } from "./shared";

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const PAGES = [
  { key: "keybindSimple" as const, label: msg("Simple") },
  { key: "keybindAdvanced" as const, label: msg("Advanced") },
  { key: "keybindZones" as const, label: msg("Zones") },
  { key: "keybindClickPoints" as const, label: msg("Click Points") },
  { key: "keybindSettings" as const, label: msg("Settings") },
];

const TOGGLE_GROUPS: {
  title: string;
  items: { key: keyof Settings; label: string; sublabel: string }[];
}[] = [
  {
    title: msg("Advanced"),
    items: [
      {
        key: "keybindMode",
        label: msg("Click Mode"),
        sublabel: msg("Cycle Toggle / Hold."),
      },
      {
        key: "keybindInputType",
        label: msg("Input Type"),
        sublabel: msg("Cycle Mouse / Keyboard."),
      },
      {
        key: "keybindDoubleClick",
        label: msg("Double Click"),
        sublabel: msg("Toggle on or off."),
      },
      {
        key: "keybindDutyCycleMode",
        label: msg("Duty Cycle"),
        sublabel: msg("Cycle Click / Hold."),
      },
      {
        key: "keybindSpeedRandomization",
        label: msg("Speed Randomization"),
        sublabel: msg("Toggle on or off."),
      },
      {
        key: "keybindLimits",
        label: msg("Limits"),
        sublabel: msg("Toggle the active click/time limit."),
      },
    ],
  },
  {
    title: msg("Zones"),
    items: [
      {
        key: "keybindCornerStop",
        label: msg("Corner Stop"),
        sublabel: msg("Toggle on or off."),
      },
      {
        key: "keybindEdgeStop",
        label: msg("Edge Stop"),
        sublabel: msg("Toggle on or off."),
      },
      {
        key: "keybindStopZones",
        label: msg("Custom Stop Zones"),
        sublabel: msg("Toggle on or off."),
      },
    ],
  },
  {
    title: msg("Click Points"),
    items: [
      {
        key: "keybindToggleClickPoints",
        label: msg("Click Points"),
        sublabel: msg("Toggle on or off."),
      },
      {
        key: "keybindStopWhenComplete",
        label: msg("Stop When Complete"),
        sublabel: msg("Toggle on or off."),
      },
    ],
  },
];

export default function KeybindsSection({ settings, update }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <SettingsCard
        title={t("Master Switch")}
        description={t(
          "Bind a key that globally enables or disables the autoclicker. When off, the main activation keybind will not start it. Empty by default (always allowed).",
        )}
      >
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Master Key")}</span>
            <span className="settings-sublabel">
              {t(
                "Toggle disables/enables on press. Hold keeps it enabled while held.",
              )}
            </span>
          </div>
          <KeyCaptureInput
            className="settings-keybind-capture"
            value={settings.keybindMaster}
            onChange={(key) => update({ keybindMaster: key })}
          />
        </div>
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-label">{t("Master Key Mode")}</span>
            <span className="settings-sublabel">
              {t(
                "Toggle: press to flip. Hold: autoclicker runs only while held.",
              )}
            </span>
          </div>
          <div className="settings-seg-group">
            <button
              type="button"
              className={`settings-seg-btn ${settings.masterKeybindMode === "toggle" ? "active" : ""}`}
              onClick={() => update({ masterKeybindMode: "toggle" })}
            >
              {t("Toggle")}
            </button>
            <button
              type="button"
              className={`settings-seg-btn ${settings.masterKeybindMode === "hold" ? "active" : ""}`}
              onClick={() => update({ masterKeybindMode: "hold" })}
            >
              {t("Hold")}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("Keybinds")}
        description={t(
          "Set a keyboard shortcut for each page. Press the key you want to bind.",
        )}
      >
        {PAGES.map((page) => (
          <div className="settings-row" key={page.key}>
            <div className="settings-label-group">
              <span className="settings-label">{t(page.label)}</span>
              <span className="settings-sublabel">
                {t("Switch to the {page} page.", { page: t(page.label) })}
              </span>
            </div>
            <KeyCaptureInput
              className="settings-keybind-capture"
              value={settings[page.key]}
              onChange={(key) => update({ [page.key]: key })}
            />
          </div>
        ))}
      </SettingsCard>

      {TOGGLE_GROUPS.map((group) => (
        <SettingsCard
          key={group.title}
          title={t("{group} Toggle Keybinds", { group: t(group.title) })}
          description={t(
            "Bind a key to flip a setting from anywhere in the app. Empty by default.",
          )}
        >
          {group.items.map((item) => (
            <div className="settings-row" key={item.key}>
              <div className="settings-label-group">
                <span className="settings-label">{t(item.label)}</span>
                <span className="settings-sublabel">{t(item.sublabel)}</span>
              </div>
              <KeyCaptureInput
                className="settings-keybind-capture"
                value={settings[item.key] as string}
                onChange={(key) => update({ [item.key]: key })}
              />
            </div>
          ))}
        </SettingsCard>
      ))}
    </>
  );
}

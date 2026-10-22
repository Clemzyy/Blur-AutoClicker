import { Component, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error as logError } from "@tauri-apps/plugin-log";
import { resolveLanguage, translate } from "../i18n";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleQuit = () => {
    invoke("quit_app").catch((e) =>
      logError(
        JSON.stringify({ source: "ErrorBoundary.quit", error: String(e) }),
      ),
    );
  };

  render() {
    // Shown outside the settings context: follows the system language.
    const t = (text: string) => translate(resolveLanguage("auto"), text);
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100dvh",
            padding: 24,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            background: "var(--bg-base)",
            color: "var(--text-primary)",
          }}
        >
          <h2>{t("Something went wrong")}</h2>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: 13,
              maxWidth: 400,
              wordBreak: "break-word",
              marginTop: 8,
            }}
          >
            {this.state.error?.message}
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "8px 20px",
                cursor: "pointer",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                font: "inherit",
              }}
            >
              {t("Try again")}
            </button>
            <button
              onClick={this.handleQuit}
              style={{
                padding: "8px 20px",
                cursor: "pointer",
                borderRadius: 6,
                border: "1px solid var(--accent-red)",
                background: "transparent",
                color: "var(--accent-red)",
                font: "inherit",
              }}
            >
              {t("Quit")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

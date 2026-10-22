import { describe, expect, it } from "vitest";
import {
  BACKEND_MESSAGES,
  resolveLanguage,
  translate,
  translateBackendMessage,
} from "../i18n";
import fr from "../locales/fr.json";

// Prettier writes '...' when the text itself contains double quotes.
const STRING_LITERAL = String.raw`(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')`;
const TRANSLATION_CALLS = [
  new RegExp(String.raw`\bt\(\s*` + STRING_LITERAL, "g"),
  new RegExp(String.raw`\bmsg\(\s*` + STRING_LITERAL, "g"),
  new RegExp(String.raw`\btranslate\(\s*[\w.]+\s*,\s*` + STRING_LITERAL, "g"),
];
const PARAMETRIC_BACKEND_MESSAGES = [
  "Click limit reached ({count})",
  "Time limit reached ({time})",
];

const sources = Object.values(
  import.meta.glob<string>(["../**/*.{ts,tsx}", "!../test/**"], {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);
const unescape = (doubleQuoted?: string, singleQuoted?: string): string =>
  JSON.parse(
    doubleQuoted !== undefined
      ? `"${doubleQuoted}"`
      : `"${singleQuoted!.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`,
  ) as string;

const translated = new Set(
  TRANSLATION_CALLS.flatMap((pattern) =>
    sources.flatMap((source) =>
      [...source.matchAll(pattern)].map((match) =>
        unescape(match[1], match[2]),
      ),
    ),
  ),
);
// A text shown with t(variable) still appears as a quoted literal somewhere.
const allSource = sources.join("\n");
const quotedInSource = (text: string) =>
  allSource.includes(JSON.stringify(text)) ||
  allSource.includes(`'${text.replace(/'/g, "\\'")}'`);
const dictionary = fr as Record<string, string>;
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("French translations", () => {
  it("translate every literal passed to t(), msg() or translate()", () => {
    const missing = [...translated].filter((text) => !(text in dictionary));
    expect(missing).toEqual([]);
  });

  it("translate every status message sent by the engine", () => {
    const missing = [
      ...BACKEND_MESSAGES,
      ...PARAMETRIC_BACKEND_MESSAGES,
    ].filter((text) => !(text in dictionary));
    expect(missing).toEqual([]);
  });

  it("only contain texts that still exist in the source", () => {
    const unused = Object.keys(dictionary).filter(
      (text) =>
        !translated.has(text) &&
        !quotedInSource(text) &&
        !PARAMETRIC_BACKEND_MESSAGES.includes(text),
    );
    expect(unused).toEqual([]);
  });

  it("keep the same {placeholders} as the English text", () => {
    const mismatched = Object.entries(dictionary).filter(
      ([english, french]) =>
        !french.trim() ||
        placeholders(english).join() !== placeholders(french).join(),
    );
    expect(mismatched).toEqual([]);
  });
});

describe("i18n helpers", () => {
  it("follow the system language in auto mode", () => {
    expect(resolveLanguage("auto", "fr-FR")).toBe("fr");
    expect(resolveLanguage("auto", "fr-CA")).toBe("fr");
    expect(resolveLanguage("auto", "en-US")).toBe("en");
    expect(resolveLanguage("auto", "de-DE")).toBe("en");
    expect(resolveLanguage("en", "fr-FR")).toBe("en");
    expect(resolveLanguage("fr", "en-US")).toBe("fr");
  });

  it("fall back to the English text and fill placeholders", () => {
    expect(translate("fr", "A text nobody translated")).toBe(
      "A text nobody translated",
    );
    expect(translate("en", "{n} clicks", { n: 3 })).toBe("3 clicks");
  });

  it("translate parametric stop reasons", () => {
    const t = (text: string, vars?: Record<string, string | number>) =>
      translate("fr", text, vars);
    expect(translateBackendMessage("Click limit reached (500)", t)).toBe(
      translate("fr", "Click limit reached ({count})", { count: "500" }),
    );
    expect(translateBackendMessage("Time limit reached (60.0s)", t)).toContain(
      "60.0s",
    );
    expect(translateBackendMessage("Stopped from hotkey", t)).toBe(
      dictionary["Stopped from hotkey"],
    );
    expect(translateBackendMessage(null, t)).toBe("");
  });
});

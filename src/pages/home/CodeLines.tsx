import styles from "./CodeLines.module.scss";

type TokenKind = "kw" | "fn" | "str" | "num" | "punct" | "plain" | "comment";

export type CodeToken = [kind: TokenKind, text: string];
export type CodeLine = CodeToken[];

export const tok = {
  kw: (text: string): CodeToken => ["kw", text],
  fn: (text: string): CodeToken => ["fn", text],
  str: (text: string): CodeToken => ["str", text],
  num: (text: string): CodeToken => ["num", text],
  punct: (text: string): CodeToken => ["punct", text],
  plain: (text: string): CodeToken => ["plain", text],
};
const { kw: k, fn: f, str: s, num: n, punct: p, plain: v } = tok;

/** Static rain-close logic. Same calls as the smart-window starter in iot-lab. */
export const RAIN_CLOSE_LINES: CodeLine[] = [
  [v("iot"), p("."), f("setChannel"), p("("), s("'rain'"), p(", "), n("1"), p(");")],
  [
    k("if"),
    p(" ("),
    v("iot"),
    p("."),
    f("readChannel"),
    p("("),
    s("'rain'"),
    p(") > "),
    n("0"),
    p(") {"),
  ],
  [v("  iot"), p("."), f("command"), p("("), s("'close'"), p(");")],
  [p("}")],
  [v("iot"), p("."), f("evaluateScene"), p("(")],
  [v("  "), s("'win-rain-close'")],
  [p(");")],
];

export function CodeLines({
  lines,
  activeLines,
  lineNumbers = true,
}: {
  lines: CodeLine[];
  activeLines?: readonly number[];
  lineNumbers?: boolean;
}) {
  return (
    <pre className={styles.code}>
      {lines.map((line, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static snippet, never reordered
          key={index}
          className={`${styles.line} ${activeLines?.includes(index) ? styles.active : ""}`}
        >
          {lineNumbers ? <span className={styles.no}>{index + 1}</span> : null}
          <span>
            {line.map(([kind, text], tokenIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static snippet, never reordered
              <span key={tokenIndex} className={styles[kind]}>
                {text}
              </span>
            ))}
          </span>
        </span>
      ))}
    </pre>
  );
}

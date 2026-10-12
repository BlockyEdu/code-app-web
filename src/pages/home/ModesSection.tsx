import {
  BulbOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { t } from "../../lib/i18n";
import { type CodeLine, CodeLines, tok } from "./CodeLines";
import styles from "./ModesSection.module.scss";
import { SectionHead } from "./SectionHead";

const CATEGORIES: ReadonlyArray<{ key: string; color: string }> = [
  { key: "toolbox.logic", color: "#5B8DEF" },
  { key: "toolbox.loops", color: "#2FB67C" },
  { key: "toolbox.math", color: "#7C6CF2" },
  { key: "toolbox.sensors", color: "#0EA5E9" },
  { key: "home.modes.catDevices", color: "#14B8A6" },
  { key: "toolbox.scenes", color: "#F2685C" },
];

const FILES = ["behavior.js", "hardware.json", "iot.blocks.xml"];

const { kw, fn, str, num, punct, plain } = tok;

const PRO_LINES: CodeLine[] = [
  [
    kw("const"),
    plain(" rain "),
    punct("= "),
    plain("iot"),
    punct("."),
    fn("readChannel"),
    punct("("),
    str("'rain'"),
    punct(");"),
  ],
  [kw("if"), punct(" (rain > "), num("0"), punct(") {")],
  [plain("  iot"), punct("."), fn("command"), punct("("), str("'close'"), punct(");")],
  [punct("}")],
  [plain("iot"), punct("."), fn("evaluateScene"), punct("("), str("'win-rain-close'"), punct(");")],
];

const TERMINAL = [
  "[sim] rain=1 → command close",
  "[sim] position 80 → 0",
  "[assert] rain-close pass",
];

export function ModesSection() {
  return (
    <section aria-labelledby="home-modes-title">
      <SectionHead
        id="home-modes-title"
        title={t("home.modes.title")}
        lead={t("home.modes.lead")}
      />
      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.copy}>
            <h3 className={styles.cardTitle}>{t("home.modes.blockTitle")}</h3>
            <p className={styles.cardLead}>{t("home.modes.blockLead")}</p>
          </div>
          <div className={`${styles.mock} ${styles.blockMock}`} aria-hidden="true">
            <div className={styles.toolbox}>
              {CATEGORIES.map((category, index) => (
                <span
                  key={category.key}
                  className={`${styles.cat} ${index === 3 ? styles.catOn : ""}`}
                  style={{ ["--cat" as string]: category.color }}
                >
                  <i />
                  {t(category.key)}
                </span>
              ))}
            </div>
            <div className={styles.canvas}>
              <div className={`${styles.pill} ${styles.pillEvent} ${styles.hat}`}>
                {t("home.chain.blkEvent")}
              </div>
              <div className={`${styles.pill} ${styles.pillSensor}`}>{t("home.chain.blkIf")}</div>
              <div className={styles.nest}>
                <div className={`${styles.pill} ${styles.pillDevice}`}>
                  {t("home.chain.blkClose")}
                </div>
                <div className={`${styles.pill} ${styles.pillLoop}`}>{t("home.modes.blkWait")}</div>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.copy}>
            <h3 className={styles.cardTitle}>{t("home.modes.proTitle")}</h3>
            <p className={styles.cardLead}>{t("home.modes.proLead")}</p>
          </div>
          <div className={`${styles.mock} ${styles.proMock}`} aria-hidden="true">
            <div className={styles.proMain}>
              <div className={styles.tree}>
                <span className={styles.treeHead}>
                  <FolderOpenOutlined /> {t("home.modes.files")}
                </span>
                {FILES.map((file, index) => (
                  <span key={file} className={`${styles.file} ${index === 0 ? styles.fileOn : ""}`}>
                    <FileTextOutlined /> {file}
                  </span>
                ))}
              </div>
              <div className={styles.editor}>
                <span className={styles.tab}>behavior.js</span>
                <CodeLines lines={PRO_LINES} />
              </div>
            </div>
            <div className={styles.terminal}>
              <span className={styles.terminalHead}>{t("home.modes.terminal")}</span>
              {TERMINAL.map((line) => (
                <span key={line} className={styles.terminalLine}>
                  {line}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className={styles.ai}>
        <span className={styles.aiLabel}>
          <span className={styles.aiIcon}>
            <RobotOutlined />
          </span>
          {t("home.modes.aiLabel")}
        </span>
        <span className={styles.aiInput}>{t("home.modes.aiAsk")}</span>
        <span className={styles.aiChips}>
          <span className={styles.aiChip}>
            <BulbOutlined /> {t("home.modes.aiExplain")}
          </span>
          <span className={styles.aiChip}>
            <ToolOutlined /> {t("home.modes.aiFix")}
          </span>
          <span className={styles.aiChip}>
            <ThunderboltOutlined /> {t("home.modes.aiGenerate")}
          </span>
        </span>
      </div>
    </section>
  );
}

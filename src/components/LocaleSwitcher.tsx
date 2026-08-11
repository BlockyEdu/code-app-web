import { CheckOutlined, GlobalOutlined } from "@ant-design/icons";
import { Dropdown, type MenuProps } from "antd";
import { type AppLocale, useLocaleStore } from "../lib/locale-store";
import styles from "./LocaleSwitcher.module.scss";

const OPTIONS: { key: AppLocale; label: string }[] = [
  { key: "zh-CN", label: "简体中文" },
  { key: "en-US", label: "English" },
];

export function LocaleSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const items: MenuProps["items"] = OPTIONS.map((opt) => ({
    key: opt.key,
    label: opt.label,
    icon:
      locale === opt.key ? (
        <CheckOutlined />
      ) : (
        <span style={{ width: 14, display: "inline-block" }} />
      ),
    onClick: () => setLocale(opt.key),
  }));

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Language"
        title="Language / 语言"
      >
        <GlobalOutlined />
      </button>
    </Dropdown>
  );
}

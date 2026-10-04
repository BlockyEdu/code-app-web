import { CheckOutlined, GlobalOutlined } from "@ant-design/icons";
import { Dropdown, type MenuProps } from "antd";
import { t } from "../lib/i18n";
import { APP_LOCALES, LOCALE_LABELS, useLocaleStore } from "../lib/locale-store";
import styles from "./LocaleSwitcher.module.scss";

export function LocaleSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const items: MenuProps["items"] = APP_LOCALES.map((key) => ({
    key,
    label: LOCALE_LABELS[key],
    icon:
      locale === key ? <CheckOutlined /> : <span style={{ width: 14, display: "inline-block" }} />,
    onClick: () => setLocale(key),
  }));

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={t("locale.switcherAria")}
        title={t("locale.switcherTitle")}
      >
        <GlobalOutlined />
      </button>
    </Dropdown>
  );
}

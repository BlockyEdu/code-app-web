import { CheckOutlined, GlobalOutlined } from "@ant-design/icons";
import { Dropdown, type MenuProps } from "antd";
import { t } from "../lib/i18n";
import { APP_LOCALES, LOCALE_LABELS, useLocaleStore } from "../lib/locale-store";
import styles from "./LocaleSwitcher.module.scss";

function buttonClass(labeled: boolean, light: boolean): string {
  if (labeled) return light ? styles.chipLight : styles.chip;
  return light ? styles.iconBtnLight : styles.iconBtn;
}

/** `labeled` shows the current language next to the icon. `light` is for site pages. */
export function LocaleSwitcher({
  labeled = false,
  light = false,
}: {
  labeled?: boolean;
  light?: boolean;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const current = LOCALE_LABELS[locale];

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
        className={buttonClass(labeled, light)}
        aria-label={`${t("locale.switcherAria")}, ${current}`}
        title={t("locale.switcherTitle")}
      >
        <GlobalOutlined />
        {labeled ? <span>{current}</span> : null}
      </button>
    </Dropdown>
  );
}

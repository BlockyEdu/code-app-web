import type { ReactNode } from "react";
import styles from "./SectionHead.module.scss";

interface SectionHeadProps {
  title: string;
  lead?: string;
  id?: string;
  actions?: ReactNode;
}

export function SectionHead({ title, lead, id, actions }: SectionHeadProps) {
  return (
    <header className={styles.head}>
      <div className={styles.copy}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

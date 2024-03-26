import { FlexHorizontal } from "@shared/ui/Grid";
import styles from "./Footer.module.scss";
import { ExternalLink } from "@shared/ui/ExternalLink";

export const Footer = () => {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <FlexHorizontal>
          <ExternalLink href="https://github.com/sa1i/justsmartcontracts">
            GitHub
          </ExternalLink>
        </FlexHorizontal>
      </div>
    </div>
  );
};

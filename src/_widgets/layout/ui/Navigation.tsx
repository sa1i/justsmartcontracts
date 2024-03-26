type TPageLink = {
  path: string;
  title: string;
};

type TProps = {
  pages: TPageLink[];
};

import Link from "next/link";
import styles from "./Navigation.module.scss";
import cn from "classnames";

export const Navigation = ({ pages }: TProps) => {
  // get current path
  const currentPath = window.location.pathname;
  return (
    <div className={styles.root}>
      {pages.map(({ path, title }) => (
        <Link
          key={path}
          href={path}
          className={cn(styles.pathItem, {
            [styles.selected]: path == currentPath,
          })}
        >
          {title}
        </Link>
      ))}
    </div>
  );
};

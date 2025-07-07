import { ReactNode } from "react";
import { AddressIcon } from "@shared/ui/AddressIcon";
import { TContract } from "../model/types";
import { AddressLinkShort } from "@shared/ui/AddressLink";

import styles from "./SmallCard.module.scss";

type TProps = {
  contract: TContract;
  extra?: ReactNode;
};

export const SmallCard = ({ contract, extra }: TProps) => {
  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <AddressIcon address={contract.address} size="small" />
        {extra && <div>{extra}</div>}
      </div>
      <p className={styles.title}>{contract.name}</p>
      <div className={styles.address}>
        <AddressLinkShort address={contract.address} />
      </div>
    </div>
  );
};

import { ReactNode } from "react";
import { AddressIcon } from "@shared/ui/AddressIcon";
import { ExternalLink } from "@shared/ui/ExternalLink";
import { getAddressUrl } from "@shared/lib/web3";
import { TContract } from "../model/types";

import styles from "./SmallCard.module.scss";
import { shortAddress } from "@shared/lib/web3/address";
import { Tooltip } from "antd";

type TProps = {
  contract: TContract;
  extra?: ReactNode;
};

export const SmallCard = ({ contract, extra }: TProps) => {
  const url = getAddressUrl(contract.chain, contract.address);

  const address = url ? (
    <ExternalLink
      href={getAddressUrl(contract.chain, contract.address)}
      className={styles.address}
    >
      <Tooltip title={contract.address} placement="right">
        {shortAddress(contract.address)}
      </Tooltip>
    </ExternalLink>
  ) : (
    <p className={styles.address}>{contract.address}</p>
  );

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <AddressIcon address={contract.address} size="small" />
        {extra && <div>{extra}</div>}
      </div>
      <p className={styles.title}>{contract.name}</p>
      {address}
    </div>
  );
};

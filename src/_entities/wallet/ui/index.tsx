import { TAddress } from "@shared/lib/web3";
import { AddressIcon } from "@shared/ui/AddressIcon";
import { AddressLink } from "@shared/ui/AddressLink";

import styles from "./WalletCard.module.scss";

type TProps = {
  wallet: TAddress;
};
export const WalletCard = ({ wallet }: TProps) => {
  return (
    <div className={styles.root}>
      <AddressIcon size="small" address={wallet} />
      <AddressLink address={wallet} showCopy={true} />
    </div>
  );
};

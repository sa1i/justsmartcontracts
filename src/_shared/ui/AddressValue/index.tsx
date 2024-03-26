import { getAddressUrl, TAddress } from "@shared/lib/web3";
import { AddressIcon } from "../AddressIcon";
import styles from "./AddressValue.module.scss";
import { chainModel } from "@entities/chain";
import { ExternalLink } from "@shared/ui/ExternalLink";

type TProps = {
  value: TAddress;
};

export const AddressValue = ({ value }: TProps) => {
  const { chain } = chainModel.useCurrentChain();
  return (
    <span className={styles.root}>
      <AddressIcon address={value} size="small" />
      <ExternalLink href={getAddressUrl(chain, value)}>{value}</ExternalLink>
    </span>
  );
};

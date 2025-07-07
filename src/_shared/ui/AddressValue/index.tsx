import { TAddress } from "@shared/lib/web3";
import { AddressIcon } from "../AddressIcon";
import styles from "./AddressValue.module.scss";
import { AddressLinkShort } from "../AddressLink";

type TProps = {
  value: TAddress;
};

export const AddressValue = ({ value }: TProps) => {
  return (
    <span className={styles.root}>
      <AddressIcon address={value} size="small" />
      <AddressLinkShort address={value} />
    </span>
  );
};

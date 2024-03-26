import { isAddress } from "viem";

export type THexString = `0x${string}`;

export type TAddress = THexString;

export const sameAddress = (a: TAddress, b: TAddress) =>
  a.toLowerCase() === b.toLowerCase();

export const isEvmAddress = (a: string): a is TAddress => {
  return isAddress(a);
};

export const shortAddress = (address: TAddress) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

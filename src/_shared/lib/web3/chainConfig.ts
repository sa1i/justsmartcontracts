import { Chain } from "./chains";
import { toWagmiChain } from "./wagmi";

type TChainConfig = {
  name: string;
  explorer: string;
  testnet?: boolean;
};

export const getChainConfig = (chain: Chain): TChainConfig => {
  const wagmiChain = toWagmiChain(chain);
  // console.log("==> chain:", chain);
  // console.log("--> wagmiChain:", wagmiChain);

  return {
    name: wagmiChain?.name ?? "",
    explorer: wagmiChain?.blockExplorers?.etherscan?.url ?? "",
    testnet: wagmiChain?.network?.includes("test") ?? false,
  };
};

export const getTxUrl = (chain: Chain, txHash: string) => {
  return `${getChainConfig(chain).explorer}tx/${txHash}`;
};

export const getAddressUrl = (chain: Chain, address: string) => {
  const explorer = getChainConfig(chain).explorer;
  return explorer ? `${explorer}/address/${address}` : "";
};

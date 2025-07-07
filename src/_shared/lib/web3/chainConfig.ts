import { NetworkConfig } from "../chainlist/types";

type TChainConfig = {
  name: string;
  explorer: string;
  testnet?: boolean;
};

// 已弃用：使用基于 NetworkConfig 的函数
export const getChainConfig = (chainId: number): TChainConfig => {
  console.warn('getChainConfig is deprecated, use getNetworkConfig instead');
  return {
    name: `Chain ${chainId}`,
    explorer: "",
    testnet: false,
  };
};

// 新的基于 NetworkConfig 的函数
export const getNetworkConfig = (network: NetworkConfig): TChainConfig => {
  return {
    name: network.name,
    explorer: network.blockExplorers?.[0]?.url ?? "",
    testnet: network.testnet ?? false,
  };
};

export const getTxUrl = (network: NetworkConfig, txHash: string) => {
  const explorer = network.blockExplorers?.[0]?.url;
  return explorer ? `${explorer}/tx/${txHash}` : "";
};

export const getAddressUrl = (network: NetworkConfig, address: string) => {
  const explorer = network.blockExplorers?.[0]?.url;
  return explorer ? `${explorer}/address/${address}` : "";
};

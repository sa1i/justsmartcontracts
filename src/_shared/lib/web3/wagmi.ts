import type { Chain as WagmiChain } from "viem";
import { http } from "viem";
import {
  mainnet,
  sepolia,
  arbitrum,
  goerli,
  bsc,
  optimism,
  polygon,
  // zkSync,
  avalanche,
  polygonMumbai,
  cronos,
  // kava,
  manta,
  base,
  // gnosis,
  // celo,
  mantle,
  // fantom,
  // moonbeam,
  linea,
  aurora,
  okc,
  moonriver,
  boba,
  scroll,
} from "viem/chains";

import { Chain } from "./chains";
import { heco } from "@shared/lib/web3/heco-chain";
import { zero } from "@shared/lib/web3/zero-chain";
import { story } from "@shared/lib/web3/story-chain";
import { networkConfigToViemChain } from "../chainlist/adapter";
import type { NetworkConfig } from "../chainlist/types";

const ChainWagmiMap: Record<Chain, WagmiChain> = {
  [Chain.ETHEREUM]: mainnet,
  [Chain.ETH_GOERLI]: goerli,
  [Chain.OPTIMISM]: optimism,
  [Chain.BSC]: bsc,
  [Chain.ARBITRUM]: arbitrum,
  [Chain.POLYGON]: polygon,
  // [Chain.ZKSYNC]: zkSync,
  [Chain.AVALANCHE]: avalanche,

  [Chain.ETH_SEPOLIA]: sepolia,
  [Chain.POLYGON_MUMBAI]: polygonMumbai,
  [Chain.BASE]: base,
  [Chain.CRONOS]: cronos,
  [Chain.SCROLL]: scroll,
  // [Chain.KAVA]: kava,
  [Chain.MANTA]: manta,
  // [Chain.GNOSIS]: gnosis,
  // [Chain.CELO]: celo,
  [Chain.MANTLE]: mantle,
  // [Chain.FANTOM]: fantom,
  // [Chain.MOONBEAM]: moonbeam,
  [Chain.LINEA]: linea,
  // [Chain.METIS]: metis,
  // [Chain.ASTAR]: astar,
  // [Chain.CANTO]: canto,
  [Chain.AURORA]: aurora,
  // [Chain.TELOS]: telos,
  [Chain.OKXCHAIN]: okc,
  [Chain.MOONRIVER]: moonriver,
  [Chain.BOBA]: boba,
  [Chain.HECO]: heco,
  [Chain.ZERO]: zero,
  [Chain.STORY]: story,
};

export const toWagmiChain = (chain: Chain) => ChainWagmiMap[chain];

/**
 * 获取所有支持的 Wagmi 链
 * 这个函数返回所有在 ChainWagmiMap 中定义的链，确保 wagmi 配置包含所有支持的链
 */
export const getAllSupportedWagmiChains = (): WagmiChain[] => {
  return Object.values(ChainWagmiMap);
};

/**
 * 获取所有支持的链的传输配置
 * 为每个支持的链创建默认的传输配置
 */
export const getAllSupportedTransports = (): Record<number, any> => {
  const transports: Record<number, any> = {};

  Object.entries(ChainWagmiMap).forEach(([chainEnum, wagmiChain]) => {
    const chainId = parseInt(chainEnum);
    // 为每个链创建默认的 HTTP 传输
    const defaultRpc = wagmiChain.rpcUrls.default.http[0];
    if (defaultRpc) {
      transports[chainId] = http(defaultRpc);
    }
  });

  return transports;
};

/**
 * 动态链映射缓存
 */
const DynamicChainCache = new Map<number, WagmiChain>();

/**
 * 从网络配置创建 Wagmi 链并缓存
 */
export const createWagmiChainFromNetwork = (
  network: NetworkConfig
): WagmiChain => {
  const cached = DynamicChainCache.get(network.chainId);
  if (cached) {
    return cached;
  }

  const wagmiChain = networkConfigToViemChain(network);
  DynamicChainCache.set(network.chainId, wagmiChain);
  return wagmiChain;
};

/**
 * 获取允许合约交互的链列表
 */
export const getAllowedContractChains = (
  networks: NetworkConfig[],
  getNetworkPermission: (chainId: number) => any,
  getNetworkContractStatus: (
    network: NetworkConfig,
    permission: any
  ) => { allowed: boolean }
): WagmiChain[] => {
  const allowedChains: WagmiChain[] = [];

  for (const network of networks) {
    const permission = getNetworkPermission(network.chainId);
    const status = getNetworkContractStatus(network, permission);

    if (status.allowed) {
      const wagmiChain = createWagmiChainFromNetwork(network);
      allowedChains.push(wagmiChain);
    }
  }

  return allowedChains;
};

/**
 * 清除动态链缓存
 */
export const clearDynamicChainCache = () => {
  DynamicChainCache.clear();
};

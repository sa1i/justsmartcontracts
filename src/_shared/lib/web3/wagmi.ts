import type { Chain as WagmiChain } from "viem";
import { http } from "viem";
import { networkConfigToViemChain } from "../chainlist/adapter";
import type { NetworkConfig } from "../chainlist/types";

// 移除所有预置网络映射，现在完全使用动态网络配置

/**
 * 从网络配置列表获取所有支持的 Wagmi 链
 */
export const getAllSupportedWagmiChains = (networks: NetworkConfig[]): WagmiChain[] => {
  if (!networks || networks.length === 0) {
    return [];
  }
  
  try {
    return networks
      .map(network => networkConfigToViemChain(network))
      .filter((chain): chain is WagmiChain => chain !== null);
  } catch (error) {
    console.error('Error creating wagmi chains:', error);
    return [];
  }
};

/**
 * 从网络配置列表获取传输配置
 */
export const getAllSupportedTransports = (networks: NetworkConfig[]): Record<number, any> => {
  const transports: Record<number, any> = {};

  if (!networks || networks.length === 0) {
    return transports;
  }

  try {
    networks.forEach(network => {
      if (network && network.rpcUrls && network.rpcUrls.length > 0) {
        // 使用网络的第一个有效 RPC 作为默认传输
        const validRpc = network.rpcUrls.find(url => url && typeof url === 'string');
        if (validRpc) {
          transports[network.chainId] = http(validRpc);
        }
      }
    });
  } catch (error) {
    console.error('Error creating transports:', error);
  }

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
): WagmiChain | null => {
  const cached = DynamicChainCache.get(network.chainId);
  if (cached) {
    return cached;
  }

  const wagmiChain = networkConfigToViemChain(network);
  if (wagmiChain) {
    DynamicChainCache.set(network.chainId, wagmiChain);
  }
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
      if (wagmiChain) {
        allowedChains.push(wagmiChain);
      }
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

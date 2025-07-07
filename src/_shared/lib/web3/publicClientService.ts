import { createPublicClient, http, PublicClient } from "viem";
import { useNetworkSelection } from "../chainlist/store";
import { networkConfigToViemChain } from "../chainlist/adapter";
import { validateRpcUrl } from "../rpc/validation";
import { useMemo } from "react";
import type { NetworkConfig } from "../chainlist/types";

/**
 * 全局钱包服务 - 创建基于当前选择网络的 PublicClient
 * 避免使用 viem 内置的默认链配置，确保使用正确的 RPC
 */
export class PublicClientService {
  private static instance: PublicClientService | null = null;
  private clientCache = new Map<string, PublicClient>();

  static getInstance(): PublicClientService {
    if (!this.instance) {
      this.instance = new PublicClientService();
    }
    return this.instance;
  }

  /**
   * 创建基于网络配置的 PublicClient
   */
  createClient(
    network: NetworkConfig,
    rpcs: Array<{ url: string; name: string }>,
    selectedRpcIndex: number = 0
  ): PublicClient {
    const cacheKey = `${network.chainId}-${selectedRpcIndex}`;
    
    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey)!;
    }

    const viemChain = networkConfigToViemChain(network);
    const selectedRpc = rpcs[selectedRpcIndex] || rpcs[0];

    // 确定使用的 RPC URL
    let rpcUrl = selectedRpc?.url;
    if (!rpcUrl && network.rpcUrls.length > 0) {
      // 回退到网络配置的第一个 RPC
      rpcUrl = network.rpcUrls[0];
    }

    if (!rpcUrl) {
      throw new Error(`No RPC URL available for network ${network.name}`);
    }

    // 验证 RPC URL
    const validation = validateRpcUrl(rpcUrl);
    if (!validation.isValid) {
      throw new Error(`Invalid RPC URL: ${validation.error}`);
    }

    console.log(`Creating PublicClient for ${network.name} with RPC: ${rpcUrl}`);

    const client = createPublicClient({
      chain: viemChain,
      transport: http(rpcUrl),
    });

    this.clientCache.set(cacheKey, client);
    return client;
  }

  /**
   * 创建带有 RPC 故障转移的 PublicClient
   */
  async createClientWithFallback(
    network: NetworkConfig,
    rpcs: Array<{ url: string; name: string }>,
    selectedRpcIndex: number = 0
  ): Promise<PublicClient> {
    const viemChain = networkConfigToViemChain(network);
    
    // 构建所有可用的 RPC 列表
    const allRpcs = [
      ...rpcs,
      ...network.rpcUrls.map((url) => ({ url, name: "Default" })),
    ];

    // 先尝试选择的 RPC
    const selectedRpc = allRpcs[selectedRpcIndex] || allRpcs[0];
    if (selectedRpc) {
      try {
        const client = createPublicClient({
          chain: viemChain,
          transport: http(selectedRpc.url),
        });

        // 测试连接
        await client.getBlockNumber();
        console.log(`Successfully connected to ${network.name} via ${selectedRpc.url}`);
        return client;
      } catch (error) {
        console.warn(`Primary RPC ${selectedRpc.url} failed:`, error);
      }
    }

    // 尝试其他 RPC
    for (const rpc of allRpcs) {
      if (rpc.url === selectedRpc?.url) continue; // 跳过已经失败的 RPC

      const validation = validateRpcUrl(rpc.url);
      if (!validation.isValid) {
        console.warn(`Invalid RPC URL ${rpc.url}:`, validation.error);
        continue;
      }

      try {
        const client = createPublicClient({
          chain: viemChain,
          transport: http(rpc.url),
        });

        // 测试连接
        await client.getBlockNumber();
        console.log(`Fallback connection successful to ${network.name} via ${rpc.url}`);
        return client;
      } catch (error) {
        console.warn(`RPC ${rpc.url} failed:`, error);
        continue;
      }
    }

    throw new Error(`All RPC endpoints failed for network ${network.name}`);
  }

  /**
   * 清除客户端缓存
   */
  clearCache(): void {
    this.clientCache.clear();
  }

  /**
   * 移除特定网络的缓存
   */
  clearNetworkCache(chainId: number): void {
    const keysToDelete = Array.from(this.clientCache.keys()).filter(key => 
      key.startsWith(`${chainId}-`)
    );
    keysToDelete.forEach(key => this.clientCache.delete(key));
  }
}

/**
 * React Hook 用于获取当前选择网络的 PublicClient
 */
export const useSelectedNetworkPublicClient = () => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } = useNetworkSelection();

  const publicClient = useMemo(() => {
    if (!selectedNetwork) {
      return null;
    }

    try {
      const rpcs = getCurrentNetworkRpcs();
      const service = PublicClientService.getInstance();
      return service.createClient(selectedNetwork, rpcs, selectedRpcIndex);
    } catch (error) {
      console.error("Failed to create PublicClient:", error);
      return null;
    }
  }, [selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex]);

  return publicClient;
};

/**
 * React Hook 用于获取带故障转移的 PublicClient
 */
export const useSelectedNetworkPublicClientWithFallback = () => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } = useNetworkSelection();

  const createClient = useMemo(() => {
    if (!selectedNetwork) {
      return null;
    }

    return async () => {
      const rpcs = getCurrentNetworkRpcs();
      const service = PublicClientService.getInstance();
      return service.createClientWithFallback(selectedNetwork, rpcs, selectedRpcIndex);
    };
  }, [selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex]);

  return createClient;
};

/**
 * 执行带有 RPC 故障转移的操作
 */
export const executeWithRpcFallback = async <T>(
  network: NetworkConfig,
  rpcs: Array<{ url: string; name: string }>,
  operation: (client: PublicClient) => Promise<T>,
  selectedRpcIndex: number = 0
): Promise<T> => {
  const service = PublicClientService.getInstance();
  const client = await service.createClientWithFallback(network, rpcs, selectedRpcIndex);
  return operation(client);
};
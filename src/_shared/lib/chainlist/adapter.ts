import { defineChain, Chain as WagmiChain } from "viem";
import { NetworkConfig, NetworkPermission } from "./types";

/**
 * 将 NetworkConfig 转换为 Viem Chain 定义
 */
export function networkConfigToViemChain(network: NetworkConfig): WagmiChain | null {
  if (!network || !network.chainId || !network.name) {
    console.warn('Invalid network config:', network);
    return null;
  }

  try {
    // 验证必要的字段
    if (typeof network.chainId !== 'number' || network.chainId <= 0) {
      console.warn('Invalid chainId:', network.chainId);
      return null;
    }

    if (!network.rpcUrls || !Array.isArray(network.rpcUrls) || network.rpcUrls.length === 0) {
      console.warn('No valid RPC URLs for network:', network.name);
      return null;
    }

    const httpRpcs = network.rpcUrls.filter((url) => url && typeof url === 'string' && url.startsWith("http"));
    const wsRpcs = network.rpcUrls.filter((url) => url && typeof url === 'string' && url.startsWith("ws"));

    if (httpRpcs.length === 0) {
      console.warn('No HTTP RPC URLs found for network:', network.name);
      return null;
    }

    const chainConfig = {
      id: network.chainId,
      name: network.name,
      network: network.shortName || network.name.toLowerCase(),
      nativeCurrency: {
        decimals: network.nativeCurrency?.decimals || 18,
        name: network.nativeCurrency?.name || "ETH",
        symbol: network.nativeCurrency?.symbol || "ETH",
      },
      rpcUrls: {
        default: {
          http: httpRpcs,
          webSocket: wsRpcs,
        },
        public: {
          http: httpRpcs,
          webSocket: wsRpcs,
        },
      },
      blockExplorers: network.blockExplorers && network.blockExplorers.length > 0
        ? {
            default: {
              name: network.blockExplorers[0]?.name || "Explorer",
              url: network.blockExplorers[0]?.url || "",
            },
          }
        : undefined,
      testnet: network.testnet || false,
    };

    // 验证 chainConfig 在传给 defineChain 之前
    if (typeof chainConfig.id !== 'number' || chainConfig.id <= 0) {
      console.error('Invalid chainConfig.id before defineChain:', chainConfig.id);
      return null;
    }

    const result = defineChain(chainConfig);
    
    // 验证结果
    if (!result || typeof result.id === 'undefined' || result.id !== network.chainId) {
      console.error('defineChain returned invalid result:', {
        input: chainConfig,
        output: result,
        expectedId: network.chainId
      });
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error converting network config to viem chain:', error, network);
    return null;
  }
}

/**
 * 将 NetworkConfig 映射到链 ID（移除了预置枚举映射）
 */
export function mapNetworkToChainEnum(network: NetworkConfig): number {
  // 现在直接返回 chainId，不再映射到预置枚举
  return network.chainId;
}

/**
 * 检查网络是否被当前系统支持（现在所有网络都被支持）
 */
export function isNetworkSupported(network: NetworkConfig): boolean {
  // 现在所有有效的网络配置都被支持
  return network.chainId > 0 && network.rpcUrls.length > 0;
}

/**
 * 检查网络是否被用户允许进行合约交互
 * 考虑系统默认支持 + 用户自定义权限
 */
export function isNetworkAllowedForContracts(
  network: NetworkConfig,
  userPermission?: NetworkPermission
): boolean {
  // 如果用户有自定义权限设置，优先使用用户设置
  if (userPermission?.isUserOverride) {
    return userPermission.allowContractInteraction;
  }

  // 否则使用系统默认支持状态
  return isNetworkSupported(network);
}

/**
 * 获取网络的合约交互状态信息
 */
export function getNetworkContractStatus(
  network: NetworkConfig,
  userPermission?: NetworkPermission
): {
  allowed: boolean;
  source: "system" | "user";
  reason?: string;
} {
  if (userPermission?.isUserOverride) {
    return {
      allowed: userPermission.allowContractInteraction,
      source: "user",
      reason: userPermission.reason,
    };
  }

  const systemSupported = isNetworkSupported(network);
  return {
    allowed: systemSupported,
    source: "system",
    reason: systemSupported ? undefined : "Network not supported by system",
  };
}

/**
 * 获取网络的显示信息
 */
export function getNetworkDisplayInfo(network: NetworkConfig) {
  return {
    name: network.name,
    shortName: network.shortName,
    chainId: network.chainId,
    symbol: network.nativeCurrency.symbol,
    explorer: network.blockExplorers?.[0]?.url || "",
    testnet: network.testnet,
    icon: network.icon,
  };
}

/**
 * 生成网络的唯一标识符
 */
export function getNetworkKey(network: NetworkConfig): string {
  return `${network.chainId}-${network.shortName}`;
}

/**
 * 验证 RPC URL 是否有效
 */
export async function validateRpcUrl(
  url: string,
  chainId: number
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const returnedChainId = parseInt(data.result, 16);

    return returnedChainId === chainId;
  } catch (error) {
    console.warn("RPC validation failed:", error);
    return false;
  }
}

/**
 * 格式化网络名称用于显示
 */
export function formatNetworkName(network: NetworkConfig): string {
  if (network.testnet) {
    return `${network.name} (Testnet)`;
  }
  return network.name;
}

/**
 * 获取网络的风险等级
 */
export function getNetworkRiskLevel(
  network: NetworkConfig
): "low" | "medium" | "high" {
  if (network.redFlags && network.redFlags.length > 0) {
    return "high";
  }

  if (network.testnet) {
    return "medium";
  }

  // 检查是否是知名网络
  const knownNetworks = [1, 137, 56, 42161, 10, 43114, 8453]; // 主要网络的 chainId
  if (knownNetworks.includes(network.chainId)) {
    return "low";
  }

  return "medium";
}

/**
 * 比较两个网络是否相同
 */
export function isSameNetwork(
  network1: NetworkConfig,
  network2: NetworkConfig
): boolean {
  return (
    network1.chainId === network2.chainId &&
    network1.shortName === network2.shortName
  );
}

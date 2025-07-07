import { defineChain } from "viem";
import { Chain as WagmiChain } from "wagmi";
import { NetworkConfig, NetworkPermission } from "./types";
import { Chain } from "../web3/chains";

/**
 * 将 NetworkConfig 转换为 Viem Chain 定义
 */
export function networkConfigToViemChain(network: NetworkConfig): WagmiChain {
  return defineChain({
    id: network.chainId,
    name: network.name,
    network: network.shortName,
    nativeCurrency: {
      decimals: network.nativeCurrency.decimals,
      name: network.nativeCurrency.name,
      symbol: network.nativeCurrency.symbol,
    },
    rpcUrls: {
      default: {
        http: network.rpcUrls.filter((url) => url.startsWith("http")),
        webSocket: network.rpcUrls.filter((url) => url.startsWith("ws")),
      },
      public: {
        http: network.rpcUrls.filter((url) => url.startsWith("http")),
        webSocket: network.rpcUrls.filter((url) => url.startsWith("ws")),
      },
    },
    blockExplorers: network.blockExplorers
      ? {
          default: {
            name: network.blockExplorers[0]?.name || "Explorer",
            url: network.blockExplorers[0]?.url || "",
          },
          etherscan: network.blockExplorers.find(
            (e) => e.standard === "EIP3091"
          )
            ? {
                name: network.blockExplorers.find(
                  (e) => e.standard === "EIP3091"
                )!.name,
                url: network.blockExplorers.find(
                  (e) => e.standard === "EIP3091"
                )!.url,
              }
            : undefined,
        }
      : undefined,
    testnet: network.testnet,
  });
}

/**
 * 尝试将 NetworkConfig 映射到现有的 Chain 枚举
 */
export function mapNetworkToChainEnum(network: NetworkConfig): Chain | null {
  // 根据 chainId 映射到现有的 Chain 枚举
  const chainIdMap: Record<number, Chain> = {
    1: Chain.ETHEREUM,
    5: Chain.ETH_GOERLI,
    10: Chain.OPTIMISM,
    56: Chain.BSC,
    137: Chain.POLYGON,
    42161: Chain.ARBITRUM,
    43114: Chain.AVALANCHE,
    11155111: Chain.ETH_SEPOLIA,
    80001: Chain.POLYGON_MUMBAI,
    8453: Chain.BASE,
    25: Chain.CRONOS,
    534352: Chain.SCROLL,
    169: Chain.MANTA,
    5000: Chain.MANTLE,
    59144: Chain.LINEA,
    1313161554: Chain.AURORA,
    66: Chain.OKXCHAIN,
    1285: Chain.MOONRIVER,
    288: Chain.BOBA,
    128: Chain.HECO,
    543210: Chain.ZERO,
    1514: Chain.STORY,
  };

  return chainIdMap[network.chainId] || null;
}

/**
 * 检查网络是否被当前系统支持
 */
export function isNetworkSupported(network: NetworkConfig): boolean {
  return mapNetworkToChainEnum(network) !== null;
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

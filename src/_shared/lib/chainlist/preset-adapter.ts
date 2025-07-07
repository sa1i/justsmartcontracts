import { ChainlistChain, NetworkConfig, ChainlistRpcEndpoint } from "./types";
import presetNetworks from "./preset-networks.json";

/**
 * 从 chainlist 数据转换为内部 NetworkConfig 格式
 */
export function convertChainlistToNetworkConfig(chainData: ChainlistChain): NetworkConfig {
  // 处理 RPC URLs - 支持字符串和对象格式
  const rpcUrls: string[] = chainData.rpc
    .map((rpc) => {
      if (typeof rpc === "string") {
        return rpc;
      } else if (typeof rpc === "object" && rpc.url) {
        return rpc.url;
      }
      return null;
    })
    .filter((url): url is string => url !== null && url.startsWith("http"));

  // 检查是否为测试网
  const isTestnet = 
    chainData.name.toLowerCase().includes("testnet") ||
    chainData.name.toLowerCase().includes("test") ||
    chainData.shortName.toLowerCase().includes("test") ||
    chainData.chain.toLowerCase().includes("test");

  return {
    chainId: chainData.chainId,
    name: chainData.name,
    shortName: chainData.shortName,
    chain: chainData.chain,
    nativeCurrency: chainData.nativeCurrency,
    rpcUrls,
    blockExplorers: chainData.explorers || [],
    faucets: chainData.faucets || [],
    infoURL: chainData.infoURL || "",
    icon: chainData.icon,
    testnet: isTestnet,
    status: chainData.status,
    redFlags: chainData.redFlags,
  };
}

/**
 * 获取预置的网络配置列表
 */
export function getPresetNetworks(): NetworkConfig[] {
  try {
    // 将预置数据转换为 NetworkConfig 格式
    const networks = (presetNetworks as ChainlistChain[])
      .map(convertChainlistToNetworkConfig)
      .filter((network) => {
        // 过滤掉没有有效 RPC 的网络
        return network.rpcUrls.length > 0 && network.chainId > 0;
      });

    return networks;
  } catch (error) {
    console.error("Error loading preset networks:", error);
    return [];
  }
}

/**
 * 获取以太坊主网的预置配置
 */
export function getEthereumMainnetConfig(): NetworkConfig | null {
  try {
    const ethereumData = (presetNetworks as ChainlistChain[]).find(
      (chain) => chain.chainId === 1
    );
    
    if (!ethereumData) {
      console.error("Ethereum mainnet not found in preset data");
      return null;
    }

    return convertChainlistToNetworkConfig(ethereumData);
  } catch (error) {
    console.error("Error loading Ethereum mainnet config:", error);
    return null;
  }
}

/**
 * 根据 chainId 获取预置网络配置
 */
export function getPresetNetworkByChainId(chainId: number): NetworkConfig | null {
  try {
    const chainData = (presetNetworks as ChainlistChain[]).find(
      (chain) => chain.chainId === chainId
    );
    
    if (!chainData) {
      return null;
    }

    return convertChainlistToNetworkConfig(chainData);
  } catch (error) {
    console.error(`Error loading preset network for chainId ${chainId}:`, error);
    return null;
  }
}

/**
 * 获取主要网络的预置配置（排除测试网）
 */
export function getMainnetPresetNetworks(): NetworkConfig[] {
  return getPresetNetworks().filter((network) => !network.testnet);
}

/**
 * 获取测试网的预置配置
 */
export function getTestnetPresetNetworks(): NetworkConfig[] {
  return getPresetNetworks().filter((network) => network.testnet);
}
import {
  ChainlistResponse,
  ChainlistChain,
  NetworkConfig,
  RpcConfig,
} from "./types";

const CHAINLIST_API_URL = "https://chainlist.org/rpcs.json";
const CACHE_KEY = "chainlist_networks";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: ChainlistResponse;
  timestamp: number;
}

/**
 * 从 chainlist.org 获取网络数据
 */
export async function fetchChainlistData(): Promise<ChainlistResponse> {
  try {
    // 检查缓存
    const cached = getCachedData();
    if (cached && !isCacheExpired(cached.timestamp)) {
      return cached.data;
    }

    // 从 API 获取数据
    const response = await fetch(CHAINLIST_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch chainlist data: ${response.statusText}`);
    }

    const data: ChainlistResponse = await response.json();

    // 缓存数据
    setCachedData(data);

    return data;
  } catch (error) {
    console.error("Error fetching chainlist data:", error);

    // 如果有缓存数据，即使过期也返回
    const cached = getCachedData();
    if (cached) {
      return cached.data;
    }

    throw error;
  }
}

/**
 * 将 Chainlist 数据转换为内部网络配置格式
 */
export function convertChainlistToNetworkConfig(
  chainlistData: ChainlistResponse
): NetworkConfig[] {
  return Object.values(chainlistData)
    .filter((chain) => chain.chainId && chain.name && chain.rpc.length > 0)
    .map((chain) => convertSingleChain(chain))
    .sort((a, b) => {
      // 主网优先，然后按 chainId 排序
      if (a.testnet !== b.testnet) {
        return a.testnet ? 1 : -1;
      }
      return a.chainId - b.chainId;
    });
}

/**
 * 转换单个链配置
 */
function convertSingleChain(chain: ChainlistChain): NetworkConfig {
  const isTestnet = isTestnetChain(chain);

  // 处理 RPC URLs - 支持字符串和对象格式
  const rpcUrls: string[] = [];
  if (Array.isArray(chain.rpc)) {
    for (const rpc of chain.rpc) {
      if (typeof rpc === "string") {
        // 直接是字符串格式
        if (rpc.startsWith("http")) {
          rpcUrls.push(rpc);
        }
      } else if (rpc && typeof rpc === "object" && rpc.url) {
        // 对象格式，包含 url 属性
        if (typeof rpc.url === "string" && rpc.url.startsWith("http")) {
          rpcUrls.push(rpc.url);
        }
      } else {
        // 调试信息：记录无法处理的 RPC 格式
        console.warn(
          `Unhandled RPC format for chain ${chain.name} (${chain.chainId}):`,
          rpc
        );
      }
    }
  }

  // 调试信息：记录转换结果
  if (rpcUrls.length === 0) {
    console.warn(
      `No valid RPC URLs found for chain ${chain.name} (${chain.chainId}). Original RPC data:`,
      chain.rpc
    );
  }

  return {
    chainId: chain.chainId,
    name: chain.name,
    shortName: chain.shortName,
    chain: chain.chain,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls,
    blockExplorers: chain.explorers || [],
    faucets: chain.faucets || [],
    infoURL: chain.infoURL,
    icon: chain.icon,
    testnet: isTestnet,
    status: chain.status,
    redFlags: chain.redFlags,
  };
}

/**
 * 判断是否为测试网
 */
function isTestnetChain(chain: ChainlistChain): boolean {
  const testnetKeywords = [
    "test",
    "testnet",
    "devnet",
    "goerli",
    "sepolia",
    "mumbai",
    "fuji",
    "chapel",
    "rinkeby",
    "ropsten",
    "kovan",
    "dev",
    "staging",
  ];

  const nameAndShortName = `${chain.name} ${chain.shortName}`.toLowerCase();
  return testnetKeywords.some((keyword) => nameAndShortName.includes(keyword));
}

/**
 * 为网络生成 RPC 配置
 */
export function generateRpcConfigs(network: NetworkConfig): RpcConfig[] {
  const configs = network.rpcUrls
    .map((url, index) => {
      // 确保 url 是字符串

      // console.log(`network config :`, network);
      // console.log(`network config url:`, url);
      const urlString = url;
      if (typeof urlString !== "string") {
        console.error(
          `Invalid RPC URL type for ${network.name} at index ${index}:`,
          url,
          typeof url
        );
        return null;
      }

      return {
        url: urlString,
        name: getRpcName(url, index),
        isDefault: index === 0,
        isCustom: false,
      };
    })
    .filter(Boolean) as RpcConfig[];

  return configs;
}

/**
 * 根据 RPC URL 生成名称
 */
function getRpcName(url: string, index: number): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 提取主要域名
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const mainDomain = parts[parts.length - 2];
      return `${mainDomain.charAt(0).toUpperCase()}${mainDomain.slice(1)}`;
    }

    return `RPC ${index + 1}`;
  } catch {
    return `RPC ${index + 1}`;
  }
}

/**
 * 搜索网络
 */
export function searchNetworks(
  networks: NetworkConfig[],
  query: string
): NetworkConfig[] {
  if (!query.trim()) {
    return networks;
  }

  const searchTerm = query.toLowerCase();

  return networks.filter((network) => {
    return (
      network.name.toLowerCase().includes(searchTerm) ||
      network.shortName.toLowerCase().includes(searchTerm) ||
      network.chain.toLowerCase().includes(searchTerm) ||
      network.chainId.toString().includes(searchTerm) ||
      network.nativeCurrency.symbol.toLowerCase().includes(searchTerm)
    );
  });
}

/**
 * 按类型过滤网络
 */
export function filterNetworksByType(
  networks: NetworkConfig[],
  showTestnets: boolean
): NetworkConfig[] {
  return networks.filter((network) => showTestnets || !network.testnet);
}

// 缓存相关函数
function getCachedData(): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedData(data: ChainlistResponse): void {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to cache chainlist data:", error);
  }
}

function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_DURATION;
}

/**
 * 清除缓存
 */
export function clearChainlistCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn("Failed to clear chainlist cache:", error);
  }
}

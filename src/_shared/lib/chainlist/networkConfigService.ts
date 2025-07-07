import { NetworkConfig } from "./types";

const STORAGE_KEY = "network_config_cache";
const LAST_UPDATE_KEY = "network_config_last_update";
const DEFAULT_NETWORKS_URL = "/networks/default-networks.json";
const CHAINLIST_URL = "https://chainlist.org/rpcs.json";

// 缓存过期时间（24小时）
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface NetworkConfigCache {
  networks: NetworkConfig[];
  lastUpdate: number;
  source: "default" | "chainlist" | "mixed";
}

/**
 * 网络配置管理服务
 */
export class NetworkConfigService {
  private static instance: NetworkConfigService;
  private cache: NetworkConfigCache | null = null;

  static getInstance(): NetworkConfigService {
    if (!NetworkConfigService.instance) {
      NetworkConfigService.instance = new NetworkConfigService();
    }
    return NetworkConfigService.instance;
  }

  /**
   * 获取网络配置
   * 优先级：缓存 -> Chainlist -> 默认配置
   */
  async getNetworkConfig(): Promise<NetworkConfigCache> {
    // 检查内存缓存
    if (this.cache && this.isCacheValid(this.cache)) {
      return this.cache;
    }

    // 检查本地存储缓存
    const storedCache = this.getStoredCache();
    if (storedCache && this.isCacheValid(storedCache)) {
      this.cache = storedCache;
      return storedCache;
    }

    // 尝试从Chainlist获取最新数据
    try {
      const chainlistData = await this.fetchFromChainlist();
      const config: NetworkConfigCache = {
        networks: chainlistData,
        lastUpdate: Date.now(),
        source: "chainlist",
      };

      this.saveToStorage(config);
      this.cache = config;
      return config;
    } catch (error) {
      console.warn(
        "Failed to fetch from Chainlist, falling back to default networks:",
        error
      );
    }

    // 回退到默认网络配置
    const defaultNetworks = await this.loadDefaultNetworks();
    const config: NetworkConfigCache = {
      networks: defaultNetworks,
      lastUpdate: Date.now(),
      source: "default",
    };

    this.saveToStorage(config);
    this.cache = config;
    return config;
  }

  /**
   * 强制更新网络配置
   */
  async forceUpdate(): Promise<NetworkConfigCache> {
    this.clearCache();

    try {
      const chainlistData = await this.fetchFromChainlist();
      const config: NetworkConfigCache = {
        networks: chainlistData,
        lastUpdate: Date.now(),
        source: "chainlist",
      };

      this.saveToStorage(config);
      this.cache = config;
      return config;
    } catch (error) {
      console.error("Failed to force update from Chainlist:", error);
      throw error;
    }
  }

  /**
   * 获取默认网络配置
   */
  async getDefaultNetworks(): Promise<NetworkConfig[]> {
    return this.loadDefaultNetworks();
  }

  /**
   * 更新默认网络配置
   */
  async updateDefaultNetworks(networks: NetworkConfig[]): Promise<void> {
    // 这里可以实现保存到本地存储或发送到服务器
    const config: NetworkConfigCache = {
      networks,
      lastUpdate: Date.now(),
      source: "mixed",
    };

    this.saveToStorage(config);
    this.cache = config;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_UPDATE_KEY);
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cache: NetworkConfigCache): boolean {
    const now = Date.now();
    return now - cache.lastUpdate < CACHE_EXPIRY_MS;
  }

  /**
   * 从本地存储获取缓存
   */
  private getStoredCache(): NetworkConfigCache | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to parse stored network config:", error);
    }
    return null;
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(config: NetworkConfigCache): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to save network config to storage:", error);
    }
  }

  /**
   * 从Chainlist获取数据
   */
  private async fetchFromChainlist(): Promise<NetworkConfig[]> {
    const response = await fetch(CHAINLIST_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Chainlist: ${response.statusText}`);
    }

    const data = await response.json();
    return this.convertChainlistData(data);
  }

  /**
   * 加载默认网络配置
   */
  private async loadDefaultNetworks(): Promise<NetworkConfig[]> {
    try {
      const response = await fetch(DEFAULT_NETWORKS_URL);
      if (!response.ok) {
        throw new Error(
          `Failed to load default networks: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to load default networks:", error);
      // 返回最基本的以太坊配置作为最后的回退
      return this.getFallbackNetworks();
    }
  }

  /**
   * 转换Chainlist数据格式
   */
  private convertChainlistData(chainlistData: any[]): NetworkConfig[] {
    return chainlistData.map((chain) => {
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
        infoURL: chain.infoURL || "",
        testnet: this.isTestnet(chain),
        status: chain.status || "active",
        redFlags: chain.redFlags || [],
      };
    });
  }

  /**
   * 判断是否为测试网
   */
  private isTestnet(chain: any): boolean {
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
    return testnetKeywords.some((keyword) =>
      nameAndShortName.includes(keyword)
    );
  }

  /**
   * 获取最基本的回退网络配置
   */
  private getFallbackNetworks(): NetworkConfig[] {
    return [
      {
        chainId: 1,
        name: "Ethereum Mainnet",
        shortName: "eth",
        chain: "ETH",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [
          "https://ethereum.publicnode.com",
          "https://rpc.ankr.com/eth",
        ],
        blockExplorers: [
          {
            name: "Etherscan",
            url: "https://etherscan.io",
            standard: "EIP3091",
          },
        ],
        faucets: [],
        infoURL: "https://ethereum.org",
        testnet: false,
        status: "active",
      },
    ];
  }
}

// 导出单例实例
export const networkConfigService = NetworkConfigService.getInstance();

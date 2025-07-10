import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metaMask, injected } from "@wagmi/connectors";
import { TWithChildren } from "../props";
import { AlchemyKey } from "../env";
import {
  useNetworkSelection,
  useNetworkPermissions,
  useNetworks,
} from "../chainlist/store";
import {
  networkConfigToViemChain,
  getNetworkContractStatus,
} from "../chainlist/adapter";
import { cleanRpcConfigs, validateRpcUrl } from "../rpc/validation";
import { useMemo, useEffect } from "react";
import {
  getAllowedContractChains,
  createWagmiChainFromNetwork,
  getAllSupportedWagmiChains,
  getAllSupportedTransports,
} from "./wagmi";
import { getEthereumMainnetConfig } from "../chainlist/preset-adapter";

type TProps = TWithChildren & {
  chainId: number;
};

const queryClient = new QueryClient();

const getAlchemyUrl = (chainId: number): string | null => {
  try {
    switch (chainId) {
      case 1: // Ethereum
        return `https://eth-mainnet.alchemyapi.io/v2/${AlchemyKey}`;
      case 5: // Goerli
        return `https://eth-goerli.alchemyapi.io/v2/${AlchemyKey}`;
      case 11155111: // Sepolia
        return `https://eth-sepolia.alchemyapi.io/v2/${AlchemyKey}`;
      case 10: // Optimism
        return `https://opt-mainnet.g.alchemy.com/v2/${AlchemyKey}`;
      case 42161: // Arbitrum
        return `https://arb-mainnet.g.alchemy.com/v2/${AlchemyKey}`;
      case 137: // Polygon
        return `https://polygon-mainnet.g.alchemy.com/v2/${AlchemyKey}`;
      case 80001: // Polygon Mumbai
        return `https://polygon-mumbai.g.alchemy.com/v2/${AlchemyKey}`;
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// 已废弃：使用 AllChainsSupportedWeb3Provider 代替
export const Web3Provider = ({ children, chainId }: TProps) => {
  // 这个 Provider 已被弃用，建议使用 AllChainsSupportedWeb3Provider
  console.warn(
    "Web3Provider is deprecated, use AllChainsSupportedWeb3Provider instead"
  );

  return (
    <AllChainsSupportedWeb3Provider>{children}</AllChainsSupportedWeb3Provider>
  );
};

// 增强版 Web3Provider，使用新的网络选择器
export const EnhancedWeb3Provider = ({ children }: TWithChildren) => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } =
    useNetworkSelection();

  const config = useMemo(() => {
    if (!selectedNetwork) {
      // 如果没有选择网络，使用以太坊主网作为默认
      const defaultChain = defineChain({
        id: 1,
        name: "Ethereum",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: ["https://eth.llamarpc.com"] },
        },
        blockExplorers: {
          default: { name: "Etherscan", url: "https://etherscan.io" },
        },
      });

      return createConfig({
        chains: [defaultChain],
        transports: {
          [defaultChain.id]: http(defaultChain.rpcUrls.default.http[0]),
        },
        connectors: [metaMask(), injected()],
      });
    }

    // 转换选择的网络为 Viem Chain
    const viemChain = networkConfigToViemChain(selectedNetwork);
    if (!viemChain) {
      // 如果转换失败，使用默认链
      const defaultChain = defineChain({
        id: 1,
        name: "Ethereum",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: ["https://eth.llamarpc.com"] },
        },
        blockExplorers: {
          default: { name: "Etherscan", url: "https://etherscan.io" },
        },
      });

      return createConfig({
        chains: [defaultChain],
        transports: {
          [defaultChain.id]: http(defaultChain.rpcUrls.default.http[0]),
        },
        connectors: [metaMask(), injected()],
      });
    }

    // 获取当前网络的 RPC 列表
    const rpcs = getCurrentNetworkRpcs();

    // 构建 RPC 传输配置
    const validRpcs = cleanRpcConfigs(rpcs);
    const rpcUrls = validRpcs.map((rpc) => rpc.url);

    // 调试信息
    console.log("Original RPCs:", rpcs);
    console.log("Valid RPC URLs for transport:", rpcUrls);
    console.log("Selected network:", selectedNetwork);

    const transports =
      rpcUrls.length > 0
        ? fallback(
            rpcUrls.map((url) => {
              const validation = validateRpcUrl(url);
              if (!validation.isValid) {
                console.error("Invalid RPC URL:", validation.error);
                throw new Error(`Invalid RPC URL: ${validation.error}`);
              }
              console.log("Creating transport for URL:", url);
              return http(url);
            })
          )
        : http(viemChain.rpcUrls.default.http[0]);

    return createConfig({
      chains: [viemChain],
      transports: {
        [selectedNetwork.chainId]: transports,
      },
      connectors: [metaMask(), injected()],
    });
  }, [selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

// 动态多链 Web3Provider，支持所有允许合约交互的链
export const DynamicMultiChainWeb3Provider = ({ children }: TWithChildren) => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } =
    useNetworkSelection();
  const { networks } = useNetworks();
  const { getNetworkPermission } = useNetworkPermissions();

  const config = useMemo(() => {
    // 获取所有允许合约交互的链
    const allowedChains = getAllowedContractChains(
      networks,
      getNetworkPermission,
      getNetworkContractStatus
    );

    // 如果没有允许的链，使用默认链
    if (allowedChains.length === 0) {
      const defaultChain = defineChain({
        id: 1,
        name: "Ethereum",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: ["https://eth.llamarpc.com"] },
        },
        blockExplorers: {
          default: { name: "Etherscan", url: "https://etherscan.io" },
        },
      });

      return createConfig({
        chains: [defaultChain],
        transports: {
          [defaultChain.id]: http(defaultChain.rpcUrls.default.http[0]),
        },
        connectors: [metaMask(), injected()],
      });
    }

    // 构建传输配置
    const transports: Record<number, any> = {};

    for (const network of networks) {
      const permission = getNetworkPermission(network.chainId);
      const status = getNetworkContractStatus(network, permission);

      if (status.allowed) {
        // 如果是当前选择的网络，使用用户选择的RPC
        if (selectedNetwork && selectedNetwork.chainId === network.chainId) {
          const rpcs = getCurrentNetworkRpcs();
          const validRpcs = cleanRpcConfigs(rpcs);
          const rpcUrls = validRpcs.map((rpc) => rpc.url);

          console.log(`Multi-network config for ${network.name}:`, rpcUrls);

          transports[network.chainId] =
            rpcUrls.length > 0
              ? fallback(rpcUrls.map((url) => http(url)))
              : http(network.rpcUrls[0] || `https://rpc.ankr.com/eth`);
        } else {
          // 使用网络的默认RPC
          const validUrls = network.rpcUrls.slice(0, 3).filter((url) => {
            const validation = validateRpcUrl(url);
            if (!validation.isValid) {
              console.warn(
                `Invalid RPC URL for ${network.name}:`,
                validation.error
              );
              return false;
            }
            return true;
          });

          transports[network.chainId] =
            validUrls.length > 0
              ? fallback(validUrls.map((url) => http(url)))
              : http(`https://rpc.ankr.com/eth`);
        }
      }
    }

    return createConfig({
      chains: allowedChains as any,
      transports,
      connectors: [metaMask(), injected()],
    });
  }, [
    networks,
    getNetworkPermission,
    selectedNetwork,
    getCurrentNetworkRpcs,
    selectedRpcIndex,
  ]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

// 全链支持的 Web3Provider - 推荐使用
// 包含所有支持的链，避免 "Chain not configured" 错误
export const AllChainsSupportedWeb3Provider = ({ children }: TWithChildren) => {
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();
  const { networks, isLoading, fetchNetworks } = useNetworks();

  // 确保在组件挂载时加载网络数据
  useEffect(() => {
    if (!networks || networks.length === 0) {
      console.log("Fetching networks on mount...");
      fetchNetworks().catch(console.error);
    }
  }, [networks, fetchNetworks]);

  const config = useMemo(() => {
    console.log("Creating wagmi config...", {
      isLoading,
      networksCount: networks?.length,
      selectedNetwork: selectedNetwork?.name,
    });

    try {
      // 如果数据还在加载中，使用预置以太坊主网配置
      if (isLoading || !networks || networks.length === 0) {
        console.log("Using Ethereum mainnet from preset - networks not ready");
        const ethereumConfig = getEthereumMainnetConfig();
        if (ethereumConfig) {
          const mainnetChain = networkConfigToViemChain(ethereumConfig);
          if (mainnetChain) {
            const rpcUrl =
              ethereumConfig.rpcUrls.find((url) =>
                url.startsWith("https://")
              ) || "https://cloudflare-eth.com";
            return createConfig({
              chains: [mainnetChain],
              transports: { 1: http(rpcUrl) },
              connectors: [metaMask(), injected()],
            });
          }
        }
        // 回退到基本配置
        const fallbackMainnet = {
          id: 1,
          name: "Ethereum",
          network: "homestead",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://cloudflare-eth.com"] },
            public: { http: ["https://cloudflare-eth.com"] },
          },
        };
        return createConfig({
          chains: [fallbackMainnet],
          transports: { 1: http("https://cloudflare-eth.com") },
          connectors: [metaMask(), injected()],
        });
      }

      // 获取所有支持的链和基础传输配置
      console.log("Processing networks:", networks.length);
      const allSupportedChains = getAllSupportedWagmiChains(networks);
      const baseTransports = getAllSupportedTransports(networks);

      console.log("Supported chains count:", allSupportedChains.length);

      // 验证链配置
      if (!allSupportedChains || allSupportedChains.length === 0) {
        console.warn(
          "No supported chains found, using Ethereum mainnet from preset"
        );
        const ethereumConfig = getEthereumMainnetConfig();
        if (ethereumConfig) {
          const mainnetChain = networkConfigToViemChain(ethereumConfig);
          if (mainnetChain) {
            const rpcUrl =
              ethereumConfig.rpcUrls.find((url) =>
                url.startsWith("https://")
              ) || "https://cloudflare-eth.com";
            return createConfig({
              chains: [mainnetChain],
              transports: { 1: http(rpcUrl) },
              connectors: [metaMask(), injected()],
            });
          }
        }
        // 回退到基本配置
        const fallbackMainnet = {
          id: 1,
          name: "Ethereum",
          network: "homestead",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://cloudflare-eth.com"] },
            public: { http: ["https://cloudflare-eth.com"] },
          },
        };
        return createConfig({
          chains: [fallbackMainnet],
          transports: { 1: http("https://cloudflare-eth.com") },
          connectors: [metaMask(), injected()],
        });
      }

      // 验证链的完整性
      const validChains = allSupportedChains.filter((chain) => {
        if (
          !chain ||
          typeof chain.id !== "number" ||
          chain.id <= 0 ||
          !chain.name
        ) {
          console.warn("Invalid chain found:", {
            chain,
            hasChain: !!chain,
            idType: typeof chain?.id,
            idValue: chain?.id,
            hasName: !!chain?.name,
          });
          return false;
        }
        return true;
      });

      console.log("Valid chains:", validChains.length);

      if (validChains.length === 0) {
        console.warn(
          "No valid chains found after filtering, using Ethereum mainnet from preset"
        );
        const ethereumConfig = getEthereumMainnetConfig();
        if (ethereumConfig) {
          const mainnetChain = networkConfigToViemChain(ethereumConfig);
          if (mainnetChain) {
            const rpcUrl =
              ethereumConfig.rpcUrls.find((url) =>
                url.startsWith("https://")
              ) || "https://cloudflare-eth.com";
            return createConfig({
              chains: [mainnetChain],
              transports: { 1: http(rpcUrl) },
              connectors: [metaMask(), injected()],
            });
          }
        }
        // 回退到基本配置
        const fallbackMainnet = {
          id: 1,
          name: "Ethereum",
          network: "homestead",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://cloudflare-eth.com"] },
            public: { http: ["https://cloudflare-eth.com"] },
          },
        };
        return createConfig({
          chains: [fallbackMainnet],
          transports: { 1: http("https://cloudflare-eth.com") },
          connectors: [metaMask(), injected()],
        });
      }

      // 如果有选择的网络，为其自定义 RPC 配置
      if (selectedNetwork) {
        console.log(
          "Configuring RPC for selected network:",
          selectedNetwork.name
        );
        try {
          const rpcs = getCurrentNetworkRpcs();
          if (rpcs.length > 0) {
            const validRpcs = cleanRpcConfigs(rpcs);
            const rpcUrls = validRpcs.map((rpc) => rpc.url);

            if (rpcUrls.length > 0) {
              baseTransports[selectedNetwork.chainId] = fallback(
                rpcUrls.map((url) => http(url))
              );
              console.log(
                `Configured custom RPCs for ${selectedNetwork.name}:`,
                rpcUrls
              );
            }
          }
        } catch (rpcError) {
          console.error("Error configuring custom RPC:", rpcError);
        }
      }

      console.log("Creating wagmi config with", validChains.length, "chains");

      return createConfig({
        chains: validChains as any,
        transports: baseTransports,
        connectors: [metaMask(), injected()],
      });
    } catch (error) {
      console.error("Error creating wagmi config:", error);
      // 如果出错，尝试使用预置以太坊主网配置
      try {
        const ethereumConfig = getEthereumMainnetConfig();
        if (ethereumConfig) {
          const mainnetChain = networkConfigToViemChain(ethereumConfig);
          if (mainnetChain) {
            const rpcUrl =
              ethereumConfig.rpcUrls.find((url) =>
                url.startsWith("https://")
              ) || "https://cloudflare-eth.com";
            return createConfig({
              chains: [mainnetChain],
              transports: { 1: http(rpcUrl) },
              connectors: [metaMask(), injected()],
            });
          }
        }
      } catch (presetError) {
        console.error("Error using preset config:", presetError);
      }

      // 最终回退配置
      const fallbackMainnet = {
        id: 1,
        name: "Ethereum",
        network: "homestead",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: ["https://cloudflare-eth.com"] },
          public: { http: ["https://cloudflare-eth.com"] },
        },
      };
      return createConfig({
        chains: [fallbackMainnet],
        transports: { 1: http("https://cloudflare-eth.com") },
        connectors: [metaMask(), injected()],
      });
    }
  }, [selectedNetwork, getCurrentNetworkRpcs, networks, isLoading]);

  // 如果正在加载，显示加载状态
  if (isLoading && (!networks || networks.length === 0)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading network configurations...
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

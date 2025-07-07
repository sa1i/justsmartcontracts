import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metaMask, injected } from "@wagmi/connectors";
import { TWithChildren } from "../props";
import { Chain } from "./chains";
import { toWagmiChain } from "./wagmi";
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
import { useMemo } from "react";
import {
  getAllowedContractChains,
  createWagmiChainFromNetwork,
  getAllSupportedWagmiChains,
  getAllSupportedTransports,
} from "./wagmi";

type TProps = TWithChildren & {
  chain: Chain;
};

const queryClient = new QueryClient();

const getAlchemyUrl = (chainId: number): string | null => {
  try {
    switch (chainId) {
      case Chain.ETHEREUM:
        return `https://eth-mainnet.alchemyapi.io/v2/${AlchemyKey}`;
      case Chain.ETH_GOERLI:
        return `https://eth-goerli.alchemyapi.io/v2/${AlchemyKey}`;
      case Chain.ETH_SEPOLIA:
        return `https://eth-sepolia.alchemyapi.io/v2/${AlchemyKey}`;
      case Chain.OPTIMISM:
        return `https://opt-mainnet.g.alchemy.com/v2/${AlchemyKey}`;
      case Chain.ARBITRUM:
        return `https://arb-mainnet.g.alchemy.com/v2/${AlchemyKey}`;
      case Chain.POLYGON:
        return `https://polygon-mainnet.g.alchemy.com/v2/${AlchemyKey}`;
      case Chain.POLYGON_MUMBAI:
        return `https://polygon-mumbai.g.alchemy.com/v2/${AlchemyKey}`;
      // Add more cases for other supported networks if needed
      default:
        return null;
    }
  } catch {
    return null;
  }
};

export const Web3Provider = ({ children, chain }: TProps) => {
  const wagmiChain = toWagmiChain(chain);

  const alchemyUrl = getAlchemyUrl(chain);

  const config = createConfig({
    chains: [wagmiChain],
    transports: {
      [chain]: fallback([
        ...(alchemyUrl ? [http(alchemyUrl)] : []),
        http(wagmiChain.rpcUrls.default.http[0]),
      ]),
    },
    connectors: [metaMask(), injected()],
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

// 增强版 Web3Provider，使用新的网络选择器
export const EnhancedWeb3Provider = ({ children }: TWithChildren) => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } =
    useNetworkSelection();

  const config = useMemo(() => {
    if (!selectedNetwork) {
      // 如果没有选择网络，使用默认配置
      const defaultChain = toWagmiChain(Chain.ETHEREUM);
      return createConfig({
        chains: [defaultChain],
        transports: {
          [Chain.ETHEREUM]: http(defaultChain.rpcUrls.default.http[0]),
        },
        connectors: [metaMask(), injected()],
      });
    }

    // 转换选择的网络为 Viem Chain
    const viemChain = networkConfigToViemChain(selectedNetwork);

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

    // 如果没有允许的链，使用默认配置
    if (allowedChains.length === 0) {
      const defaultChain = toWagmiChain(Chain.ETHEREUM);
      return createConfig({
        chains: [defaultChain],
        transports: {
          [Chain.ETHEREUM]: http(defaultChain.rpcUrls.default.http[0]),
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
      chains:
        allowedChains.length > 0
          ? (allowedChains as any)
          : [toWagmiChain(Chain.ETHEREUM)],
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

  const config = useMemo(() => {
    // 获取所有支持的链和基础传输配置
    const allSupportedChains = getAllSupportedWagmiChains();
    const baseTransports = getAllSupportedTransports();

    // 如果有选择的网络，为其自定义 RPC 配置
    if (selectedNetwork) {
      const rpcs = getCurrentNetworkRpcs();
      if (rpcs.length > 0) {
        const validRpcs = cleanRpcConfigs(rpcs);
        const rpcUrls = validRpcs.map((rpc) => rpc.url);
        
        console.log(`Selected network ${selectedNetwork.name} RPC URLs:`, rpcUrls);
        
        if (rpcUrls.length > 0) {
          baseTransports[selectedNetwork.chainId] = fallback(
            rpcUrls.map((url) => http(url))
          );
        } else {
          // 如果没有有效的自定义 RPC，使用网络的默认 RPC
          const defaultRpcs = selectedNetwork.rpcUrls.filter(url => {
            const validation = validateRpcUrl(url);
            return validation.isValid;
          });
          
          if (defaultRpcs.length > 0) {
            baseTransports[selectedNetwork.chainId] = fallback(
              defaultRpcs.map((url) => http(url))
            );
          }
        }
      } else {
        // 没有自定义 RPC，使用网络配置中的默认 RPC
        const defaultRpcs = selectedNetwork.rpcUrls.filter(url => {
          const validation = validateRpcUrl(url);
          return validation.isValid;
        });
        
        if (defaultRpcs.length > 0) {
          console.log(`Using network default RPCs for ${selectedNetwork.name}:`, defaultRpcs);
          baseTransports[selectedNetwork.chainId] = fallback(
            defaultRpcs.map((url) => http(url))
          );
        }
      }
    }

    console.log('Final transport configuration:', baseTransports);

    return createConfig({
      chains: allSupportedChains as any,
      transports: baseTransports,
      connectors: [metaMask(), injected()],
    });
  }, [selectedNetwork, getCurrentNetworkRpcs]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  NetworkConfig,
  NetworkWithRpc,
  RpcConfig,
  NetworkPermissions,
  NetworkPermission,
} from "./types";
import {
  fetchChainlistData,
  convertChainlistToNetworkConfig,
  generateRpcConfigs,
  searchNetworks,
  filterNetworksByType,
} from "./service";
import {
  networkConfigService,
  NetworkConfigCache,
} from "./networkConfigService";

interface NetworkState {
  // 网络数据
  networks: NetworkConfig[];
  filteredNetworks: NetworkConfig[];

  // 当前选择的网络
  selectedNetwork: NetworkConfig | null;
  selectedRpcIndex: number;

  // UI 状态
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  showTestnets: boolean;

  // 自定义 RPC
  customRpcs: Record<number, RpcConfig[]>; // chainId -> RpcConfig[]

  // 网络权限配置
  networkPermissions: NetworkPermissions;

  // 网络配置缓存信息
  networkConfigCache: NetworkConfigCache | null;
  lastUpdateAttempt: number;
}

interface NetworkActions {
  // 数据获取
  fetchNetworks: () => Promise<void>;
  refreshNetworks: () => Promise<void>;
  forceUpdateNetworks: () => Promise<void>;

  // 网络选择
  selectNetwork: (network: NetworkConfig) => void;
  selectRpc: (rpcIndex: number) => void;

  // 搜索和过滤
  setSearchQuery: (query: string) => void;
  setShowTestnets: (show: boolean) => void;

  // 自定义 RPC
  addCustomRpc: (chainId: number, rpc: RpcConfig) => void;
  removeCustomRpc: (chainId: number, rpcUrl: string) => void;
  updateCustomRpc: (chainId: number, oldUrl: string, newRpc: RpcConfig) => void;

  // 网络权限管理
  setNetworkPermission: (
    chainId: number,
    permission: Partial<NetworkPermission>
  ) => void;
  getNetworkPermission: (chainId: number) => NetworkPermission;
  resetNetworkPermissions: () => void;
  bulkUpdateNetworkPermissions: (permissions: NetworkPermissions) => void;

  // 获取当前网络的 RPC 列表
  getCurrentNetworkRpcs: () => RpcConfig[];

  // 网络配置管理
  getDefaultNetworks: () => Promise<NetworkConfig[]>;
  updateDefaultNetworks: (networks: NetworkConfig[]) => Promise<void>;
  getNetworkConfigInfo: () => NetworkConfigCache | null;

  // 重置状态
  reset: () => void;
}

type NetworkStore = NetworkState & NetworkActions;

const initialState: NetworkState = {
  networks: [],
  filteredNetworks: [],
  selectedNetwork: null,
  selectedRpcIndex: 0,
  isLoading: false,
  error: null,
  searchQuery: "",
  showTestnets: false,
  customRpcs: {},
  networkPermissions: {},
  networkConfigCache: null,
  lastUpdateAttempt: 0,
};

export const useNetworkStore = create<NetworkStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetchNetworks: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.lastUpdateAttempt = Date.now();
        });

        try {
          const configCache = await networkConfigService.getNetworkConfig();

          set((state) => {
            state.networks = configCache.networks;
            state.networkConfigCache = configCache;
            state.isLoading = false;
            // 应用当前的搜索和过滤条件
            state.filteredNetworks = filterAndSearchNetworks(
              configCache.networks,
              state.searchQuery,
              state.showTestnets
            );
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error =
              error instanceof Error
                ? error.message
                : "Failed to fetch networks";
          });
        }
      },

      refreshNetworks: async () => {
        // 清除缓存并重新获取
        networkConfigService.clearCache();
        return get().fetchNetworks();
      },

      forceUpdateNetworks: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.lastUpdateAttempt = Date.now();
        });

        try {
          const configCache = await networkConfigService.forceUpdate();

          set((state) => {
            state.networks = configCache.networks;
            state.networkConfigCache = configCache;
            state.isLoading = false;
            // 应用当前的搜索和过滤条件
            state.filteredNetworks = filterAndSearchNetworks(
              configCache.networks,
              state.searchQuery,
              state.showTestnets
            );
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error =
              error instanceof Error
                ? error.message
                : "Failed to force update networks";
          });
          throw error;
        }
      },

      selectNetwork: (network: NetworkConfig) => {
        set((state) => {
          state.selectedNetwork = network;
          state.selectedRpcIndex = 0; // 重置为第一个 RPC
        });
      },

      selectRpc: (rpcIndex: number) => {
        set((state) => {
          state.selectedRpcIndex = rpcIndex;
        });
      },

      setSearchQuery: (query: string) => {
        set((state) => {
          state.searchQuery = query;
          state.filteredNetworks = filterAndSearchNetworks(
            state.networks,
            query,
            state.showTestnets
          );
        });
      },

      setShowTestnets: (show: boolean) => {
        set((state) => {
          state.showTestnets = show;
          state.filteredNetworks = filterAndSearchNetworks(
            state.networks,
            state.searchQuery,
            show
          );
        });
      },

      addCustomRpc: (chainId: number, rpc: RpcConfig) => {
        set((state) => {
          if (!state.customRpcs[chainId]) {
            state.customRpcs[chainId] = [];
          }
          state.customRpcs[chainId].push({ ...rpc, isCustom: true });
        });
      },

      removeCustomRpc: (chainId: number, rpcUrl: string) => {
        set((state) => {
          if (state.customRpcs[chainId]) {
            state.customRpcs[chainId] = state.customRpcs[chainId].filter(
              (rpc) => rpc.url !== rpcUrl
            );
            if (state.customRpcs[chainId].length === 0) {
              delete state.customRpcs[chainId];
            }
          }
        });
      },

      updateCustomRpc: (chainId: number, oldUrl: string, newRpc: RpcConfig) => {
        set((state) => {
          if (state.customRpcs[chainId]) {
            const index = state.customRpcs[chainId].findIndex(
              (rpc) => rpc.url === oldUrl
            );
            if (index !== -1) {
              state.customRpcs[chainId][index] = { ...newRpc, isCustom: true };
            }
          }
        });
      },

      getCurrentNetworkRpcs: () => {
        const state = get();
        if (!state.selectedNetwork) {
          return [];
        }

        const defaultRpcs = generateRpcConfigs(state.selectedNetwork);
        const customRpcs =
          state.customRpcs[state.selectedNetwork.chainId] || [];

        return [...defaultRpcs, ...customRpcs];
      },

      getDefaultNetworks: async () => {
        return await networkConfigService.getDefaultNetworks();
      },

      updateDefaultNetworks: async (networks: NetworkConfig[]) => {
        await networkConfigService.updateDefaultNetworks(networks);

        // 更新当前状态
        set((state) => {
          state.networks = networks;
          state.filteredNetworks = filterAndSearchNetworks(
            networks,
            state.searchQuery,
            state.showTestnets
          );
          state.networkConfigCache = {
            networks,
            lastUpdate: Date.now(),
            source: "mixed",
          };
        });
      },

      getNetworkConfigInfo: () => {
        return get().networkConfigCache;
      },

      setNetworkPermission: (
        chainId: number,
        permission: Partial<NetworkPermission>
      ) => {
        set((state) => {
          const existing = state.networkPermissions[chainId] || {
            chainId,
            allowContractInteraction: false,
            isUserOverride: false,
          };

          state.networkPermissions[chainId] = {
            ...existing,
            ...permission,
            chainId,
            isUserOverride: true,
          };
        });
      },

      getNetworkPermission: (chainId: number) => {
        const state = get();
        return (
          state.networkPermissions[chainId] || {
            chainId,
            allowContractInteraction: false,
            isUserOverride: false,
          }
        );
      },

      resetNetworkPermissions: () => {
        set((state) => {
          state.networkPermissions = {};
        });
      },

      bulkUpdateNetworkPermissions: (permissions: NetworkPermissions) => {
        set((state) => {
          state.networkPermissions = {
            ...state.networkPermissions,
            ...permissions,
          };
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    {
      name: "network-store",
      partialize: (state) => ({
        selectedNetwork: state.selectedNetwork,
        selectedRpcIndex: state.selectedRpcIndex,
        showTestnets: state.showTestnets,
        customRpcs: state.customRpcs,
        networkPermissions: state.networkPermissions,
      }),
    }
  )
);

// 辅助函数：过滤和搜索网络
function filterAndSearchNetworks(
  networks: NetworkConfig[],
  searchQuery: string,
  showTestnets: boolean
): NetworkConfig[] {
  let filtered = filterNetworksByType(networks, showTestnets);

  if (searchQuery.trim()) {
    filtered = searchNetworks(filtered, searchQuery);
  }

  return filtered;
}

// 导出 hooks
export const useNetworks = () => {
  const store = useNetworkStore();
  return {
    networks: store.filteredNetworks,
    allNetworks: store.networks,
    isLoading: store.isLoading,
    error: store.error,
    fetchNetworks: store.fetchNetworks,
    refreshNetworks: store.refreshNetworks,
    forceUpdateNetworks: store.forceUpdateNetworks,
    getDefaultNetworks: store.getDefaultNetworks,
    updateDefaultNetworks: store.updateDefaultNetworks,
    getNetworkConfigInfo: store.getNetworkConfigInfo,
  };
};

export const useNetworkSelection = () => {
  const store = useNetworkStore();
  return {
    selectedNetwork: store.selectedNetwork,
    selectedRpcIndex: store.selectedRpcIndex,
    selectNetwork: store.selectNetwork,
    selectRpc: store.selectRpc,
    getCurrentNetworkRpcs: store.getCurrentNetworkRpcs,
  };
};

export const useNetworkFilters = () => {
  const store = useNetworkStore();
  return {
    searchQuery: store.searchQuery,
    showTestnets: store.showTestnets,
    setSearchQuery: store.setSearchQuery,
    setShowTestnets: store.setShowTestnets,
  };
};

export const useCustomRpcs = () => {
  const store = useNetworkStore();
  return {
    customRpcs: store.customRpcs,
    addCustomRpc: store.addCustomRpc,
    removeCustomRpc: store.removeCustomRpc,
    updateCustomRpc: store.updateCustomRpc,
  };
};

export const useNetworkPermissions = () => {
  const store = useNetworkStore();
  return {
    networkPermissions: store.networkPermissions,
    setNetworkPermission: store.setNetworkPermission,
    getNetworkPermission: store.getNetworkPermission,
    resetNetworkPermissions: store.resetNetworkPermissions,
    bulkUpdateNetworkPermissions: store.bulkUpdateNetworkPermissions,
  };
};

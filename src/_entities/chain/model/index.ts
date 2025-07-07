import { create } from "zustand";
import { persist } from "zustand/middleware";

// 已弃用：现在使用动态网络配置，这个 store 已不再使用
// 请使用 useNetworkSelection 从 @shared/lib/chainlist/store

type State = {
  chainId: number;
};

type Actions = {
  update: (_chainId: number) => void;
};

// 已弃用：现在所有网络都通过动态配置支持
export const SupportedChains: number[] = [];

const useCurrentChainStore = create<State & Actions>()(
  persist(
    (set) => ({
      chainId: 1, // 默认以太坊主网
      update: (chainId: number) => set(() => ({ chainId })),
    }),
    { name: "chain" }
  )
);

export const useCurrentChain = () => {
  console.warn('useCurrentChain is deprecated, use useNetworkSelection instead');
  return useCurrentChainStore((state) => state);
};

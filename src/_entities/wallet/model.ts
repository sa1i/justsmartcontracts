import { Chain, TAddress } from "@shared/lib/web3";
import { useCallback } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { useNetworkSelection } from "@shared/lib/chainlist/store";

type TWalletModel = {
  address: TAddress | null;
};

export const useCurrentWallet = (): TWalletModel => {
  const { address } = useAccount();
  return { address: address || null };
};

export const useSwitchWalletChain = (chain: Chain) => {
  const { data: walletClient } = useWalletClient();

  const switchIfNeeded = useCallback(async () => {
    if (walletClient) {
      try {
        const walletChain = await walletClient.getChainId();
        if (walletChain !== Number(chain)) {
          await walletClient.switchChain({ id: Number(chain) });
        }
        return true;
      } catch (e) {
        console.log(e);
      }
    }
    return false;
  }, [chain, walletClient]);

  return switchIfNeeded;
};

// 新的钱包链切换 hook，使用网络选择器
export const useSwitchToSelectedNetwork = () => {
  const { data: walletClient } = useWalletClient();
  const { selectedNetwork } = useNetworkSelection();

  const switchIfNeeded = useCallback(async () => {
    if (walletClient && selectedNetwork) {
      try {
        const walletChain = await walletClient.getChainId();
        if (walletChain !== selectedNetwork.chainId) {
          await walletClient.switchChain({ id: selectedNetwork.chainId });
        }
        return true;
      } catch (e) {
        console.log(e);
      }
    }
    return false;
  }, [selectedNetwork, walletClient]);

  return switchIfNeeded;
};

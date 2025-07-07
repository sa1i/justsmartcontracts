import { useMemo } from "react";
import { chainModel } from "@entities/chain";
import { contractModel } from "@entities/contract";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { mapNetworkToChainEnum } from "@shared/lib/chainlist/adapter";

export const useCurrentChainContracts = () => {
  const { selectedNetwork } = useNetworkSelection();
  const { contracts } = contractModel.useContracts();
  const { chain: fallbackChain } = chainModel.useCurrentChain();

  return useMemo(() => {
    if (!selectedNetwork) {
      // 如果没有选择网络，回退到旧的链模型
      return contracts.filter((item) => item.chain === fallbackChain);
    }

    // 使用新的网络选择器逻辑
    const mappedChain = mapNetworkToChainEnum(selectedNetwork);
    if (!mappedChain) {
      return []; // 如果网络无法映射，不显示任何合约
    }

    return contracts.filter((item) => item.chain === mappedChain);
  }, [selectedNetwork, contracts, fallbackChain]);
};

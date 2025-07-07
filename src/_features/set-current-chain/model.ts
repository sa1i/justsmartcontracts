import { chainIdModel } from "@entities/chainId";
import { contractModel } from "@entities/contract";
import { useCallback } from "react";

export const useUpdateChain = () => {
  const { chainId, update } = chainIdModel.useCurrentChain();
  const { setCurrent, contracts } = contractModel.useContracts();

  return useCallback(
    (newChainId: number) => {
      if (newChainId != chainId) {
        const newCurrent = contracts.find((item) => item.chainId == newChainId);
        setCurrent(newCurrent?.id ?? null);
        update(newChainId);
      }
    },
    [chainId, contracts, setCurrent, update]
  );
};

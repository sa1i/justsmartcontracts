import { chainModel } from "@entities/chain";
import { contractModel } from "@entities/contract";
import { useCallback } from "react";

export const useUpdateChain = () => {
  const { chainId, update } = chainModel.useCurrentChain();
  const { setCurrent, contracts } = contractModel.useContracts();

  return useCallback(
    (newChainId: number) => {
      if (newChainId != chainId) {
        const newCurrent = contracts.find((item) => item.chain == newChainId);
        setCurrent(newCurrent?.id ?? null);
        update(newChainId);
      }
    },
    [chainId, contracts, setCurrent, update]
  );
};

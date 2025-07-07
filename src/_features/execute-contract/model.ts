import { useReadContract } from "wagmi";
import { TAbiItem, TContract } from "@entities/contract";
import { useNetworkSelection } from "@shared/lib/chainlist/store";

export const useContractCall = (
  contract: TContract,
  abiItem: TAbiItem,
  args: string[]
) => {
  const { selectedNetwork } = useNetworkSelection();

  console.log("contract:", contract, "abiItem:", abiItem, "args:", args);

  // 使用选择的网络的 chainId，如果没有选择则使用合约的 chain
  const chainId = selectedNetwork?.chainId || contract.chain;
  console.log("chainId:", chainId, selectedNetwork);
  const { data, error, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    //@ts-ignore somehow TS thinks functionName is of undefined type
    functionName: abiItem.name,
    chainId: chainId,
    args,
  });

  console.log("data:", data, "error:", error, "isLoading:", isLoading);
  return {
    data,
    error,
    loading: isLoading,
    refetch,
  };
};

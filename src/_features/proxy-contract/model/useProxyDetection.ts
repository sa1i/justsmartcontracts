import { useCallback, useState } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { createPublicClient, http } from "viem";
import { TAddress } from "@shared/lib/web3";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { networkConfigToViemChain } from "@shared/lib/chainlist/adapter";

// EIP-1967 标准存储槽
const EIP1967_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const EIP1967_ADMIN_SLOT =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

// OpenZeppelin Transparent Proxy 存储槽
const TRANSPARENT_PROXY_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

// UUPS Proxy 存储槽 (与 EIP-1967 相同)
const UUPS_IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

export interface ProxyInfo {
  isProxy: boolean;
  proxyType?: "EIP1967" | "Transparent" | "UUPS" | "Custom";
  implementationAddress?: TAddress;
  adminAddress?: TAddress;
}

export const useProxyDetection = () => {
  const [proxyInfo, setProxyInfo] = useState<ProxyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } =
    useNetworkSelection();

  const detectProxy = useCallback(
    async (contractAddress: TAddress) => {
      if (!selectedNetwork) {
        setError("No network selected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 创建使用选择网络的客户端
        const viemChain = networkConfigToViemChain(selectedNetwork);
        if (!viemChain) {
          throw new Error(
            "Failed to convert network configuration to Viem chain"
          );
        }

        const rpcs = getCurrentNetworkRpcs();
        const selectedRpc = rpcs[selectedRpcIndex] || rpcs[0];

        // 尝试使用选择的 RPC，如果失败则回退到默认 RPC
        let rpcUrl = selectedRpc?.url;
        if (!rpcUrl && viemChain.rpcUrls.default.http.length > 0) {
          rpcUrl = viemChain.rpcUrls.default.http[0];
        }

        if (!rpcUrl) {
          throw new Error("No RPC URL available for the selected network");
        }

        let publicClient = createPublicClient({
          chain: viemChain,
          transport: http(rpcUrl),
        });

        // 检查 EIP-1967 实现槽
        let implementationSlotData: string | undefined;
        let adminSlotData: string | undefined;

        try {
          implementationSlotData = await publicClient.getStorageAt({
            address: contractAddress,
            slot: EIP1967_IMPLEMENTATION_SLOT,
          });

          // 检查 EIP-1967 管理员槽
          adminSlotData = await publicClient.getStorageAt({
            address: contractAddress,
            slot: EIP1967_ADMIN_SLOT,
          });
        } catch (rpcError) {
          // 如果当前 RPC 失败，尝试其他 RPC
          console.warn(
            "Primary RPC failed, trying alternative RPCs:",
            rpcError
          );

          const allRpcs = [
            ...rpcs,
            ...viemChain.rpcUrls.default.http.map((url: string) => ({
              url,
              name: "Default",
            })),
          ];
          let lastError = rpcError;

          for (const rpc of allRpcs) {
            if (rpc.url === rpcUrl) continue; // 跳过已经失败的 RPC

            try {
              const altClient = createPublicClient({
                chain: viemChain,
                transport: http(rpc.url),
              });

              implementationSlotData = await altClient.getStorageAt({
                address: contractAddress,
                slot: EIP1967_IMPLEMENTATION_SLOT,
              });

              adminSlotData = await altClient.getStorageAt({
                address: contractAddress,
                slot: EIP1967_ADMIN_SLOT,
              });

              // 如果成功，使用这个客户端进行后续调用
              // 注意：这里不需要重新赋值，因为我们已经获得了需要的数据
              break;
            } catch (altError) {
              lastError = altError;
              continue;
            }
          }

          if (!implementationSlotData) {
            throw lastError;
          }
        }

        let proxyResult: ProxyInfo = { isProxy: false };

        if (
          implementationSlotData &&
          implementationSlotData !==
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          // 从存储槽数据中提取地址（去掉前面的0填充）
          const implementationAddress = `0x${implementationSlotData.slice(
            -40
          )}` as TAddress;

          proxyResult = {
            isProxy: true,
            proxyType: "EIP1967",
            implementationAddress,
          };

          if (
            adminSlotData &&
            adminSlotData !==
              "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            const adminAddress = `0x${adminSlotData.slice(-40)}` as TAddress;
            proxyResult.adminAddress = adminAddress;
            proxyResult.proxyType = "Transparent";
          }
        } else {
          // 尝试检测其他代理模式
          try {
            // 尝试调用常见的代理方法
            const implementationResult = await publicClient.readContract({
              address: contractAddress,
              abi: [
                {
                  name: "implementation",
                  type: "function",
                  stateMutability: "view",
                  inputs: [],
                  outputs: [{ type: "address", name: "" }],
                },
              ],
              functionName: "implementation",
            });

            if (
              implementationResult &&
              implementationResult !==
                "0x0000000000000000000000000000000000000000"
            ) {
              proxyResult = {
                isProxy: true,
                proxyType: "Custom",
                implementationAddress: implementationResult as TAddress,
              };
            }
          } catch {
            // 如果 implementation() 方法不存在，尝试其他方法
            try {
              const targetResult = await publicClient.readContract({
                address: contractAddress,
                abi: [
                  {
                    name: "target",
                    type: "function",
                    stateMutability: "view",
                    inputs: [],
                    outputs: [{ type: "address", name: "" }],
                  },
                ],
                functionName: "target",
              });

              if (
                targetResult &&
                targetResult !== "0x0000000000000000000000000000000000000000"
              ) {
                proxyResult = {
                  isProxy: true,
                  proxyType: "Custom",
                  implementationAddress: targetResult as TAddress,
                };
              }
            } catch {
              // 最后尝试 getImplementation()
              try {
                const getImplResult = await publicClient.readContract({
                  address: contractAddress,
                  abi: [
                    {
                      name: "getImplementation",
                      type: "function",
                      stateMutability: "view",
                      inputs: [],
                      outputs: [{ type: "address", name: "" }],
                    },
                  ],
                  functionName: "getImplementation",
                });

                if (
                  getImplResult &&
                  getImplResult !== "0x0000000000000000000000000000000000000000"
                ) {
                  proxyResult = {
                    isProxy: true,
                    proxyType: "Custom",
                    implementationAddress: getImplResult as TAddress,
                  };
                }
              } catch {
                // 所有检测方法都失败，不是代理合约
              }
            }
          }
        }

        setProxyInfo(proxyResult);
        return proxyResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to detect proxy";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex]
  );

  const reset = useCallback(() => {
    setProxyInfo(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    proxyInfo,
    isLoading,
    error,
    detectProxy,
    reset,
  };
};

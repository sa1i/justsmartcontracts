import { TTransactionParams, stringToNative } from "@shared/lib/tx";
import { useCallback, useState } from "react";
import { useSendTransaction, useConfig } from "wagmi";
import { sendTransaction } from "@wagmi/core";
import { THexString } from "@shared/lib/web3";
import { walletModel } from "@entities/wallet";
import {
  useNetworkSelection,
  useNetworkPermissions,
} from "@shared/lib/chainlist/store";
import {
  getNetworkContractStatus,
  mapNetworkToChainEnum,
} from "@shared/lib/chainlist/adapter";
import { useNotifications } from "@shared/lib/notify";
import { isRpcRelatedError } from "@shared/ui/RpcErrorHandler";

import { useWatchTxNotification } from "./useTxNotification";

const convertTx = (tx: TTransactionParams) => ({
  ...tx,
  gas: stringToNative(tx.gas),
  value: stringToNative(tx.value),
});

export const usePrepareTransactionSend = (tx?: TTransactionParams) => {
  const { data, isPending, isSuccess, sendTransaction } = useSendTransaction();

  return {
    send: (txParams?: TTransactionParams) => {
      const args = txParams
        ? convertTx(txParams)
        : tx
        ? convertTx(tx)
        : undefined;
      if (args) {
        sendTransaction(args);
      }
    },
    hash: data,
    inProgress: isPending,
    success: isSuccess,
  };
};

export const useTransactionSend = (fallbackChainId: number) => {
  const [txHash, setTxHash] = useState("");
  const [lastError, setLastError] = useState<Error | null>(null);
  const {
    selectedNetwork,
    getCurrentNetworkRpcs,
    selectRpc,
    selectedRpcIndex,
  } = useNetworkSelection();
  const { getNetworkPermission } = useNetworkPermissions();
  const notify = useNotifications();
  const config = useConfig();

  // 使用当前选中的网络，如果没有选中则使用fallback chainId
  const chainToUse = selectedNetwork
    ? mapNetworkToChainEnum(selectedNetwork)
    : fallbackChainId;

  const switchChain = walletModel.useSwitchWalletChain(chainToUse);
  console.log("==> switchChain:", switchChain);
  const send = useCallback(
    async (tx: TTransactionParams) => {
      try {
        // 检查网络合约交互权限
        if (selectedNetwork) {
          const userPermission = getNetworkPermission(selectedNetwork.chainId);
          const contractStatus = getNetworkContractStatus(
            selectedNetwork,
            userPermission
          );

          if (!contractStatus.allowed) {
            notify(
              `Contract interactions are disabled for ${
                selectedNetwork.name
              }. ${contractStatus.reason || ""}`,
              "error"
            );
            return;
          }
        }

        if (await switchChain()) {
          const hash = await sendTransaction(config, convertTx(tx));
          setTxHash(hash);
          setLastError(null); // 清除之前的错误
        }
      } catch (e) {
        const error = e as Error;
        setLastError(error);

        // 如果是RPC相关错误，提供更友好的错误信息
        if (isRpcRelatedError(error)) {
          const rpcs = getCurrentNetworkRpcs();
          if (rpcs.length > 1) {
            notify(
              `RPC connection failed. Try switching to a different RPC endpoint. Error: ${error.message}`,
              "error"
            );
          } else {
            notify(
              `RPC connection failed. Consider adding custom RPC endpoints for better reliability. Error: ${error.message}`,
              "error"
            );
          }
        } else {
          notify(`Transaction failed: ${error.message}`, "error");
        }

        console.log(e);
      }
    },
    [switchChain, selectedNetwork, getNetworkPermission, notify, config]
  );

  useWatchTxNotification(chainToUse, txHash as THexString);

  return {
    hash: txHash,
    send,
    lastError,
    clearError: () => setLastError(null),
  };
};

import { useCallback, useEffect } from "react";
import {
  useNotifications,
  Status as NotififcationStatus,
} from "@shared/lib/notify";
import { THexString, getTxUrl } from "@shared/lib/web3";
import { ExternalLink } from "@shared/ui/ExternalLink";
import { useWaitForTransactionReceipt } from "wagmi";
import { useNetworkSelection } from "@shared/lib/chainlist/store";

type Status = "pending" | "confirmed" | "failed";

const NotificationStatus: Record<Status, NotififcationStatus> = {
  pending: "info",
  confirmed: "success",
  failed: "error",
};

export const useTxNotification = () => {
  const notify = useNotifications();
  const { selectedNetwork } = useNetworkSelection();

  return useCallback(
    (txHash: string, status: Status) => {
      const txShort = `${txHash.slice(0, 10)}...`;

      // 只有在有选择的网络时才生成链接
      const txUrl = selectedNetwork ? getTxUrl(selectedNetwork, txHash) : "";

      notify(
        <span>
          Transaction{" "}
          {txUrl ? (
            <ExternalLink href={txUrl}>{txShort}</ExternalLink>
          ) : (
            <span>{txShort}</span>
          )}{" "}
          {status}
        </span>,
        NotificationStatus[status]
      );
    },
    [notify, selectedNetwork]
  );
};

export const useWatchTxNotification = (
  chainId: number,
  hash: THexString | undefined
) => {
  const notify = useTxNotification();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (hash) {
      const status: Status = isLoading
        ? "pending"
        : isSuccess
        ? "confirmed"
        : "failed";

      notify(hash, status);
    }
  }, [hash, isLoading, isSuccess, notify]);
};

import { useCallback, useEffect } from "react";
import { Form } from "antd";
import { walletModel } from "@entities/wallet";
import { TAddress, isEvmAddress } from "@shared/lib/web3";
import { TNativeValue, TTransactionParams } from "@shared/lib/tx";
import { TAbiFunction, TContract } from "@entities/contract";
import { useInitialTransactionParams } from "./useInitialTransactionParams";
import { useSelectedNetworkPublicClient } from "@shared/lib/web3/publicClientService";

export const useTransactionParamsForm = (
  contract: TContract,
  abiItem: TAbiFunction,
  args: string[]
) => {
  const publicClient = useSelectedNetworkPublicClient();
  const { address } = walletModel.useCurrentWallet();

  const [form] = Form.useForm<TTransactionParams>();

  const initialValues = useInitialTransactionParams(contract, abiItem, args);

  const updateNonce = useCallback(
    (address: TAddress) => {
      if (!publicClient) {
        console.warn("Public client not available for nonce retrieval");
        return;
      }
      
      publicClient
        .getTransactionCount({ address })
        .then((value) => form.setFieldValue("nonce", value))
        .catch((error) => {
          console.error("Failed to get transaction count:", error);
          // Set a default nonce of 0 and let the user manually adjust if needed
          form.setFieldValue("nonce", 0);
        });
    },
    [form, publicClient]
  );

  const updateGasLimit = useCallback(
    (address: TAddress, value?: TNativeValue) => {
      if (!publicClient) {
        console.warn("Public client not available for gas estimation");
        form.setFieldValue("gas", "21000"); // 设置默认 gas limit
        return;
      }

      publicClient
        .estimateGas({
          account: address,
          to: initialValues.to,
          data: initialValues.data,
          value: BigInt(value || 0),
        })
        .then((value) => form.setFieldValue("gas", value.toString()))
        .catch((error) => {
          console.error("Failed to estimate gas:", error);
          form.setFieldValue("gas", "21000"); // 设置默认 gas limit
        });
    },
    [form, initialValues.data, initialValues.to, publicClient]
  );

  const onValuesChange = useCallback(
    (changed: Partial<TTransactionParams>) => {
      if (changed.from && isEvmAddress(changed.from)) {
        updateNonce(changed.from);
        updateGasLimit(changed.from);
      }

      if (changed.value) {
        updateGasLimit(form.getFieldValue("from"), changed.value);
      }
    },
    [form, updateGasLimit, updateNonce]
  );

  useEffect(() => {
    if (address) {
      form.setFieldValue("from", address);
      updateNonce(address);
      updateGasLimit(address);
    }
  }, [address, form, updateNonce, updateGasLimit]);

  return {
    form,
    onValuesChange,
    initialValues,
    payable: abiItem.stateMutability == "payable",
  };
};

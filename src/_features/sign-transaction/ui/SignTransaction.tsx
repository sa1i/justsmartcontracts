import { TAbiFunction, TContract } from "@entities/contract";
import { SignTransactionForm } from "./SignTransactionForm";
import { TTransactionParams } from "@shared/lib/tx";
import { useTransactionSend } from "../model/useTransactionSend";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { mapNetworkToChainEnum } from "@shared/lib/chainlist/adapter";
import { RpcErrorHandler } from "@shared/ui/RpcErrorHandler";

type TProps = {
  contract: TContract;
  abiItem: TAbiFunction;
  args: string[];
};

export const SignTransaction = ({ contract, abiItem, args }: TProps) => {
  const { selectedNetwork } = useNetworkSelection();

  // 使用当前选中的网络，如果没有选中则使用合约的原始链
  const chainToUse = selectedNetwork
    ? mapNetworkToChainEnum(selectedNetwork)
    : contract.chain;

  console.log(`chain to use:`, chainToUse);

  const { send, lastError, clearError } = useTransactionSend(chainToUse);

  const onSubmit = (values: TTransactionParams) => {
    send(values);
  };

  return (
    <div>
      {lastError && (
        <div style={{ marginBottom: 16 }}>
          <RpcErrorHandler
            error={lastError}
            onRetry={() => clearError()}
            showRpcSwitcher={true}
          />
        </div>
      )}

      <SignTransactionForm
        contract={contract}
        abiItem={abiItem}
        args={args}
        onSubmit={onSubmit}
      />
    </div>
  );
};

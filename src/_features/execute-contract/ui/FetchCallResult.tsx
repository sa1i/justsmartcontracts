import { ParamValue, TAbiFunction, TContract } from "@entities/contract";
import { useContractCall } from "../model";
import { Alert, Spin } from "antd";
import {
  useNetworkSelection,
  useNetworkPermissions,
} from "@shared/lib/chainlist/store";
import { getNetworkContractStatus } from "@shared/lib/chainlist/adapter";
import { RpcErrorHandler } from "@shared/ui/RpcErrorHandler";

type TProps = {
  contract: TContract;
  abiItem: TAbiFunction;
  args: string[];
};

export const FetchCallResult = ({ contract, abiItem, args }: TProps) => {
  const { selectedNetwork } = useNetworkSelection();
  const { getNetworkPermission } = useNetworkPermissions();
  const { data, error, loading, refetch } = useContractCall(
    contract,
    abiItem,
    args
  );

  // 检查网络合约交互权限
  if (selectedNetwork) {
    const userPermission = getNetworkPermission(selectedNetwork.chainId);
    const contractStatus = getNetworkContractStatus(
      selectedNetwork,
      userPermission
    );

    if (!contractStatus.allowed) {
      return (
        <Alert
          message="Contract interactions disabled"
          description={`Contract interactions are disabled for ${
            selectedNetwork.name
          }. ${contractStatus.reason || ""}`}
          type="warning"
          showIcon
        />
      );
    }
  }

  if (loading) {
    return <Spin />;
  }

  if (error) {
    return (
      <RpcErrorHandler
        error={error}
        onRetry={() => refetch()}
        showRpcSwitcher={true}
      />
    );
  }

  return <ParamValue value={data} abiType={abiItem.outputs[0].type} />;
};

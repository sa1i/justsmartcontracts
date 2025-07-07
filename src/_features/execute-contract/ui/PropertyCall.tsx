import { Spin, Alert, Space, Button } from "antd";
import type { TContract, TAbiFunction } from "@entities/contract";
import { ParamValue } from "@entities/contract";
import { useContractCall } from "../model";
import { ReloadOutlined } from "@ant-design/icons";
import {
  useNetworkSelection,
  useNetworkPermissions,
} from "@shared/lib/chainlist/store";
import { getNetworkContractStatus } from "@shared/lib/chainlist/adapter";

type TProps = {
  contract: TContract;
  abiItem: TAbiFunction;
};

export const PropertyCall = ({ contract, abiItem }: TProps) => {
  const { selectedNetwork } = useNetworkSelection();
  const { getNetworkPermission } = useNetworkPermissions();
  const { data, error, loading, refetch } = useContractCall(
    contract,
    abiItem,
    []
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
    return <Alert message={error.message} type="error" showIcon />;
  }

  return (
    <Space size="large" style={{ wordBreak: "break-word" }}>
      <Button onClick={() => refetch()} icon={<ReloadOutlined />}></Button>
      <ParamValue value={data} abiType={abiItem.outputs[0].type} />
    </Space>
  );
};

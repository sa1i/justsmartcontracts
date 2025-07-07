import { contractModel } from "@entities/contract";
import { Empty, Tabs, Alert, Space, Typography, Button } from "antd";
import { PropertiesList } from "./PropertiesList";
import { CallsList } from "./CallsList";
import { OperationsList } from "./OperationsList";
import { EventsList } from "./EventsList";
import {
  useNetworkSelection,
  useNetworkPermissions,
} from "@shared/lib/chainlist/store";
import { getNetworkContractStatus } from "@shared/lib/chainlist/adapter";
import {
  GlobalOutlined,
  ContainerOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  ProxyContractInfo,
  ProxyContractMethods,
} from "@features/proxy-contract";
import { RpcSwitcher } from "@features/network-selector/ui/RpcSwitcher";
import { useState } from "react";
import { TAddress } from "@shared/lib/web3";
import { TAbiItem } from "@entities/contract";
import { AddressLink } from "@shared/ui/AddressLink";

const { Text } = Typography;

export const ContractBrowser = () => {
  const contract = contractModel.useCurrentContract();
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();
  const { getNetworkPermission } = useNetworkPermissions();

  // 代理合约状态
  const [implementationAddress, setImplementationAddress] =
    useState<TAddress | null>(null);
  const [implementationAbi, setImplementationAbi] = useState<TAbiItem[] | null>(
    null
  );

  // 检查RPC可用性
  const rpcs = getCurrentNetworkRpcs();
  const hasRpcs = rpcs.length > 0;

  const handleImplementationFound = (address: TAddress, abi: TAbiItem[]) => {
    setImplementationAddress(address);
    setImplementationAbi(abi);
  };

  if (!contract) {
    return <Empty description="No smart contract selected" />;
  }

  const key = `${contract.address}${contract.chain}`;

  // 检查网络合约交互权限
  let networkWarning = null;
  if (selectedNetwork) {
    const userPermission = getNetworkPermission(selectedNetwork.chainId);
    const contractStatus = getNetworkContractStatus(
      selectedNetwork,
      userPermission
    );

    if (!contractStatus.allowed) {
      networkWarning = (
        <Alert
          message="Contract interactions disabled"
          description={`Contract interactions are disabled for ${
            selectedNetwork.name
          }. ${contractStatus.reason || ""}`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
  }

  const TabItems = [
    {
      key: "1",
      label: "Properties",
      children: <PropertiesList contract={contract} key={key} />,
    },
    {
      key: "2",
      label: "Calls",
      children: <CallsList contract={contract} key={key} />,
    },
    {
      key: "3",
      label: "Operations",
      children: <OperationsList contract={contract} key={key} />,
    },
    {
      key: "4",
      label: "Events",
      children: <EventsList contract={contract} key={key} />,
    },
    // 如果检测到代理合约且有实现合约ABI，添加代理方法标签页
    ...(implementationAddress && implementationAbi
      ? [
          {
            key: "5",
            label: "Proxy Methods",
            children: (
              <ProxyContractMethods
                proxyContract={contract}
                implementationAddress={implementationAddress}
                implementationAbi={implementationAbi}
                key={`${key}-proxy`}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      {/* 合约信息头部 */}
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <ContainerOutlined />
            <Text strong style={{ fontSize: "16px" }}>
              {contract.name}
            </Text>
          </Space>
          <Space>
            <Text type="secondary">Contract Address:</Text>
            <AddressLink address={contract.address} showCopy={true} />
          </Space>
        </Space>
      </div>

      {/* 网络状态显示 */}
      {selectedNetwork && (
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <GlobalOutlined />
                <Text type="secondary">
                  Using network: <Text strong>{selectedNetwork.name}</Text>{" "}
                  (Chain ID: {selectedNetwork.chainId})
                </Text>
              </Space>
              <RpcSwitcher size="small" showLabel={false} />
            </div>

            {!hasRpcs && (
              <Alert
                message="No RPC Available"
                description="No RPC endpoints are configured for the current network. Contract interactions may fail."
                type="warning"
                showIcon
                style={{ fontSize: 12 }}
              />
            )}
          </Space>
        </div>
      )}

      {/* 网络权限警告 */}
      {networkWarning}

      {/* 代理合约信息 */}
      <ProxyContractInfo
        contractAddress={contract.address}
        onImplementationFound={handleImplementationFound}
      />

      <Tabs items={TabItems} size="large" defaultActiveKey="1" />
    </div>
  );
};

import React, { useMemo } from "react";
import { Tabs, Empty, Alert, Space, Button } from "antd";
import {
  TContract,
  TAbiItem,
  TAbiFunction,
  TAbiEvent,
} from "@entities/contract";
import { TAddress } from "@shared/lib/web3";
import { GetterCall } from "@features/execute-contract/ui/GetterCall";
import { CreateTransaction } from "@features/sign-transaction/ui/CreateTransaction";
import { FetchEvents } from "@features/fetch-events/ui/FetchEvents";
import { Collapse } from "antd";
import { getFunctionSelector } from "viem";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { RpcSwitcher } from "@features/network-selector/ui/RpcSwitcher";

interface ProxyContractMethodsProps {
  proxyContract: TContract;
  implementationAddress: TAddress;
  implementationAbi: TAbiItem[];
}

export const ProxyContractMethods: React.FC<ProxyContractMethodsProps> = ({
  proxyContract,
  implementationAddress,
  implementationAbi,
}) => {
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();

  // 创建一个虚拟的实现合约对象，使用代理地址但实现合约的 ABI
  const virtualImplementationContract: TContract = useMemo(
    () => ({
      ...proxyContract,
      abi: implementationAbi,
      name: `${proxyContract.name} (Implementation)`,
    }),
    [proxyContract, implementationAbi]
  );

  // 检查RPC可用性
  const rpcs = getCurrentNetworkRpcs();
  const hasRpcs = rpcs.length > 0;

  // 使用现有的 hooks 来分类 ABI 项
  const properties = useMemo(
    () =>
      implementationAbi.filter(
        (item): item is TAbiFunction =>
          item.type === "function" &&
          (item.stateMutability === "pure" ||
            item.stateMutability === "view") &&
          item.inputs.length === 0
      ),
    [implementationAbi]
  );

  const calls = useMemo(
    () =>
      implementationAbi.filter(
        (item): item is TAbiFunction =>
          item.type === "function" &&
          (item.stateMutability === "pure" ||
            item.stateMutability === "view") &&
          item.inputs.length > 0
      ),
    [implementationAbi]
  );

  const operations = useMemo(
    () =>
      implementationAbi.filter(
        (item): item is TAbiFunction =>
          item.type === "function" &&
          item.stateMutability !== "pure" &&
          item.stateMutability !== "view"
      ),
    [implementationAbi]
  );

  const events = useMemo(
    () =>
      implementationAbi.filter(
        (item): item is TAbiEvent => item.type === "event"
      ),
    [implementationAbi]
  );

  if (!implementationAbi || implementationAbi.length === 0) {
    return (
      <Alert
        message="No Implementation ABI"
        description="Implementation contract ABI is not available. Please set it manually or ensure the contract is verified."
        type="warning"
        showIcon
      />
    );
  }

  const tabItems = [
    {
      key: "properties",
      label: `Properties (${properties.length})`,
      children:
        properties.length > 0 ? (
          <Collapse
            items={properties.map((item, index) => ({
              label: item.name,
              key: index,
              children: (
                <GetterCall
                  contract={virtualImplementationContract}
                  abiItem={item}
                />
              ),
            }))}
          />
        ) : (
          <Empty description="No properties found" />
        ),
    },
    {
      key: "calls",
      label: `Calls (${calls.length})`,
      children:
        calls.length > 0 ? (
          <Collapse
            items={calls.map((item, index) => {
              const hashFunction = getFunctionSelector(item);
              return {
                label: `${item.name} (${hashFunction})`,
                key: index,
                children: (
                  <GetterCall
                    contract={virtualImplementationContract}
                    abiItem={item}
                  />
                ),
              };
            })}
          />
        ) : (
          <Empty description="No view/pure functions with parameters found" />
        ),
    },
    {
      key: "operations",
      label: `Operations (${operations.length})`,
      children:
        operations.length > 0 ? (
          <Collapse
            items={operations.map((item, index) => {
              const hashFunction = getFunctionSelector(item);
              return {
                label: `${item.name} (${hashFunction})`,
                key: index,
                children: (
                  <CreateTransaction
                    contract={virtualImplementationContract}
                    abiItem={item}
                  />
                ),
              };
            })}
          />
        ) : (
          <Empty description="No state-changing functions found" />
        ),
    },
    {
      key: "events",
      label: `Events (${events.length})`,
      children:
        events.length > 0 ? (
          <Collapse
            items={events.map((item, index) => ({
              label: item.name,
              key: index,
              children: (
                <FetchEvents
                  contract={virtualImplementationContract}
                  event={item}
                />
              ),
            }))}
          />
        ) : (
          <Empty description="No events found" />
        ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Alert
        message="Proxy Contract Methods"
        description={`These methods are from the implementation contract (${implementationAddress}) but will be executed on the proxy contract (${proxyContract.address}).`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* RPC状态和切换器 */}
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
              <span>
                Current Network: <strong>{selectedNetwork.name}</strong>
              </span>
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

      <Tabs items={tabItems} size="large" defaultActiveKey="properties" />
    </div>
  );
};

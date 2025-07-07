import React, { useEffect } from "react";
import { Button, Form, Input, Alert, Space, Typography } from "antd";
import { AbiInput } from "@shared/ui/AbiInput";

import { chainModel } from "@entities/chain";
import { TContractWithoutId } from "../model/types";
import { useNetworkSelection, useNetworks } from "@shared/lib/chainlist/store";
import { Chain } from "@shared/lib/web3";
import {
  mapNetworkToChainEnum,
  formatNetworkName,
} from "@shared/lib/chainlist/adapter";

const { Text } = Typography;

type TProps = {
  onSubmit: (_values: TContractWithoutId) => void;
  buttonText: string;
  value?: TContractWithoutId;
};

// 简化的链选择器，直接使用全局选中的网络
const ContractChainSelect = ({
  value,
  onChange,
}: {
  value?: Chain;
  onChange?: (chain: Chain) => void;
}) => {
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();
  const { fetchNetworks } = useNetworks();

  // 初始化网络数据
  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  // 当全局选中的网络变化时，自动更新表单值
  useEffect(() => {
    if (selectedNetwork) {
      const mappedChain = mapNetworkToChainEnum(selectedNetwork);
      if (mappedChain && mappedChain !== value) {
        onChange?.(mappedChain);
      }
    }
  }, [selectedNetwork, onChange, value]);

  // 检查当前选中的网络是否有可用的RPC
  const hasAvailableRpc = selectedNetwork && getCurrentNetworkRpcs().length > 0;

  return (
    <div>
      {/* 显示当前网络状态 */}
      <div style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text strong>Network</Text>

          {selectedNetwork ? (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#f6ffed",
                borderRadius: "6px",
                border: "1px solid #b7eb8f",
              }}
            >
              <Space>
                <Text style={{ color: "#52c41a" }}>✓</Text>
                <Text>{formatNetworkName(selectedNetwork)}</Text>
                {!hasAvailableRpc && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    (No RPC available)
                  </Text>
                )}
              </Space>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fff2e8",
                borderRadius: "6px",
                border: "1px dashed #ffb366",
              }}
            >
              <Text type="secondary">
                No network selected - Please select a network from the top
                navigation
              </Text>
            </div>
          )}

          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
            The contract will be added to the currently selected network. Use
            the network selector in the top navigation to change networks.
          </Text>
        </Space>
      </div>

      {/* 只有当前选中的网络没有RPC时才显示警告 */}
      {selectedNetwork && !hasAvailableRpc && (
        <Alert
          message="No RPC available"
          description={`${selectedNetwork.name} has no available RPC endpoints. Contract interactions may not work properly.`}
          type="warning"
          showIcon
          style={{ marginTop: 8, fontSize: 12 }}
        />
      )}
    </div>
  );
};

// @ts-ignore
const CustomChainInput = ({
  value,
  onChange,
}: {
  value?: any;
  onChange?: any;
}) =>
  value && onChange ? (
    <ContractChainSelect value={value} onChange={onChange} />
  ) : null;

export const ContractForm = ({ buttonText, value, onSubmit }: TProps) => {
  const { chain } = chainModel.useCurrentChain();

  const initialValue = value || { chain, abi: [] };

  const textFormValues = {
    ...initialValue,
    abi: JSON.stringify(initialValue.abi, null, 2),
  };

  const submitHandler = (formValues: any) => {
    onSubmit({
      ...formValues,
      abi: JSON.parse(formValues.abi),
    });
  };

  return (
    <Form
      preserve={false}
      initialValues={textFormValues}
      layout="vertical"
      name="add-contract"
      onFinish={submitHandler}
    >
      <Form.Item label="Chain" name="chain">
        <CustomChainInput />
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Contract name missing" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Address"
        name="address"
        rules={[{ required: true, message: "Contract address missing" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="ABI"
        name="abi"
        rules={[{ required: true, message: "Contract ABI missing" }]}
      >
        <AbiInput />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          {buttonText}
        </Button>
      </Form.Item>
    </Form>
  );
};

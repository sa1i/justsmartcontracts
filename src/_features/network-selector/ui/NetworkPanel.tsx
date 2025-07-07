import React, { useState } from "react";
import {
  Button,
  Space,
  Typography,
  Avatar,
  Dropdown,
  MenuProps,
  Tag,
} from "antd";
import {
  GlobalOutlined,
  DownOutlined,
  SettingOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { NetworkSelector } from "./NetworkSelector";
import { RpcSelector } from "./RpcSelector";
import { NetworkConfig } from "@shared/lib/chainlist/types";

const { Text } = Typography;

interface NetworkPanelProps {
  onNetworkChange?: (network: NetworkConfig) => void;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
}

export const NetworkPanel: React.FC<NetworkPanelProps> = ({
  onNetworkChange,
  style,
  size = "middle",
}) => {
  const {
    selectedNetwork,
    selectedRpcIndex,
    selectNetwork,
    selectRpc,
    getCurrentNetworkRpcs,
  } = useNetworkSelection();

  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [showRpcSelector, setShowRpcSelector] = useState(false);

  const rpcs = getCurrentNetworkRpcs();
  const currentRpc = rpcs[selectedRpcIndex];

  const handleNetworkSelect = (network: NetworkConfig) => {
    selectNetwork(network);
    onNetworkChange?.(network);
  };

  const getNetworkIcon = (network: NetworkConfig) => {
    if (network.icon) {
      return (
        <Avatar
          size={size === "small" ? 16 : size === "large" ? 24 : 20}
          src={`https://icons.llamao.fi/icons/chains/rsz_${network.icon}.jpg`}
          alt={network.name}
        />
      );
    }
    return (
      <Avatar
        size={size === "small" ? 16 : size === "large" ? 24 : 20}
        icon={<GlobalOutlined />}
      />
    );
  };

  const handleRpcSelect = (rpcIndex: number) => {
    selectRpc(rpcIndex);
  };

  const getRpcMenuItems = (): MenuProps["items"] => {
    if (!selectedNetwork || rpcs.length <= 1) return [];

    return rpcs.map((rpc, index) => ({
      key: `rpc-${index}`,
      label: (
        <Space>
          <span>{rpc.name}</span>
          {index === selectedRpcIndex && <Text type="success">●</Text>}
          {rpc.isCustom && (
            <Tag size="small" color="blue">
              Custom
            </Tag>
          )}
        </Space>
      ),
      onClick: () => handleRpcSelect(index),
    }));
  };

  const dropdownItems: MenuProps["items"] = [
    {
      key: "switch-network",
      label: "Switch Network",
      icon: <SwapOutlined />,
      onClick: () => setShowNetworkSelector(true),
    },
    ...(rpcs.length > 1
      ? [
          {
            type: "divider" as const,
          },
          {
            key: "rpc-submenu",
            label: "Switch RPC",
            icon: <SettingOutlined />,
            children: getRpcMenuItems(),
          },
        ]
      : []),
    {
      key: "rpc-settings",
      label: "RPC Settings",
      icon: <SettingOutlined />,
      onClick: () => setShowRpcSelector(true),
      disabled: !selectedNetwork,
    },
  ];

  if (!selectedNetwork) {
    return (
      <>
        <Button
          type="primary"
          icon={<GlobalOutlined />}
          onClick={() => setShowNetworkSelector(true)}
          style={style}
          size={size}
        >
          Select Network
        </Button>

        <NetworkSelector
          visible={showNetworkSelector}
          onClose={() => setShowNetworkSelector(false)}
          onNetworkSelect={handleNetworkSelect}
        />
      </>
    );
  }

  return (
    <>
      <Dropdown
        menu={{ items: dropdownItems }}
        trigger={["click"]}
        placement="bottomLeft"
      >
        <Button style={style} size={size}>
          <Space size="small">
            {getNetworkIcon(selectedNetwork)}
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: size === "small" ? 12 : size === "large" ? 16 : 14,
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {selectedNetwork.name}
              </div>
              {currentRpc && (
                <div
                  style={{
                    fontSize: size === "small" ? 10 : 12,
                    color: "#666",
                    lineHeight: 1.2,
                  }}
                >
                  {currentRpc.name}
                </div>
              )}
            </div>
            <DownOutlined style={{ fontSize: 10 }} />
          </Space>
        </Button>
      </Dropdown>

      <NetworkSelector
        visible={showNetworkSelector}
        onClose={() => setShowNetworkSelector(false)}
        onNetworkSelect={handleNetworkSelect}
      />

      <RpcSelector
        visible={showRpcSelector}
        onClose={() => setShowRpcSelector(false)}
      />
    </>
  );
};

// 简化版本的网络显示组件
export const NetworkDisplay: React.FC<{
  network?: NetworkConfig;
  rpcName?: string;
  size?: "small" | "middle" | "large";
}> = ({ network, rpcName, size = "middle" }) => {
  if (!network) {
    return (
      <Space size="small">
        <Avatar
          size={size === "small" ? 16 : size === "large" ? 24 : 20}
          icon={<GlobalOutlined />}
        />
        <Text type="secondary">No network selected</Text>
      </Space>
    );
  }

  const getNetworkIcon = () => {
    if (network.icon) {
      return (
        <Avatar
          size={size === "small" ? 16 : size === "large" ? 24 : 20}
          src={`https://icons.llamao.fi/icons/chains/rsz_${network.icon}.jpg`}
          alt={network.name}
        />
      );
    }
    return (
      <Avatar
        size={size === "small" ? 16 : size === "large" ? 24 : 20}
        icon={<GlobalOutlined />}
      />
    );
  };

  return (
    <Space size="small">
      {getNetworkIcon()}
      <div>
        <div
          style={{
            fontSize: size === "small" ? 12 : size === "large" ? 16 : 14,
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {network.name}
        </div>
        {rpcName && (
          <div
            style={{
              fontSize: size === "small" ? 10 : 12,
              color: "#666",
              lineHeight: 1.2,
            }}
          >
            {rpcName}
          </div>
        )}
      </div>
    </Space>
  );
};

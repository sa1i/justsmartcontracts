import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Switch,
  List,
  Avatar,
  Typography,
  Space,
  Button,
  Spin,
  Alert,
  Badge,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  GlobalOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  useNetworks,
  useNetworkSelection,
  useNetworkFilters,
  useNetworkPermissions,
} from "@shared/lib/chainlist/store";
import { NetworkConfig } from "@shared/lib/chainlist/types";
import {
  isNetworkSupported,
  isNetworkAllowedForContracts,
  getNetworkContractStatus,
} from "@shared/lib/chainlist/adapter";
import { SupportedNetworksButton } from "./SupportedNetworksInfo";
import { NetworkPermissionsButton } from "./NetworkPermissionsManager";
import { NetworkConfigButton } from "@features/network-config-manager";

const { Text, Title } = Typography;

interface NetworkSelectorProps {
  visible: boolean;
  onClose: () => void;
  onNetworkSelect: (network: NetworkConfig) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  visible,
  onClose,
  onNetworkSelect,
}) => {
  const { networks, isLoading, error, fetchNetworks, refreshNetworks } =
    useNetworks();
  const { selectedNetwork } = useNetworkSelection();
  const { searchQuery, showTestnets, setSearchQuery, setShowTestnets } =
    useNetworkFilters();
  const { getNetworkPermission } = useNetworkPermissions();

  // 初始化数据
  useEffect(() => {
    if (visible && networks.length === 0 && !isLoading) {
      fetchNetworks();
    }
  }, [visible, networks.length, isLoading, fetchNetworks]);

  const handleNetworkSelect = (network: NetworkConfig) => {
    onNetworkSelect(network);
    onClose();
  };

  const handleRefresh = () => {
    refreshNetworks();
  };

  const getNetworkIcon = (network: NetworkConfig) => {
    if (network.icon) {
      return (
        <Avatar
          size="small"
          src={`https://icons.llamao.fi/icons/chains/rsz_${network.icon}.jpg`}
          alt={network.name}
        />
      );
    }
    return <Avatar size="small" icon={<GlobalOutlined />} />;
  };

  const getNetworkBadge = (network: NetworkConfig) => {
    const badges = [];
    const userPermission = getNetworkPermission(network.chainId);
    const contractStatus = getNetworkContractStatus(network, userPermission);

    // 合约交互状态徽章
    if (contractStatus.allowed) {
      badges.push(
        <Badge
          key="contracts"
          status="success"
          text={
            contractStatus.source === "user" ? "Allowed (Custom)" : "Supported"
          }
        />
      );
    } else {
      badges.push(
        <Tooltip key="blocked" title={contractStatus.reason}>
          <Badge
            status={contractStatus.source === "user" ? "error" : "default"}
            text={
              contractStatus.source === "user"
                ? "Blocked (Custom)"
                : "View Only"
            }
          />
        </Tooltip>
      );
    }

    // 测试网徽章
    if (network.testnet) {
      badges.push(<Badge key="testnet" status="warning" text="Testnet" />);
    }

    // 风险警告徽章
    if (network.redFlags && network.redFlags.length > 0) {
      badges.push(
        <Tooltip
          key="warning"
          title={`Red flags: ${network.redFlags.join(", ")}`}
        >
          <Badge status="error" text="Warning" />
        </Tooltip>
      );
    }

    return <Space size="small">{badges}</Space>;
  };

  return (
    <Modal
      title={
        <Space>
          <GlobalOutlined />
          <span>Select Network</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      bodyStyle={{ padding: "16px" }}
    >
      {/* 搜索和过滤控件 */}
      <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Input
            placeholder="Search networks..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, marginRight: 8 }}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
            title="Refresh networks"
          />
        </Space>

        <Space>
          <Text>Show testnets:</Text>
          <Switch
            checked={showTestnets}
            onChange={setShowTestnets}
            size="small"
          />
        </Space>

        {/* 网络统计信息 */}
        <div style={{ fontSize: 12, color: "#666" }}>
          {networks.length > 0 && (
            <Text type="secondary">
              {
                networks.filter((n) => {
                  const userPermission = getNetworkPermission(n.chainId);
                  return isNetworkAllowedForContracts(n, userPermission);
                }).length
              }{" "}
              allowed for contracts,{" "}
              {
                networks.filter((n) => {
                  const userPermission = getNetworkPermission(n.chainId);
                  return !isNetworkAllowedForContracts(n, userPermission);
                }).length
              }{" "}
              view-only of {networks.length} networks
            </Text>
          )}
        </div>
      </Space>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="Failed to load networks"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      )}

      {/* 网络列表 */}
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {isLoading && networks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading networks...</Text>
            </div>
          </div>
        ) : (
          <List
            dataSource={networks}
            renderItem={(network) => (
              <List.Item
                key={network.chainId}
                onClick={() => handleNetworkSelect(network)}
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 4,
                  backgroundColor:
                    selectedNetwork?.chainId === network.chainId
                      ? "#f0f8ff"
                      : "transparent",
                  border:
                    selectedNetwork?.chainId === network.chainId
                      ? "1px solid #1890ff"
                      : "1px solid transparent",
                }}
                className="network-list-item"
              >
                <List.Item.Meta
                  avatar={getNetworkIcon(network)}
                  title={
                    <Space>
                      <Text strong>{network.name}</Text>
                      {getNetworkBadge(network)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Chain ID: {network.chainId} •{" "}
                        {network.nativeCurrency.symbol}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {network.rpcUrls.length} RPC
                        {network.rpcUrls.length > 1 ? "s" : ""} available
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{
              emptyText: searchQuery
                ? `No networks found for "${searchQuery}"`
                : "No networks available",
            }}
          />
        )}
      </div>

      {/* 底部信息 */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #f0f0f0",
          textAlign: "center",
        }}
      >
        <Space direction="vertical" size={4}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Data from chainlist.org • {networks.length} networks loaded
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            <Badge status="success" /> Allowed for contract interactions •{" "}
            <Badge status="default" /> View-only mode
          </Text>
          <Space>
            <NetworkConfigButton />
            <SupportedNetworksButton />
            <NetworkPermissionsButton />
          </Space>
        </Space>
      </div>
    </Modal>
  );
};

// CSS 样式（可以放在单独的 CSS 文件中）
const styles = `
.network-list-item:hover {
  background-color: #f5f5f5 !important;
}

.network-list-item.selected {
  background-color: #e6f7ff !important;
  border-color: #1890ff !important;
}
`;

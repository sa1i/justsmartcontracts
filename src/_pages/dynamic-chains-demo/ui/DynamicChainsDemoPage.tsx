import React, { useState } from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  Row,
  Col,
  Alert,
  Divider,
  Tag,
  List,
  Statistic,
  Switch,
} from "antd";
import {
  GlobalOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  NetworkRpcPanel,
  NetworkPermissionsButton,
} from "@features/network-selector";
import {
  useNetworks,
  useNetworkSelection,
  useNetworkPermissions,
} from "@shared/lib/chainlist";
import {
  getNetworkContractStatus,
} from "@shared/lib/chainlist/adapter";
import { useAccount, useChains } from "wagmi";

const { Title, Text, Paragraph } = Typography;

export const DynamicChainsDemoPage: React.FC = () => {
  const { networks, isLoading } = useNetworks();
  const { selectedNetwork } = useNetworkSelection();
  const { getNetworkPermission, setNetworkPermission } = useNetworkPermissions();
  const { address, isConnected } = useAccount();
  const chains = useChains();

  const [showOnlyAllowed, setShowOnlyAllowed] = useState(false);

  // 获取允许合约交互的网络
  const getAllowedNetworks = () => {
    return networks.filter(network => {
      const permission = getNetworkPermission(network.chainId);
      const status = getNetworkContractStatus(network, permission);
      return status.allowed;
    });
  };

  // 获取被禁用的网络
  const getDisabledNetworks = () => {
    return networks.filter(network => {
      const permission = getNetworkPermission(network.chainId);
      const status = getNetworkContractStatus(network, permission);
      return !status.allowed;
    });
  };

  const allowedNetworks = getAllowedNetworks();
  const disabledNetworks = getDisabledNetworks();
  const displayNetworks = showOnlyAllowed ? allowedNetworks : networks;

  // 切换网络权限
  const toggleNetworkPermission = (chainId: number, allowed: boolean) => {
    setNetworkPermission(chainId, {
      allowContractInteraction: allowed,
      reason: allowed ? undefined : "Disabled by user",
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          Dynamic Multi-Chain Management
        </Title>
        <Paragraph type="secondary">
          Manage which networks are allowed for contract interactions. Only enabled networks
          will be available in the Web3 provider configuration.
        </Paragraph>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Networks"
              value={networks.length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Allowed Networks"
              value={allowedNetworks.length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Disabled Networks"
              value={disabledNetworks.length}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Wagmi Chains"
              value={chains.length}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 当前网络状态 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Current Network & RPC Configuration">
            <NetworkRpcPanel
              layout="vertical"
              onNetworkChange={(network) => {
                console.log("Network changed:", network);
              }}
            />
            
            {selectedNetwork && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message={`Selected Network: ${selectedNetwork.name}`}
                  description={`Chain ID: ${selectedNetwork.chainId} | Native Currency: ${selectedNetwork.nativeCurrency.symbol}`}
                  type="info"
                  showIcon
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 钱包状态 */}
      {isConnected && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Alert
              message="Wallet Connected"
              description={`Address: ${address} | Available chains in Wagmi: ${chains.length}`}
              type="success"
              showIcon
              action={
                <Space>
                  <Text type="secondary">Chains: {chains.map(c => c.name).join(", ")}</Text>
                </Space>
              }
            />
          </Col>
        </Row>
      )}

      {/* 网络管理 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                <span>Network Permissions Management</span>
              </Space>
            }
            extra={
              <Space>
                <Text>Show only allowed:</Text>
                <Switch
                  checked={showOnlyAllowed}
                  onChange={setShowOnlyAllowed}
                  size="small"
                />
                <NetworkPermissionsButton />
              </Space>
            }
          >
            <List
              loading={isLoading}
              dataSource={displayNetworks}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} networks`,
              }}
              renderItem={(network) => {
                const permission = getNetworkPermission(network.chainId);
                const status = getNetworkContractStatus(network, permission);
                
                return (
                  <List.Item
                    actions={[
                      <Switch
                        key="toggle"
                        checked={status.allowed}
                        onChange={(checked) => toggleNetworkPermission(network.chainId, checked)}
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{network.name}</Text>
                          <Text type="secondary">({network.shortName})</Text>
                          <Tag color={status.allowed ? 'green' : 'red'}>
                            {status.allowed ? 'Allowed' : 'Disabled'}
                          </Tag>
                          {status.source === 'user' && (
                            <Tag color="purple">Custom</Tag>
                          )}
                          {network.testnet && (
                            <Tag color="orange">Testnet</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">
                            Chain ID: {network.chainId} | 
                            Currency: {network.nativeCurrency.symbol} |
                            RPCs: {network.rpcUrls.length}
                          </Text>
                          {!status.allowed && status.reason && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Reason: {status.reason}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 帮助信息 */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Title level={4}>How Dynamic Chain Management Works</Title>
              <ul>
                <li><strong>Automatic Chain Loading:</strong> All enabled networks are automatically added to the Wagmi configuration</li>
                <li><strong>Permission Control:</strong> Toggle network permissions to control which chains are available for contract interactions</li>
                <li><strong>Real-time Updates:</strong> Changes to network permissions immediately update the Web3 provider configuration</li>
                <li><strong>RPC Management:</strong> Each network can have multiple RPC endpoints with automatic fallback</li>
                <li><strong>Custom Settings:</strong> User preferences override system defaults and are persisted</li>
              </ul>
              
              <Divider />
              
              <Alert
                message="Technical Implementation"
                description={
                  <div>
                    <p>This demo uses the <code>DynamicMultiChainWeb3Provider</code> which:</p>
                    <ul>
                      <li>Dynamically builds the Wagmi chain configuration based on network permissions</li>
                      <li>Automatically configures RPC transports with fallback support</li>
                      <li>Updates the configuration when permissions change</li>
                      <li>Caches chain configurations for performance</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

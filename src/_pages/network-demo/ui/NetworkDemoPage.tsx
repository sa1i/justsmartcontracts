import React, { useState } from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Divider,
  Switch,
  Input,
} from "antd";
import {
  GlobalOutlined,
  SettingOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  NetworkPanel,
  NetworkDisplay,
  RpcSwitcher,
  NetworkRpcPanel,
  NetworkRpcCard,
  NetworkPermissionsButton,
} from "@features/network-selector";
import { EnhancedChainSelect } from "@entities/chain";
import {
  useNetworks,
  useNetworkSelection,
  useNetworkFilters,
  useCustomRpcs,
  useNetworkPermissions,
} from "@shared/lib/chainlist";
import { Chain } from "@shared/lib/web3";
import {
  formatNetworkName,
  getNetworkRiskLevel,
  isNetworkSupported,
  isNetworkAllowedForContracts,
  getNetworkContractStatus,
} from "@shared/lib/chainlist/adapter";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const NetworkDemoPage: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>();
  const [editingReason, setEditingReason] = useState<string>("");

  const { networks, allNetworks, isLoading, error, refreshNetworks } =
    useNetworks();
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();
  const { showTestnets, setShowTestnets } = useNetworkFilters();
  const { customRpcs } = useCustomRpcs();
  const { networkPermissions, getNetworkPermission, setNetworkPermission } =
    useNetworkPermissions();

  const rpcs = getCurrentNetworkRpcs();
  const currentRpc = rpcs[0]; // 简化显示

  const getNetworkStats = () => {
    // 使用 allNetworks 来统计所有网络，包括测试网络
    const mainnetCount = allNetworks.filter((n) => !n.testnet).length;
    const testnetCount = allNetworks.filter((n) => n.testnet).length;
    const supportedCount = allNetworks.filter((n) =>
      isNetworkSupported(n)
    ).length;
    const allowedCount = allNetworks.filter((n) => {
      const userPermission = getNetworkPermission(n.chainId);
      return isNetworkAllowedForContracts(n, userPermission);
    }).length;
    const customPermissionsCount = Object.keys(networkPermissions).length;
    const customRpcCount = Object.values(customRpcs).reduce(
      (acc, rpcs) => acc + rpcs.length,
      0
    );

    return {
      total: allNetworks.length,
      mainnet: mainnetCount,
      testnet: testnetCount,
      supported: supportedCount,
      allowed: allowedCount,
      customPermissions: customPermissionsCount,
      customRpcs: customRpcCount,
    };
  };

  const stats = getNetworkStats();

  // 处理合约交互权限变更
  const handleContractPermissionChange = (allowed: boolean) => {
    if (!selectedNetwork) return;

    setNetworkPermission(selectedNetwork.chainId, {
      allowContractInteraction: allowed,
      reason: allowed ? undefined : editingReason || "Disabled by user",
    });
  };

  // 处理原因变更
  const handleReasonChange = (reason: string) => {
    if (!selectedNetwork) return;

    setNetworkPermission(selectedNetwork.chainId, {
      reason: reason.trim() || undefined,
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          Network Selection Demo
        </Title>
        <Paragraph type="secondary">
          This demo showcases the new network selection system that integrates
          with chainlist.org to provide access to thousands of blockchain
          networks with RPC switching capabilities.
        </Paragraph>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Networks"
              value={stats.total}
              prefix={<GlobalOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Mainnet"
              value={stats.mainnet}
              valueStyle={{ color: "#3f8600" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Testnet"
              value={stats.testnet}
              valueStyle={{ color: "#cf1322" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Supported"
              value={stats.supported}
              valueStyle={{ color: "#1890ff" }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 权限管理统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Allowed for Contracts"
              value={stats.allowed}
              valueStyle={{ color: "#52c41a" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Custom Permissions"
              value={stats.customPermissions}
              valueStyle={{ color: "#722ed1" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Custom RPCs"
              value={stats.customRpcs}
              valueStyle={{ color: "#fa8c16" }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="Failed to load networks"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" onClick={refreshNetworks}>
              Retry
            </Button>
          }
        />
      )}

      <Row gutter={24}>
        {/* 左侧：网络选择器 */}
        <Col span={12}>
          <Card
            title="Network Selection Panel"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshNetworks}
                loading={isLoading}
                size="small"
              >
                Refresh
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>Chainlist Network Selector</Text>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, margin: "4px 0 12px 0" }}
                >
                  Select from {networks.length} networks from chainlist.org
                </Paragraph>
                <NetworkPanel
                  onNetworkChange={(network) => {
                    console.log("Selected network:", network);
                  }}
                />
              </div>

              <Divider />

              <div>
                <Text strong>Enhanced Chain Selector</Text>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, margin: "4px 0 12px 0" }}
                >
                  Traditional selector with chainlist integration
                </Paragraph>
                <EnhancedChainSelect
                  value={selectedChain}
                  onChange={setSelectedChain}
                  showNetworkSelector={true}
                />
              </div>

              <Divider />

              <div>
                <Text strong>Network Permissions Management</Text>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, margin: "4px 0 12px 0" }}
                >
                  Configure which networks are allowed for contract interactions
                </Paragraph>
                <NetworkPermissionsButton />
              </div>

              <Divider />

              <div>
                <Text strong>Network & RPC Panel</Text>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, margin: "4px 0 12px 0" }}
                >
                  Combined network and RPC selection with different layouts
                </Paragraph>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Horizontal Layout:
                    </Text>
                    <NetworkRpcPanel layout="horizontal" size="small" />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Compact Layout:
                    </Text>
                    <NetworkRpcPanel layout="compact" size="small" />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Vertical Layout:
                    </Text>
                    <NetworkRpcPanel layout="vertical" size="small" />
                  </div>
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong>RPC Switcher</Text>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, margin: "4px 0 12px 0" }}
                >
                  Standalone RPC endpoint switcher with testing
                </Paragraph>
                <RpcSwitcher size="small" />
              </div>
            </Space>
          </Card>
        </Col>

        {/* 右侧：选择的网络信息 */}
        <Col span={12}>
          <Card title="Selected Network Info">
            {selectedNetwork ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <NetworkDisplay
                    network={selectedNetwork}
                    rpcName={currentRpc?.name}
                    size="large"
                  />
                </div>

                <div>
                  <Space wrap>
                    <Tag color={selectedNetwork.testnet ? "orange" : "green"}>
                      {selectedNetwork.testnet ? "Testnet" : "Mainnet"}
                    </Tag>
                    <Tag
                      color={
                        isNetworkSupported(selectedNetwork) ? "blue" : "red"
                      }
                    >
                      {isNetworkSupported(selectedNetwork)
                        ? "Supported"
                        : "Unsupported"}
                    </Tag>
                    <Tag
                      color={
                        getNetworkRiskLevel(selectedNetwork) === "low"
                          ? "green"
                          : getNetworkRiskLevel(selectedNetwork) === "medium"
                          ? "orange"
                          : "red"
                      }
                    >
                      {getNetworkRiskLevel(selectedNetwork)} Risk
                    </Tag>
                  </Space>
                </div>

                <div>
                  <Text strong>Chain ID:</Text> {selectedNetwork.chainId}
                </div>
                <div>
                  <Text strong>Native Currency:</Text>{" "}
                  {selectedNetwork.nativeCurrency.symbol}
                </div>
                <div>
                  <Text strong>RPC Endpoints:</Text>{" "}
                  {selectedNetwork.rpcUrls.length}
                </div>
                {selectedNetwork.blockExplorers &&
                  selectedNetwork.blockExplorers.length > 0 && (
                    <div>
                      <Text strong>Block Explorer:</Text>{" "}
                      <a
                        href={selectedNetwork.blockExplorers[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedNetwork.blockExplorers[0].name}
                      </a>
                    </div>
                  )}

                {selectedNetwork.redFlags &&
                  selectedNetwork.redFlags.length > 0 && (
                    <Alert
                      message="Network Warnings"
                      description={selectedNetwork.redFlags.join(", ")}
                      type="warning"
                      showIcon
                      size="small"
                    />
                  )}

                <Divider />

                {/* 合约交互权限配置 */}
                <div>
                  <Text strong>Contract Interaction Permission</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      const userPermission = getNetworkPermission(
                        selectedNetwork.chainId
                      );
                      const contractStatus = getNetworkContractStatus(
                        selectedNetwork,
                        userPermission
                      );

                      return (
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Space>
                              <Text>Allow contract interactions:</Text>
                              <Switch
                                checked={contractStatus.allowed}
                                onChange={handleContractPermissionChange}
                                size="small"
                              />
                            </Space>
                            <Tag
                              color={
                                contractStatus.source === "user"
                                  ? "purple"
                                  : "blue"
                              }
                            >
                              {contractStatus.source === "user"
                                ? "Custom"
                                : "System Default"}
                            </Tag>
                          </div>

                          {!contractStatus.allowed && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Reason for blocking:
                              </Text>
                              <TextArea
                                value={userPermission.reason || editingReason}
                                onChange={(e) => {
                                  setEditingReason(e.target.value);
                                  handleReasonChange(e.target.value);
                                }}
                                placeholder="Enter reason for blocking this network..."
                                rows={2}
                                style={{ marginTop: 4 }}
                                size="small"
                              />
                            </div>
                          )}

                          <Alert
                            message={
                              contractStatus.allowed
                                ? "Network Enabled"
                                : "Network Disabled"
                            }
                            description={
                              contractStatus.allowed
                                ? "This network can be used for smart contract interactions."
                                : contractStatus.reason ||
                                  "This network is disabled for contract interactions."
                            }
                            type={
                              contractStatus.allowed ? "success" : "warning"
                            }
                            showIcon
                            size="small"
                          />
                        </Space>
                      );
                    })()}
                  </div>
                </div>
              </Space>
            ) : (
              <div style={{ textAlign: "center", padding: 40 }}>
                <InfoCircleOutlined
                  style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
                />
                <Text type="secondary">No network selected</Text>
              </div>
            )}
          </Card>

          {/* RPC 信息 */}
          {selectedNetwork && rpcs.length > 0 && (
            <Card title="RPC Endpoints" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {rpcs.slice(0, 3).map((rpc, index) => {
                  // 确保 key 是字符串，防止对象被用作 key
                  const rpcKey =
                    typeof rpc.url === "string"
                      ? rpc.url
                      : `rpc-${index}-${rpc.name || "unknown"}`;

                  return (
                    <div
                      key={rpcKey}
                      style={{
                        padding: 8,
                        border: "1px solid #f0f0f0",
                        borderRadius: 4,
                        backgroundColor:
                          index === 0 ? "#f6ffed" : "transparent",
                      }}
                    >
                      <Space>
                        <Text strong>{rpc.name}</Text>
                        {index === 0 && (
                          <Tag color="green" size="small">
                            Active
                          </Tag>
                        )}
                        {rpc.isCustom && (
                          <Tag color="blue" size="small">
                            Custom
                          </Tag>
                        )}
                      </Space>
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: 11, wordBreak: "break-all" }}
                        >
                          {rpc.url}
                        </Text>
                      </div>
                    </div>
                  );
                })}
                {rpcs.length > 3 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ... and {rpcs.length - 3} more endpoints
                  </Text>
                )}
              </Space>
            </Card>
          )}

          {/* Network & RPC Status Card */}
          {selectedNetwork && (
            <NetworkRpcCard
              title="Network & RPC Status"
              style={{ marginTop: 16 }}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

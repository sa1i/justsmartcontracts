import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Switch,
  Button,
  Space,
  Typography,
  Input,
  Badge,
  Tooltip,
  Alert,
  Divider,
  message,
  Popconfirm,
} from "antd";
import {
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  useNetworks,
  useNetworkPermissions,
} from "@shared/lib/chainlist/store";
import {
  isNetworkSupported,
  isNetworkAllowedForContracts,
  getNetworkContractStatus,
} from "@shared/lib/chainlist/adapter";
import { NetworkConfig, NetworkPermission } from "@shared/lib/chainlist/types";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface NetworkPermissionsManagerProps {
  visible: boolean;
  onClose: () => void;
}

interface NetworkPermissionRow {
  key: string;
  network: NetworkConfig;
  systemSupported: boolean;
  userPermission: NetworkPermission;
  currentStatus: {
    allowed: boolean;
    source: "system" | "user";
    reason?: string;
  };
}

export const NetworkPermissionsManager: React.FC<
  NetworkPermissionsManagerProps
> = ({ visible, onClose }) => {
  const { networks, isLoading, fetchNetworks } = useNetworks();
  const {
    networkPermissions,
    setNetworkPermission,
    getNetworkPermission,
    resetNetworkPermissions,
  } = useNetworkPermissions();

  const [editingReason, setEditingReason] = useState<{
    chainId: number;
    reason: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (visible && networks.length === 0 && !isLoading) {
      fetchNetworks();
    }
  }, [visible, networks.length, isLoading, fetchNetworks]);

  const getTableData = (): NetworkPermissionRow[] => {
    return networks.map((network) => {
      const userPermission = getNetworkPermission(network.chainId);
      const systemSupported = isNetworkSupported(network);
      const currentStatus = getNetworkContractStatus(network, userPermission);

      return {
        key: `${network.chainId}`,
        network,
        systemSupported,
        userPermission,
        currentStatus,
      };
    });
  };

  const handlePermissionChange = (chainId: number, allowed: boolean) => {
    setNetworkPermission(chainId, {
      allowContractInteraction: allowed,
    });
    setHasChanges(true);
  };

  const handleReasonChange = (chainId: number, reason: string) => {
    setNetworkPermission(chainId, {
      reason: reason.trim() || undefined,
    });
    setHasChanges(true);
  };

  const handleResetAll = () => {
    resetNetworkPermissions();
    setHasChanges(true);
    message.success("All custom permissions have been reset");
  };

  const handleSave = () => {
    setHasChanges(false);
    message.success("Network permissions saved");
  };

  const columns = [
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      width: 200,
      render: (network: NetworkConfig) => (
        <Space direction="vertical" size={2}>
          <Text strong>{network.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Chain ID: {network.chainId}
          </Text>
          {network.testnet && <Badge status="warning" text="Testnet" />}
        </Space>
      ),
    },
    {
      title: "System Support",
      dataIndex: "systemSupported",
      key: "systemSupported",
      width: 120,
      render: (supported: boolean) => (
        <Badge
          status={supported ? "success" : "default"}
          text={supported ? "Supported" : "Not Supported"}
        />
      ),
    },
    {
      title: "Contract Interaction",
      key: "permission",
      width: 150,
      render: (_: any, record: NetworkPermissionRow) => {
        const { network, userPermission, currentStatus } = record;

        return (
          <Space direction="vertical" size={4}>
            <Switch
              checked={currentStatus.allowed}
              onChange={(checked) =>
                handlePermissionChange(network.chainId, checked)
              }
              size="small"
            />
            <Text style={{ fontSize: 11 }} type="secondary">
              {currentStatus.source === "user" ? "Custom" : "Default"}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: NetworkPermissionRow) => {
        const { currentStatus } = record;

        if (currentStatus.allowed) {
          return <Badge status="success" text="Allowed" />;
        } else {
          return (
            <Tooltip title={currentStatus.reason}>
              <Badge status="error" text="Blocked" />
            </Tooltip>
          );
        }
      },
    },
    {
      title: "Reason",
      key: "reason",
      render: (_: any, record: NetworkPermissionRow) => {
        const { network, userPermission } = record;

        if (!userPermission.isUserOverride) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Space>
            <Text style={{ fontSize: 12 }}>
              {userPermission.reason || "No reason provided"}
            </Text>
            <Button
              type="link"
              size="small"
              onClick={() =>
                setEditingReason({
                  chainId: network.chainId,
                  reason: userPermission.reason || "",
                })
              }
            >
              Edit
            </Button>
          </Space>
        );
      },
    },
  ];

  const tableData = getTableData();
  const customPermissionsCount = tableData.filter(
    (row) => row.userPermission.isUserOverride
  ).length;
  const allowedCount = tableData.filter(
    (row) => row.currentStatus.allowed
  ).length;

  return (
    <>
      <Modal
        title={
          <Space>
            <SettingOutlined />
            <span>Network Permissions Manager</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={900}
        footer={[
          <Button
            key="reset"
            onClick={handleResetAll}
            disabled={customPermissionsCount === 0}
          >
            Reset All
          </Button>,
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
          hasChanges && (
            <Button
              key="save"
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          ),
        ].filter(Boolean)}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 概览信息 */}
          <Alert
            message="Network Permissions Overview"
            description={
              <Space direction="vertical">
                <Text>
                  Configure which networks are allowed for smart contract
                  interactions. You can override system defaults for any
                  network.
                </Text>
                <Space>
                  <Text>
                    <Text strong>{allowedCount}</Text> of{" "}
                    <Text strong>{tableData.length}</Text> networks allowed
                  </Text>
                  <Divider type="vertical" />
                  <Text>
                    <Text strong>{customPermissionsCount}</Text> custom
                    permissions
                  </Text>
                </Space>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 权限表格 */}
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} networks`,
            }}
            size="small"
            scroll={{ y: 400 }}
            loading={isLoading}
          />

          {/* 说明 */}
          <Alert
            message="How it works"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>System supported networks are enabled by default</li>
                <li>
                  You can override any network&apos;s permission using the
                  switch
                </li>
                <li>Custom permissions take precedence over system defaults</li>
                <li>
                  Blocked networks cannot be used for contract interactions
                </li>
              </ul>
            }
            type="info"
            showIcon={false}
            style={{ marginTop: 16 }}
          />
        </Space>
      </Modal>

      {/* 编辑原因对话框 */}
      <Modal
        title="Edit Reason"
        open={!!editingReason}
        onCancel={() => setEditingReason(null)}
        onOk={() => {
          if (editingReason) {
            handleReasonChange(editingReason.chainId, editingReason.reason);
            setEditingReason(null);
          }
        }}
        width={400}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>Provide a reason for this permission setting:</Text>
          <TextArea
            value={editingReason?.reason || ""}
            onChange={(e) =>
              setEditingReason((prev) =>
                prev ? { ...prev, reason: e.target.value } : null
              )
            }
            placeholder="e.g., Network not secure enough for production use"
            rows={3}
            maxLength={200}
          />
        </Space>
      </Modal>
    </>
  );
};

// 网络权限管理按钮组件
export const NetworkPermissionsButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button icon={<SettingOutlined />} onClick={() => setVisible(true)}>
        Network Permissions
      </Button>

      <NetworkPermissionsManager
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

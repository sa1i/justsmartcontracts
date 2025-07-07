import React, { useState } from "react";
import {
  Modal,
  List,
  Button,
  Space,
  Typography,
  Badge,
  Input,
  Form,
  message,
  Popconfirm,
  Tooltip,
  Tag,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  useNetworkSelection,
  useCustomRpcs,
} from "@shared/lib/chainlist/store";
import { RpcConfig } from "@shared/lib/chainlist/types";

const { Text, Title } = Typography;

interface RpcSelectorProps {
  visible: boolean;
  onClose: () => void;
}

interface RpcTestResult {
  url: string;
  status: "testing" | "success" | "error" | "timeout";
  responseTime?: number;
  error?: string;
  blockNumber?: number;
}

export const RpcSelector: React.FC<RpcSelectorProps> = ({
  visible,
  onClose,
}) => {
  const {
    selectedNetwork,
    selectedRpcIndex,
    selectRpc,
    getCurrentNetworkRpcs,
  } = useNetworkSelection();

  const { addCustomRpc, removeCustomRpc, updateCustomRpc } = useCustomRpcs();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRpc, setEditingRpc] = useState<RpcConfig | null>(null);
  const [form] = Form.useForm();

  // RPC测试相关状态
  const [testResults, setTestResults] = useState<Map<string, RpcTestResult>>(
    new Map()
  );
  const [isTesting, setIsTesting] = useState(false);

  const rpcs = getCurrentNetworkRpcs();

  const handleRpcSelect = (index: number) => {
    selectRpc(index);
  };

  const handleAddRpc = async (values: { name: string; url: string }) => {
    if (!selectedNetwork) return;

    try {
      // 验证 URL 格式
      new URL(values.url);

      // 检查是否已存在
      const exists = rpcs.some((rpc) => rpc.url === values.url);
      if (exists) {
        message.error("This RPC URL already exists");
        return;
      }

      const newRpc: RpcConfig = {
        url: values.url,
        name: values.name,
        isDefault: false,
        isCustom: true,
      };

      addCustomRpc(selectedNetwork.chainId, newRpc);
      message.success("Custom RPC added successfully");
      setShowAddForm(false);
      form.resetFields();
    } catch (error) {
      message.error("Invalid URL format");
    }
  };

  const handleEditRpc = async (values: { name: string; url: string }) => {
    if (!selectedNetwork || !editingRpc) return;

    try {
      // 验证 URL 格式
      new URL(values.url);

      const updatedRpc: RpcConfig = {
        ...editingRpc,
        url: values.url,
        name: values.name,
      };

      updateCustomRpc(selectedNetwork.chainId, editingRpc.url, updatedRpc);
      message.success("RPC updated successfully");
      setEditingRpc(null);
      form.resetFields();
    } catch (error) {
      message.error("Invalid URL format");
    }
  };

  const handleDeleteRpc = (rpc: RpcConfig) => {
    if (!selectedNetwork) return;

    removeCustomRpc(selectedNetwork.chainId, rpc.url);
    message.success("Custom RPC removed");

    // 如果删除的是当前选中的 RPC，切换到第一个
    if (selectedRpcIndex >= rpcs.length - 1) {
      selectRpc(0);
    }
  };

  // 测试单个RPC
  const testSingleRpc = async (rpc: RpcConfig): Promise<RpcTestResult> => {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(rpc.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (data.error) {
        throw new Error(data.error.message || "RPC Error");
      }

      const blockNumber = data.result ? parseInt(data.result, 16) : undefined;

      return {
        url: rpc.url,
        status: "success",
        responseTime,
        blockNumber,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      if (error.name === "AbortError") {
        return {
          url: rpc.url,
          status: "timeout",
          responseTime,
          error: "Request timeout (>10s)",
        };
      }

      return {
        url: rpc.url,
        status: "error",
        responseTime,
        error: error.message || "Unknown error",
      };
    }
  };

  // 测试所有RPC
  const testAllRpcs = async () => {
    if (!selectedNetwork || rpcs.length === 0) return;

    setIsTesting(true);
    setTestResults(new Map());

    try {
      // 初始化测试状态
      const initialResults = new Map<string, RpcTestResult>();
      rpcs.forEach((rpc) => {
        initialResults.set(rpc.url, {
          url: rpc.url,
          status: "testing",
        });
      });
      setTestResults(new Map(initialResults));

      // 并发测试所有RPC
      const testPromises = rpcs.map(async (rpc) => {
        const result = await testSingleRpc(rpc);
        setTestResults((prev) => new Map(prev.set(rpc.url, result)));
        return result;
      });

      await Promise.all(testPromises);
      message.success(`Tested ${rpcs.length} RPC endpoints`);
    } catch (error) {
      message.error("Failed to test RPC endpoints");
    } finally {
      setIsTesting(false);
    }
  };

  const startEdit = (rpc: RpcConfig) => {
    setEditingRpc(rpc);
    form.setFieldsValue({
      name: rpc.name,
      url: rpc.url,
    });
  };

  const getRpcStatus = (rpc: RpcConfig, index: number) => {
    const testResult = testResults.get(rpc.url);

    // 如果有测试结果，优先显示测试状态
    if (testResult) {
      switch (testResult.status) {
        case "testing":
          return (
            <Space>
              <Spin size="small" indicator={<LoadingOutlined />} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Testing...
              </Text>
            </Space>
          );
        case "success":
          return (
            <Space>
              <Badge status="success" />
              <Tag color="green" style={{ fontSize: 11 }}>
                {testResult.responseTime}ms
              </Tag>
              {testResult.blockNumber && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Block: {testResult.blockNumber.toLocaleString()}
                </Text>
              )}
            </Space>
          );
        case "error":
          return (
            <Space>
              <Badge status="error" />
              <Tag color="red" style={{ fontSize: 11 }}>
                Error
              </Tag>
              <Tooltip title={testResult.error}>
                <Text type="danger" style={{ fontSize: 11 }}>
                  {testResult.error?.substring(0, 20)}...
                </Text>
              </Tooltip>
            </Space>
          );
        case "timeout":
          return (
            <Space>
              <Badge status="warning" />
              <Tag color="orange" style={{ fontSize: 11 }}>
                Timeout
              </Tag>
            </Space>
          );
      }
    }

    // 默认状态显示
    if (index === selectedRpcIndex) {
      return <Badge status="success" text="Active" />;
    }
    if (rpc.isDefault) {
      return <Badge status="default" text="Default" />;
    }
    if (rpc.isCustom) {
      return <Badge status="processing" text="Custom" />;
    }
    return null;
  };

  if (!selectedNetwork) {
    return null;
  }

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <GlobalOutlined />
            <span>RPC Endpoints - {selectedNetwork.name}</span>
          </Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={testAllRpcs}
            loading={isTesting}
            size="small"
          >
            {isTesting ? "Testing..." : "Test All"}
          </Button>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {/* 添加自定义 RPC 按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setShowAddForm(true)}
          block
        >
          Add Custom RPC
        </Button>
      </div>

      {/* 添加/编辑 RPC 表单 */}
      {(showAddForm || editingRpc) && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            backgroundColor: "#fafafa",
          }}
        >
          <Title level={5}>{editingRpc ? "Edit RPC" : "Add Custom RPC"}</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={editingRpc ? handleEditRpc : handleAddRpc}
          >
            <Form.Item
              name="name"
              label="RPC Name"
              rules={[{ required: true, message: "Please enter RPC name" }]}
            >
              <Input placeholder="e.g., My Custom RPC" />
            </Form.Item>
            <Form.Item
              name="url"
              label="RPC URL"
              rules={[
                { required: true, message: "Please enter RPC URL" },
                { type: "url", message: "Please enter a valid URL" },
              ]}
            >
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingRpc ? "Update" : "Add"}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRpc(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}

      {/* RPC 列表 */}
      <List
        dataSource={rpcs}
        renderItem={(rpc, index) => (
          <List.Item
            key={rpc.url}
            actions={[
              rpc.isCustom && (
                <Tooltip title="Edit RPC">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => startEdit(rpc)}
                  />
                </Tooltip>
              ),
              rpc.isCustom && (
                <Popconfirm
                  title="Delete this RPC?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDeleteRpc(rpc)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Tooltip title="Delete RPC">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              ),
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Button
                    type={index === selectedRpcIndex ? "primary" : "default"}
                    size="small"
                    onClick={() => handleRpcSelect(index)}
                    icon={
                      index === selectedRpcIndex ? (
                        <CheckCircleOutlined />
                      ) : undefined
                    }
                  >
                    {index === selectedRpcIndex ? "Active" : "Select"}
                  </Button>
                  <Text strong>{rpc.name}</Text>
                  {getRpcStatus(rpc, index)}
                </Space>
              }
              description={
                <Text
                  type="secondary"
                  style={{ fontSize: 12, wordBreak: "break-all" }}
                >
                  {rpc.url}
                </Text>
              }
            />
          </List.Item>
        )}
      />

      {/* 底部信息 */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #f0f0f0",
          textAlign: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          {rpcs.length} RPC endpoint{rpcs.length > 1 ? "s" : ""} available
        </Text>
      </div>
    </Modal>
  );
};

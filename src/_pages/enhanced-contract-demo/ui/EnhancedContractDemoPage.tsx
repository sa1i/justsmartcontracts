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
  Input,
  Form,
  message,
} from "antd";
import {
  GlobalOutlined,
  SendOutlined,
  DeploymentUnitOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  NetworkRpcPanel,
  NetworkPermissionsButton,
} from "@features/network-selector";
import {
  useNetworkSelection,
  useNetworkPermissions,
} from "@shared/lib/chainlist";
import {
  isNetworkAllowedForContracts,
  getNetworkContractStatus,
} from "@shared/lib/chainlist/adapter";
import { useWalletClient, useAccount } from "wagmi";
import { parseEther } from "viem";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const EnhancedContractDemoPage: React.FC = () => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } =
    useNetworkSelection();
  const { getNetworkPermission } = useNetworkPermissions();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const [deployForm] = Form.useForm();
  const [callForm] = Form.useForm();
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const rpcs = getCurrentNetworkRpcs();
  const currentRpc = rpcs[selectedRpcIndex];

  // 获取网络合约交互状态
  const getContractInteractionStatus = () => {
    if (!selectedNetwork) {
      return {
        allowed: false,
        reason: "No network selected",
        source: "system" as const,
      };
    }

    const userPermission = getNetworkPermission(selectedNetwork.chainId);
    return getNetworkContractStatus(selectedNetwork, userPermission);
  };

  const contractStatus = getContractInteractionStatus();

  // 模拟合约部署
  const handleDeploy = async (values: { bytecode: string; constructor: string }) => {
    if (!walletClient || !selectedNetwork) {
      message.error("Wallet not connected or no network selected");
      return;
    }

    if (!contractStatus.allowed) {
      message.error(
        `Contract interactions are disabled for ${selectedNetwork.name}. ${
          contractStatus.reason || ""
        }`
      );
      return;
    }

    setIsDeploying(true);
    try {
      // 这里是模拟的部署逻辑
      await new Promise((resolve) => setTimeout(resolve, 2000));
      message.success("Contract deployed successfully!");
      deployForm.resetFields();
    } catch (error) {
      message.error("Failed to deploy contract");
      console.error(error);
    } finally {
      setIsDeploying(false);
    }
  };

  // 模拟合约调用
  const handleCall = async (values: { address: string; method: string; params: string }) => {
    if (!walletClient || !selectedNetwork) {
      message.error("Wallet not connected or no network selected");
      return;
    }

    if (!contractStatus.allowed) {
      message.error(
        `Contract interactions are disabled for ${selectedNetwork.name}. ${
          contractStatus.reason || ""
        }`
      );
      return;
    }

    setIsCalling(true);
    try {
      // 这里是模拟的合约调用逻辑
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success("Contract method called successfully!");
      callForm.resetFields();
    } catch (error) {
      message.error("Failed to call contract method");
      console.error(error);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          <DeploymentUnitOutlined style={{ marginRight: 8 }} />
          Enhanced Contract Interaction Demo
        </Title>
        <Paragraph type="secondary">
          This demo showcases contract interactions using the new network selector
          and RPC configuration system with permission controls.
        </Paragraph>
      </div>

      {/* 网络和RPC状态 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Network & RPC Configuration">
            <Space direction="vertical" style={{ width: "100%" }}>
              <NetworkRpcPanel
                layout="vertical"
                onNetworkChange={(network) => {
                  console.log("Network changed:", network);
                }}
              />
              
              <Divider />
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Selected Network:</Text>
                  <div style={{ marginTop: 4 }}>
                    {selectedNetwork ? (
                      <Space>
                        <Text>{selectedNetwork.name}</Text>
                        <Text type="secondary">(Chain ID: {selectedNetwork.chainId})</Text>
                      </Space>
                    ) : (
                      <Text type="secondary">No network selected</Text>
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Current RPC:</Text>
                  <div style={{ marginTop: 4 }}>
                    {currentRpc ? (
                      <Text>{currentRpc.name}</Text>
                    ) : (
                      <Text type="secondary">No RPC selected</Text>
                    )}
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 合约交互权限状态 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Alert
            message={
              contractStatus.allowed
                ? "Contract Interactions Enabled"
                : "Contract Interactions Disabled"
            }
            description={
              contractStatus.allowed
                ? `You can deploy and interact with contracts on ${
                    selectedNetwork?.name || "the selected network"
                  }.`
                : contractStatus.reason ||
                  "Contract interactions are not allowed for this network."
            }
            type={contractStatus.allowed ? "success" : "warning"}
            showIcon
            action={
              <Space>
                <NetworkPermissionsButton />
                {!isConnected && (
                  <Button type="primary" size="small">
                    Connect Wallet
                  </Button>
                )}
              </Space>
            }
          />
        </Col>
      </Row>

      {/* 钱包状态 */}
      {isConnected && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card size="small">
              <Space>
                <Text strong>Connected Wallet:</Text>
                <Text code>{address}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 合约部署和调用 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <DeploymentUnitOutlined />
                <span>Deploy Contract</span>
              </Space>
            }
          >
            <Form
              form={deployForm}
              layout="vertical"
              onFinish={handleDeploy}
              disabled={!contractStatus.allowed || !isConnected}
            >
              <Form.Item
                name="bytecode"
                label="Contract Bytecode"
                rules={[{ required: true, message: "Please enter bytecode" }]}
              >
                <TextArea
                  rows={4}
                  placeholder="0x608060405234801561001057600080fd5b50..."
                />
              </Form.Item>
              
              <Form.Item
                name="constructor"
                label="Constructor Parameters"
              >
                <Input placeholder="param1,param2,param3" />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isDeploying}
                  disabled={!contractStatus.allowed || !isConnected}
                  block
                >
                  Deploy Contract
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <Space>
                <SendOutlined />
                <span>Call Contract</span>
              </Space>
            }
          >
            <Form
              form={callForm}
              layout="vertical"
              onFinish={handleCall}
              disabled={!contractStatus.allowed || !isConnected}
            >
              <Form.Item
                name="address"
                label="Contract Address"
                rules={[{ required: true, message: "Please enter contract address" }]}
              >
                <Input placeholder="0x..." />
              </Form.Item>
              
              <Form.Item
                name="method"
                label="Method Name"
                rules={[{ required: true, message: "Please enter method name" }]}
              >
                <Input placeholder="transfer" />
              </Form.Item>
              
              <Form.Item
                name="params"
                label="Parameters"
              >
                <Input placeholder="param1,param2,param3" />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCalling}
                  disabled={!contractStatus.allowed || !isConnected}
                  block
                >
                  Call Method
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 帮助信息 */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Title level={4}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                How to Use
              </Title>
              <ul>
                <li>Select a network using the network selector above</li>
                <li>Choose an RPC endpoint for the selected network</li>
                <li>Ensure contract interactions are enabled for the network</li>
                <li>Connect your wallet to start deploying and calling contracts</li>
                <li>Use the Network Permissions button to manage interaction settings</li>
              </ul>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

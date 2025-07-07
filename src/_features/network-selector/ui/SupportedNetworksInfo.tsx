import React, { useState } from "react";
import {
  Modal,
  Button,
  Table,
  Typography,
  Space,
  Tag,
  Badge,
  Collapse,
  Alert,
} from "antd";
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Chain, getChainConfig } from "@shared/lib/web3";
import { SupportedChains } from "@entities/chain/model";

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface SupportedNetworksInfoProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportedNetworksInfo: React.FC<SupportedNetworksInfoProps> = ({
  visible,
  onClose,
}) => {
  const getSupportedNetworksData = () => {
    return SupportedChains.map((chain) => {
      const config = getChainConfig(chain);
      return {
        key: chain,
        chain,
        name: config.name,
        chainId: chain,
        symbol: "ETH", // 默认使用 ETH
        testnet: config.testnet || false,
        explorer: config.explorer || "",
      };
    });
  };

  const data = getSupportedNetworksData();
  const mainnetCount = data.filter((n) => !n.testnet).length;
  const testnetCount = data.filter((n) => n.testnet).length;

  const columns = [
    {
      title: "Network",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <Space>
          <Text strong>{name}</Text>
          {record.testnet && (
            <Tag color="orange">
              Testnet
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Chain ID",
      dataIndex: "chainId",
      key: "chainId",
      width: 100,
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      width: 80,
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: () => <Badge status="success" text="Supported" />,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          <span>Supported Networks</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={800}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 概览信息 */}
        <Alert
          message="Network Support Overview"
          description={
            <Space direction="vertical">
              <Text>
                Our system currently supports{" "}
                <Text strong>{data.length} networks</Text> for smart contract
                interactions: <Text strong>{mainnetCount} mainnets</Text> and{" "}
                <Text strong>{testnetCount} testnets</Text>.
              </Text>
              <Text type="secondary">
                Networks not in this list can be viewed but cannot be used for
                contract interactions.
              </Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 网络列表 */}
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
        />

        {/* 详细说明 */}
        <Collapse ghost>
          <Panel
            header={
              <Space>
                <InfoCircleOutlined />
                <Text>Why are some networks not supported?</Text>
              </Space>
            }
            key="1"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>
                <Text strong>Technical Reasons:</Text>
              </Paragraph>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>RPC endpoint stability and reliability requirements</li>
                <li>Smart contract deployment and configuration needs</li>
                <li>Gas fee calculation mechanisms vary across networks</li>
                <li>Different block confirmation times and mechanisms</li>
              </ul>

              <Paragraph style={{ marginTop: 16 }}>
                <Text strong>Security Considerations:</Text>
              </Paragraph>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>Network security and decentralization verification</li>
                <li>Risk assessment to protect users from unsafe networks</li>
                <li>Smart contract auditing on supported networks</li>
              </ul>

              <Paragraph style={{ marginTop: 16 }}>
                <Text strong>User Experience:</Text>
              </Paragraph>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>
                  Ensuring all features work properly on supported networks
                </li>
                <li>Better error handling and user feedback</li>
                <li>Performance optimization for supported networks</li>
              </ul>
            </Space>
          </Panel>

          <Panel
            header={
              <Space>
                <ExclamationCircleOutlined />
                <Text>How to request new network support?</Text>
              </Space>
            }
            key="2"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>
                If you need support for a specific network, you can:
              </Paragraph>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                <li>
                  Contact our development team with your network requirements
                </li>
                <li>
                  Provide technical details about the network (RPC endpoints,
                  documentation)
                </li>
                <li>Explain your use case and why this network is important</li>
                <li>
                  Wait for our team to evaluate and potentially add support
                </li>
              </ol>

              <Alert
                message="Development Priority"
                description="We prioritize adding support for networks with high user demand, strong security, and active development communities."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Space>
          </Panel>
        </Collapse>

        {/* 底部提示 */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 16,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            For the most up-to-date list of supported networks, please check
            this dialog regularly.
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

// 支持网络信息按钮组件
export const SupportedNetworksButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button
        type="link"
        size="small"
        icon={<InfoCircleOutlined />}
        onClick={() => setVisible(true)}
        style={{ padding: 0, height: "auto" }}
      >
        View Supported Networks
      </Button>

      <SupportedNetworksInfo
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

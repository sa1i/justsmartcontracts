import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  message,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  SettingOutlined,
  CloudDownloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNetworks } from '@shared/lib/chainlist/store';
import { NetworkConfigCache } from '@shared/lib/chainlist/networkConfigService';

const { Title, Text, Paragraph } = Typography;

interface NetworkConfigManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const NetworkConfigManager: React.FC<NetworkConfigManagerProps> = ({
  visible,
  onClose,
}) => {
  const {
    networks,
    isLoading,
    error,
    forceUpdateNetworks,
    getNetworkConfigInfo,
    refreshNetworks,
  } = useNetworks();

  const [configInfo, setConfigInfo] = useState<NetworkConfigCache | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConfigInfo();
    }
  }, [visible]);

  const loadConfigInfo = async () => {
    const info = getNetworkConfigInfo();
    setConfigInfo(info);
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      await forceUpdateNetworks();
      await loadConfigInfo();
      message.success('Network configuration updated successfully');
    } catch (error) {
      message.error('Failed to update network configuration');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = async () => {
    setIsUpdating(true);
    try {
      await refreshNetworks();
      await loadConfigInfo();
      message.success('Network configuration refreshed');
    } catch (error) {
      message.error('Failed to refresh network configuration');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSourceInfo = (source: string) => {
    switch (source) {
      case 'chainlist':
        return {
          label: 'Chainlist',
          color: 'green',
          icon: <CloudDownloadOutlined />,
          description: 'Latest data from chainlist.org'
        };
      case 'default':
        return {
          label: 'Default',
          color: 'blue',
          icon: <CheckCircleOutlined />,
          description: 'Using built-in default networks'
        };
      case 'mixed':
        return {
          label: 'Mixed',
          color: 'orange',
          icon: <SettingOutlined />,
          description: 'Custom configuration with user modifications'
        };
      default:
        return {
          label: 'Unknown',
          color: 'default',
          icon: <ExclamationCircleOutlined />,
          description: 'Unknown configuration source'
        };
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const sourceInfo = configInfo ? getSourceInfo(configInfo.source) : null;
  const mainnetCount = networks.filter(n => !n.testnet).length;
  const testnetCount = networks.filter(n => n.testnet).length;

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          Network Configuration Manager
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Configuration Status */}
        <Card>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Networks"
                value={networks.length}
                prefix={<InfoCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Mainnets"
                value={mainnetCount}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Testnets"
                value={testnetCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Source"
                value={sourceInfo?.label || 'Unknown'}
                prefix={sourceInfo?.icon}
                valueStyle={{ color: sourceInfo?.color === 'green' ? '#3f8600' : '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Configuration Details */}
        {configInfo && (
          <Card title="Configuration Details">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Data Source: </Text>
                <Tag color={sourceInfo?.color} icon={sourceInfo?.icon}>
                  {sourceInfo?.label}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {sourceInfo?.description}
                </Text>
              </div>
              
              <div>
                <Text strong>Last Updated: </Text>
                <Text>{formatLastUpdate(configInfo.lastUpdate)}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({new Date(configInfo.lastUpdate).toLocaleString()})
                </Text>
              </div>

              {configInfo.source === 'default' && (
                <Alert
                  message="Using Default Configuration"
                  description="The system is using the built-in default network configuration. Consider updating to get the latest network data."
                  type="info"
                  showIcon
                />
              )}

              {configInfo.source === 'chainlist' && (
                <Alert
                  message="Using Latest Chainlist Data"
                  description="The system is using the most recent network data from chainlist.org."
                  type="success"
                  showIcon
                />
              )}
            </Space>
          </Card>
        )}

        {/* Actions */}
        <Card title="Actions">
          <Space wrap>
            <Tooltip title="Refresh from cache or fetch if cache is expired">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isUpdating && !isLoading}
              >
                Refresh
              </Button>
            </Tooltip>
            
            <Tooltip title="Force update from chainlist.org (ignores cache)">
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={handleForceUpdate}
                loading={isUpdating}
              >
                Force Update from Chainlist
              </Button>
            </Tooltip>
          </Space>

          <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
            <Text type="secondary">
              • <strong>Refresh:</strong> Updates from cache or fetches new data if cache is expired<br/>
              • <strong>Force Update:</strong> Immediately fetches the latest data from chainlist.org
            </Text>
          </Paragraph>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert
            message="Configuration Error"
            description={error}
            type="error"
            showIcon
            closable
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Loading network configuration...</Text>
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};

// 网络配置管理按钮组件
export const NetworkConfigButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button
        icon={<SettingOutlined />}
        onClick={() => setVisible(true)}
        title="Network Configuration Manager"
      >
        Network Config
      </Button>
      
      <NetworkConfigManager
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

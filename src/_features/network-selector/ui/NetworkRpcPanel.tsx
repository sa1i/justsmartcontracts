import React, { useState } from 'react';
import {
  Button,
  Space,
  Typography,
  Avatar,
  Dropdown,
  MenuProps,
  Tag,
  Divider,
  Card,
} from 'antd';
import {
  GlobalOutlined,
  DownOutlined,
  SettingOutlined,
  SwapOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useNetworkSelection } from '@shared/lib/chainlist/store';
import { NetworkConfig } from '@shared/lib/chainlist/types';
import { NetworkSelector } from './NetworkSelector';
import { RpcSelector } from './RpcSelector';
import { RpcSwitcher } from './RpcSwitcher';

const { Text } = Typography;

interface NetworkRpcPanelProps {
  onNetworkChange?: (network: NetworkConfig) => void;
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
  layout?: 'horizontal' | 'vertical' | 'compact';
}

export const NetworkRpcPanel: React.FC<NetworkRpcPanelProps> = ({
  onNetworkChange,
  style,
  size = 'middle',
  layout = 'horizontal',
}) => {
  const {
    selectedNetwork,
    selectedRpcIndex,
    selectNetwork,
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
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          src={`https://icons.llamao.fi/icons/chains/rsz_${network.icon}.jpg`}
          alt={network.name}
        />
      );
    }
    return (
      <Avatar
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
        icon={<GlobalOutlined />}
      />
    );
  };

  const networkDropdownItems: MenuProps['items'] = [
    {
      key: 'switch-network',
      label: 'Switch Network',
      icon: <SwapOutlined />,
      onClick: () => setShowNetworkSelector(true),
    },
    {
      key: 'rpc-settings',
      label: 'RPC Settings',
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

  // Compact layout - single button with both network and RPC info
  if (layout === 'compact') {
    return (
      <>
        <Dropdown
          menu={{ items: networkDropdownItems }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button style={style} size={size}>
            <Space size="small">
              {getNetworkIcon(selectedNetwork)}
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {selectedNetwork.name}
                </div>
                {currentRpc && (
                  <div
                    style={{
                      fontSize: size === 'small' ? 10 : 12,
                      color: '#666',
                      lineHeight: 1.2,
                    }}
                  >
                    {currentRpc.name} • {rpcs.length} RPC{rpcs.length > 1 ? 's' : ''}
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
  }

  // Vertical layout - stacked components
  if (layout === 'vertical') {
    return (
      <div style={style}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
              Network
            </Text>
            <Dropdown
              menu={{ items: networkDropdownItems }}
              trigger={['click']}
              placement="bottomLeft"
            >
              <Button size={size} style={{ width: '100%' }}>
                <Space>
                  {getNetworkIcon(selectedNetwork)}
                  <Text>{selectedNetwork.name}</Text>
                  <DownOutlined style={{ fontSize: 10 }} />
                </Space>
              </Button>
            </Dropdown>
          </div>

          {rpcs.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                RPC Endpoint
              </Text>
              <RpcSwitcher size={size} style={{ width: '100%' }} />
            </div>
          )}
        </Space>

        <NetworkSelector
          visible={showNetworkSelector}
          onClose={() => setShowNetworkSelector(false)}
          onNetworkSelect={handleNetworkSelect}
        />

        <RpcSelector
          visible={showRpcSelector}
          onClose={() => setShowRpcSelector(false)}
        />
      </div>
    );
  }

  // Horizontal layout - side by side components
  return (
    <div style={style}>
      <Space size="middle">
        <Dropdown
          menu={{ items: networkDropdownItems }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Button size={size}>
            <Space size="small">
              {getNetworkIcon(selectedNetwork)}
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {selectedNetwork.name}
                </div>
                <div
                  style={{
                    fontSize: size === 'small' ? 10 : 12,
                    color: '#666',
                    lineHeight: 1.2,
                  }}
                >
                  Chain {selectedNetwork.chainId}
                </div>
              </div>
              <DownOutlined style={{ fontSize: 10 }} />
            </Space>
          </Button>
        </Dropdown>

        {rpcs.length > 0 && (
          <>
            <Divider type="vertical" style={{ margin: 0 }} />
            <RpcSwitcher size={size} showLabel={true} />
          </>
        )}
      </Space>

      <NetworkSelector
        visible={showNetworkSelector}
        onClose={() => setShowNetworkSelector(false)}
        onNetworkSelect={handleNetworkSelect}
      />

      <RpcSelector
        visible={showRpcSelector}
        onClose={() => setShowRpcSelector(false)}
      />
    </div>
  );
};

// 状态卡片组件
export const NetworkRpcCard: React.FC<{
  title?: string;
  extra?: React.ReactNode;
}> = ({ title = 'Network & RPC Status', extra }) => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } = useNetworkSelection();
  
  const rpcs = getCurrentNetworkRpcs();
  const currentRpc = rpcs[selectedRpcIndex];

  return (
    <Card title={title} extra={extra} size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {selectedNetwork ? (
          <>
            <div>
              <Text type="secondary">Network:</Text>
              <div style={{ marginTop: 4 }}>
                <Space>
                  <Avatar
                    size={16}
                    src={
                      selectedNetwork.icon
                        ? `https://icons.llamao.fi/icons/chains/rsz_${selectedNetwork.icon}.jpg`
                        : undefined
                    }
                    icon={!selectedNetwork.icon ? <GlobalOutlined /> : undefined}
                  />
                  <Text strong>{selectedNetwork.name}</Text>
                  <Tag size="small">ID: {selectedNetwork.chainId}</Tag>
                  {selectedNetwork.testnet && (
                    <Tag size="small" color="orange">
                      Testnet
                    </Tag>
                  )}
                </Space>
              </div>
            </div>

            {currentRpc && (
              <div>
                <Text type="secondary">RPC Endpoint:</Text>
                <div style={{ marginTop: 4 }}>
                  <Space>
                    <ApiOutlined />
                    <Text strong>{currentRpc.name}</Text>
                    {currentRpc.isCustom && (
                      <Tag size="small" color="blue">
                        Custom
                      </Tag>
                    )}
                    {currentRpc.isDefault && (
                      <Tag size="small" color="green">
                        Default
                      </Tag>
                    )}
                  </Space>
                  <div style={{ marginTop: 2 }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, wordBreak: 'break-all' }}
                    >
                      {currentRpc.url}
                    </Text>
                  </div>
                </div>
              </div>
            )}

            {rpcs.length > 1 && (
              <div>
                <Text type="secondary">Available RPCs: {rpcs.length}</Text>
              </div>
            )}
          </>
        ) : (
          <Text type="secondary">No network selected</Text>
        )}
      </Space>
    </Card>
  );
};

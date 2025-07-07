import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  Space,
  Typography,
  Tag,
  Tooltip,
  Badge,
  MenuProps,
  message,
} from 'antd';
import {
  SettingOutlined,
  DownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  useNetworkSelection,
  useCustomRpcs,
} from '@shared/lib/chainlist/store';
import { RpcConfig } from '@shared/lib/chainlist/types';

const { Text } = Typography;

interface RpcSwitcherProps {
  size?: 'small' | 'middle' | 'large';
  showLabel?: boolean;
  style?: React.CSSProperties;
}

export const RpcSwitcher: React.FC<RpcSwitcherProps> = ({
  size = 'middle',
  showLabel = true,
  style,
}) => {
  const {
    selectedNetwork,
    selectedRpcIndex,
    selectRpc,
    getCurrentNetworkRpcs,
  } = useNetworkSelection();

  const [testingRpc, setTestingRpc] = useState<number | null>(null);

  const rpcs = getCurrentNetworkRpcs();
  const currentRpc = rpcs[selectedRpcIndex];

  if (!selectedNetwork || rpcs.length === 0) {
    return null;
  }

  const testRpcConnection = async (rpc: RpcConfig, index: number) => {
    setTestingRpc(index);
    try {
      const response = await fetch(rpc.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const returnedChainId = parseInt(data.result, 16);
        
        if (returnedChainId === selectedNetwork.chainId) {
          message.success(`${rpc.name} is working correctly`);
        } else {
          message.warning(`${rpc.name} returned wrong chain ID: ${returnedChainId}`);
        }
      } else {
        message.error(`${rpc.name} connection failed: ${response.statusText}`);
      }
    } catch (error) {
      message.error(`${rpc.name} connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingRpc(null);
    }
  };

  const handleRpcSelect = (index: number) => {
    selectRpc(index);
    message.success(`Switched to ${rpcs[index].name}`);
  };

  const getRpcStatus = (rpc: RpcConfig, index: number) => {
    if (index === selectedRpcIndex) {
      return <Badge status="success" />;
    }
    if (rpc.isDefault) {
      return <Badge status="default" />;
    }
    return <Badge status="processing" />;
  };

  const menuItems: MenuProps['items'] = rpcs.map((rpc, index) => ({
    key: index,
    label: (
      <div style={{ minWidth: 200 }}>
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              {getRpcStatus(rpc, index)}
              <Text strong={index === selectedRpcIndex}>
                {rpc.name}
              </Text>
              {index === selectedRpcIndex && (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              )}
            </Space>
            <Space>
              {rpc.isCustom && (
                <Tag size="small" color="blue">
                  Custom
                </Tag>
              )}
              {rpc.isDefault && (
                <Tag size="small" color="green">
                  Default
                </Tag>
              )}
            </Space>
          </Space>
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              wordBreak: 'break-all',
              display: 'block',
              maxWidth: 180,
            }}
          >
            {rpc.url}
          </Text>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              type="link"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                testRpcConnection(rpc, index);
              }}
              loading={testingRpc === index}
              icon={<ReloadOutlined />}
              style={{ padding: 0, height: 'auto' }}
            >
              Test
            </Button>
            {index !== selectedRpcIndex && (
              <Button
                type="link"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRpcSelect(index);
                }}
                style={{ padding: 0, height: 'auto' }}
              >
                Switch
              </Button>
            )}
          </Space>
        </Space>
      </div>
    ),
    onClick: () => {
      if (index !== selectedRpcIndex) {
        handleRpcSelect(index);
      }
    },
  }));

  if (rpcs.length === 1) {
    return (
      <Tooltip title={`Using ${currentRpc.name}`}>
        <Button size={size} style={style}>
          <Space size="small">
            <Badge status="success" />
            {showLabel && (
              <Text style={{ fontSize: size === 'small' ? 12 : 14 }}>
                {currentRpc.name}
              </Text>
            )}
          </Space>
        </Button>
      </Tooltip>
    );
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomLeft"
    >
      <Button size={size} style={style}>
        <Space size="small">
          <Badge status="success" />
          {showLabel && (
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: size === 'small' ? 12 : 14,
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {currentRpc.name}
              </div>
              <div
                style={{
                  fontSize: size === 'small' ? 10 : 11,
                  color: '#666',
                  lineHeight: 1.2,
                }}
              >
                {rpcs.length} RPC{rpcs.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
          <DownOutlined style={{ fontSize: 10 }} />
        </Space>
      </Button>
    </Dropdown>
  );
};

// 简化版本的 RPC 指示器
export const RpcIndicator: React.FC<{
  size?: 'small' | 'middle' | 'large';
}> = ({ size = 'middle' }) => {
  const { selectedNetwork, getCurrentNetworkRpcs, selectedRpcIndex } = useNetworkSelection();
  
  const rpcs = getCurrentNetworkRpcs();
  const currentRpc = rpcs[selectedRpcIndex];

  if (!selectedNetwork || !currentRpc) {
    return null;
  }

  return (
    <Space size="small">
      <Badge status="success" />
      <Text
        style={{
          fontSize: size === 'small' ? 11 : size === 'large' ? 14 : 12,
          color: '#666',
        }}
      >
        {currentRpc.name}
      </Text>
    </Space>
  );
};

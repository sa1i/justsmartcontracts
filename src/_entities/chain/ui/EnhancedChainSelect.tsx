import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, Divider, Alert } from 'antd';
import { GlobalOutlined, PlusOutlined } from '@ant-design/icons';
import { Chain, getChainConfig } from '@shared/lib/web3';
import { TValueInput } from '@shared/lib/props';
import { SupportedChains } from '../model';
import { ChainSelect } from './ChainSelect';
import { NetworkPanel } from '@features/network-selector';
import { 
  useNetworkSelection, 
  useNetworks 
} from '@shared/lib/chainlist';
import { 
  mapNetworkToChainEnum, 
  isNetworkSupported,
  formatNetworkName 
} from '@shared/lib/chainlist/adapter';
import { NetworkConfig } from '@shared/lib/chainlist/types';

const { Text } = Typography;

type TProps = TValueInput<Chain> & {
  showNetworkSelector?: boolean;
  allowUnsupportedNetworks?: boolean;
};

export const EnhancedChainSelect: React.FC<TProps> = ({ 
  value, 
  onChange,
  showNetworkSelector = true,
  allowUnsupportedNetworks = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { selectedNetwork } = useNetworkSelection();
  const { fetchNetworks } = useNetworks();

  // 初始化网络数据
  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const handleChainChange = (chain: Chain) => {
    onChange?.(chain);
  };

  const handleNetworkSelect = (network: NetworkConfig) => {
    const mappedChain = mapNetworkToChainEnum(network);
    if (mappedChain) {
      onChange?.(mappedChain);
    } else if (allowUnsupportedNetworks) {
      // 如果允许不支持的网络，可以在这里处理
      console.warn('Selected unsupported network:', network);
    }
  };

  const getCurrentNetworkInfo = () => {
    if (selectedNetwork && value) {
      const mappedChain = mapNetworkToChainEnum(selectedNetwork);
      if (mappedChain === value) {
        return {
          isFromChainlist: true,
          network: selectedNetwork,
        };
      }
    }
    
    if (value) {
      const chainConfig = getChainConfig(value);
      return {
        isFromChainlist: false,
        chainConfig,
      };
    }
    
    return null;
  };

  const networkInfo = getCurrentNetworkInfo();

  return (
    <div>
      {/* 标准链选择器 */}
      <div style={{ marginBottom: 12 }}>
        <Text strong>Supported Networks</Text>
        <ChainSelect value={value} onChange={handleChainChange} />
      </div>

      {/* 显示当前网络信息 */}
      {networkInfo && (
        <div style={{ marginBottom: 12 }}>
          <Alert
            message={
              networkInfo.isFromChainlist 
                ? `Using ${formatNetworkName(networkInfo.network!)} from Chainlist`
                : `Using ${networkInfo.chainConfig!.name} (Built-in)`
            }
            type={networkInfo.isFromChainlist ? 'info' : 'success'}
            showIcon
            style={{ fontSize: 12 }}
          />
        </div>
      )}

      {/* 网络选择器切换 */}
      {showNetworkSelector && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ marginBottom: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>All Networks (Chainlist)</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </Button>
              </div>
              
              {showAdvanced && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                    Select from thousands of networks. Only supported networks will be available for contract interactions.
                  </Text>
                  
                  <NetworkPanel
                    onNetworkChange={handleNetworkSelect}
                    size="small"
                  />
                  
                  {selectedNetwork && !isNetworkSupported(selectedNetwork) && (
                    <Alert
                      message="Unsupported Network"
                      description={`${selectedNetwork.name} is not supported for contract interactions. Please select a supported network above.`}
                      type="warning"
                      showIcon
                      style={{ marginTop: 8, fontSize: 12 }}
                    />
                  )}
                </div>
              )}
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

// 简化版本，只显示支持的网络
export const SimpleChainSelect: React.FC<TValueInput<Chain>> = ({ value, onChange }) => {
  return <ChainSelect value={value} onChange={onChange} />;
};

// 网络信息显示组件
export const ChainInfo: React.FC<{ chain: Chain }> = ({ chain }) => {
  const config = getChainConfig(chain);
  
  return (
    <Space direction="vertical" size={4}>
      <Text strong>{config.name}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Chain ID: {chain}
      </Text>
      {config.testnet && (
        <Text type="warning" style={{ fontSize: 12 }}>
          Testnet
        </Text>
      )}
    </Space>
  );
};

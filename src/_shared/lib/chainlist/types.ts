export interface ChainlistRpcEndpoint {
  url: string;
  tracking?: string;
  trackingDetails?: string;
}

export interface ChainlistNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainlistExplorer {
  name: string;
  url: string;
  standard: string;
  icon?: string;
}

export interface ChainlistContract {
  address: string;
  blockCreated?: number;
}

export interface ChainlistContracts {
  multicall3?: ChainlistContract;
  ensRegistry?: ChainlistContract;
  ensUniversalResolver?: ChainlistContract;
}

export interface ChainlistChain {
  name: string;
  chain: string;
  icon?: string;
  rpc: (string | ChainlistRpcEndpoint)[]; // 支持字符串和对象格式
  faucets: string[];
  nativeCurrency: ChainlistNativeCurrency;
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  slip44?: number;
  ens?: {
    registry: string;
  };
  explorers?: ChainlistExplorer[];
  parent?: {
    type: string;
    chain: string;
    bridges?: Array<{
      url: string;
    }>;
  };
  status?: string;
  redFlags?: string[];
  contracts?: ChainlistContracts;
}

export interface ChainlistResponse {
  [key: string]: ChainlistChain;
}

// 内部使用的网络配置类型
export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  chain: string;
  nativeCurrency: ChainlistNativeCurrency;
  rpcUrls: string[];
  blockExplorers?: ChainlistExplorer[];
  faucets: string[];
  infoURL: string;
  icon?: string;
  testnet: boolean;
  status?: string;
  redFlags?: string[];
}

// RPC 端点配置
export interface RpcConfig {
  url: string;
  name: string;
  isDefault: boolean;
  isCustom: boolean;
}

// 网络与 RPC 的完整配置
export interface NetworkWithRpc {
  network: NetworkConfig;
  rpcs: RpcConfig[];
  selectedRpcIndex: number;
}

// 用户自定义网络权限配置
export interface NetworkPermission {
  chainId: number;
  allowContractInteraction: boolean;
  isUserOverride: boolean; // 是否为用户自定义设置
  reason?: string; // 禁用原因
}

// 网络权限设置
export interface NetworkPermissions {
  [chainId: number]: NetworkPermission;
}

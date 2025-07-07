# 代理合约支持功能

## 概述

本系统现在支持自动检测和交互代理合约（Proxy Contracts）。代理合约是一种常见的智能合约模式，允许合约逻辑的升级而不改变合约地址。

## 支持的代理模式

### 1. EIP-1967 标准代理
- **标准**: [EIP-1967](https://eips.ethereum.org/EIPS/eip-1967)
- **检测方式**: 读取标准存储槽 `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
- **特点**: 最常见的代理标准，被大多数代理合约采用

### 2. 透明代理（Transparent Proxy）
- **标准**: OpenZeppelin Transparent Proxy
- **检测方式**: 检测 EIP-1967 实现槽 + 管理员槽
- **特点**: 具有管理员地址，可以升级实现合约

### 3. UUPS 代理（Universal Upgradeable Proxy Standard）
- **标准**: EIP-1822 的改进版本
- **检测方式**: 与 EIP-1967 相同的存储槽
- **特点**: 升级逻辑在实现合约中，而不是代理合约中

### 4. 自定义代理
- **检测方式**: 尝试调用常见的代理方法：
  - `implementation()`
  - `target()`
  - `getImplementation()`
- **特点**: 非标准代理合约的兜底检测

## 功能特性

### 自动检测
- 当加载合约时，系统会自动检测是否为代理合约
- 检测过程包括：
  1. 读取 EIP-1967 标准存储槽
  2. 检查管理员槽（用于透明代理）
  3. 尝试调用常见代理方法
  4. 确定代理类型和实现合约地址

### 实现合约 ABI 获取
- **自动获取**: 从区块链浏览器 API 获取已验证的实现合约 ABI
- **支持的浏览器**:
  - Etherscan (Ethereum)
  - PolygonScan (Polygon)
  - BscScan (BSC)
  - Arbiscan (Arbitrum)
  - Optimistic Etherscan (Optimism)
  - SnowTrace (Avalanche)
  - FtmScan (Fantom)
- **手动设置**: 如果自动获取失败，可以手动粘贴 ABI JSON

### 代理方法调用
- **透明交互**: 使用代理地址调用实现合约的方法
- **完整功能**: 支持所有类型的合约交互：
  - 属性读取（view/pure 函数，无参数）
  - 方法调用（view/pure 函数，有参数）
  - 状态变更操作（非 view/pure 函数）
  - 事件查询

## 使用方法

### 1. 添加代理合约
1. 在合约浏览器中添加代理合约地址
2. 系统会自动检测是否为代理合约
3. 如果检测到代理，会显示代理信息卡片

### 2. 查看代理信息
代理信息卡片显示：
- 代理类型（EIP1967、Transparent、UUPS、Custom）
- 实现合约地址
- 管理员地址（如果适用）
- ABI 获取状态

### 3. 与实现合约交互
1. 如果成功获取实现合约 ABI，会出现 "Proxy Methods" 标签页
2. 在此标签页中可以：
   - 调用实现合约的所有方法
   - 查看属性值
   - 执行状态变更操作
   - 查询事件日志

### 4. 手动设置 ABI
如果自动获取 ABI 失败：
1. 点击 "Set Manual ABI" 按钮
2. 在弹出的对话框中粘贴实现合约的 ABI JSON
3. 点击 "Set ABI" 保存

## 技术实现

### 代理检测流程
```typescript
// 1. 检测 EIP-1967 实现槽
const implementationSlotData = await publicClient.getStorageAt({
  address: contractAddress,
  slot: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
});

// 2. 检测管理员槽
const adminSlotData = await publicClient.getStorageAt({
  address: contractAddress,
  slot: "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
});

// 3. 尝试调用代理方法
const implementationResult = await publicClient.readContract({
  address: contractAddress,
  abi: [{ name: "implementation", type: "function", ... }],
  functionName: "implementation",
});
```

### ABI 获取流程
```typescript
// 根据链ID选择对应的浏览器API
const apiUrl = getExplorerApiUrl(chainId, implementationAddress);
const response = await fetch(apiUrl);
const data = await response.json();
const abi = JSON.parse(data.result);
```

### 虚拟合约对象
```typescript
// 创建虚拟实现合约对象，使用代理地址但实现合约的ABI
const virtualImplementationContract = {
  ...proxyContract,
  abi: implementationAbi,
  name: `${proxyContract.name} (Implementation)`,
};
```

## 注意事项

1. **网络支持**: 代理检测功能在所有支持的网络上都可用
2. **API 限制**: 区块链浏览器 API 可能有速率限制
3. **未验证合约**: 如果实现合约未在浏览器上验证，需要手动提供 ABI
4. **Gas 费用**: 代理方法调用的 gas 费用与直接调用实现合约相同
5. **权限检查**: 某些代理合约可能有访问控制，需要适当的权限

## 故障排除

### 代理检测失败
- 确保网络连接正常
- 检查合约地址是否正确
- 验证合约确实是代理合约

### ABI 获取失败
- 检查实现合约是否已验证
- 尝试手动设置 ABI
- 确认网络选择正确

### 方法调用失败
- 检查网络连接和 RPC 状态
- 确认钱包连接正常
- 验证方法参数正确性

## 示例

### 常见代理合约示例
- **USDC**: `0xA0b86a33E6441b8e8C7C7b0b8b8b8b8b8b8b8b8b` (Ethereum)
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7` (Ethereum)
- **Compound cTokens**: 大多数 cToken 合约都是代理合约

这些功能使得与代理合约的交互变得简单直观，无需用户了解复杂的代理机制细节。

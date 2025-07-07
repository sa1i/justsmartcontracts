# 地址链接修复完成

## 问题描述
用户反馈地址链接无法正常工作，所有地址都显示为不可点击状态，只能通过悬停查看完整地址。

## 根本原因
在 `AddressLink.tsx` 组件中，使用了错误的字段名来获取区块链浏览器信息：

```typescript
// ❌ 错误的字段名
if (!selectedNetwork?.explorers?.length) {
  return null;
}
const explorer = selectedNetwork.explorers[0];
```

但是根据网络配置的数据结构，正确的字段名应该是 `blockExplorers`：

```typescript
// ✅ 正确的字段名
if (!selectedNetwork?.blockExplorers?.length) {
  return null;
}
const explorer = selectedNetwork.blockExplorers[0];
```

## 修复内容

### 修改文件
- `src/_shared/ui/AddressLink.tsx`

### 具体修改
```diff
  const getExplorerUrl = () => {
-   if (!selectedNetwork?.explorers?.length) {
+   if (!selectedNetwork?.blockExplorers?.length) {
      return null;
    }

-   const explorer = selectedNetwork.explorers[0];
+   const explorer = selectedNetwork.blockExplorers[0];
    return `${explorer.url}/address/${address}`;
  };
```

## 验证结果

从开发服务器日志可以看到，所有网络都有正确的 `blockExplorers` 配置：

### 主要网络的浏览器配置
- **Ethereum**: `https://etherscan.io`
- **Polygon**: `https://polygonscan.com`
- **BSC**: `https://bscscan.com`
- **Arbitrum**: `https://arbiscan.io`
- **Optimism**: `https://optimistic.etherscan.io`
- **Avalanche**: `https://snowtrace.io`
- **Base**: `https://basescan.org`
- **Linea**: `https://lineascan.build`
- **Moonriver**: `https://moonriver.moonscan.io`
- **Aurora**: `https://aurorascan.dev`

## 预期效果

修复后，所有地址链接应该：

1. **可点击**: 地址显示为蓝色链接样式
2. **外部图标**: 显示外部链接图标
3. **正确跳转**: 点击后跳转到对应链的区块链浏览器
4. **URL 格式**: 使用 `{explorerUrl}/address/{address}` 格式

## 测试建议

1. **选择不同网络**: 切换到不同的区块链网络
2. **查看地址链接**: 确认地址显示为可点击的链接
3. **点击测试**: 点击地址链接，验证是否正确跳转到浏览器
4. **URL 验证**: 确认跳转的 URL 格式正确

## 影响范围

此修复影响所有使用 `AddressLink` 组件的地方：

- ✅ 代理合约信息中的地址
- ✅ 合约卡片中的地址
- ✅ 合约浏览器头部的地址
- ✅ 钱包卡片中的地址
- ✅ 合约参数中的地址类型
- ✅ 所有其他使用 AddressLink 的组件

## 技术细节

### 网络配置数据结构
```typescript
interface NetworkConfig {
  chainId: number;
  name: string;
  // ... 其他字段
  blockExplorers?: Array<{
    name: string;
    url: string;
    standard: string;
  }>;
}
```

### 修复后的链接生成逻辑
```typescript
const getExplorerUrl = () => {
  if (!selectedNetwork?.blockExplorers?.length) {
    return null;
  }
  const explorer = selectedNetwork.blockExplorers[0];
  return `${explorer.url}/address/${address}`;
};
```

这个修复确保了地址链接功能能够正常工作，用户现在可以方便地点击任何地址跳转到对应的区块链浏览器查看详细信息。

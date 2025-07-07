# 网络支持说明

## 🤔 为什么有些网络显示"不支持"？

当你在 chainlist.org 的网络列表中选择某些网络时，可能会看到"Unsupported Network"的提示。这是因为我们的智能合约交互系统只支持有限的预定义网络。

## 📊 当前支持的网络

我们的系统目前支持以下 **23 个网络**：

### 主网 (Mainnet)
| 网络名称 | Chain ID | 符号 | 状态 |
|---------|----------|------|------|
| Ethereum | 1 | ETH | ✅ 支持 |
| Optimism | 10 | ETH | ✅ 支持 |
| Cronos | 25 | CRO | ✅ 支持 |
| BNB Smart Chain | 56 | BNB | ✅ 支持 |
| OKC | 66 | OKT | ✅ 支持 |
| Heco Network | 128 | HT | ✅ 支持 |
| Polygon | 137 | POL | ✅ 支持 |
| Manta Pacific | 169 | ETH | ✅ 支持 |
| Boba Network | 288 | ETH | ✅ 支持 |
| Moonriver | 1285 | MOVR | ✅ 支持 |
| Mantle | 5000 | MNT | ✅ 支持 |
| Base | 8453 | ETH | ✅ 支持 |
| Arbitrum One | 42161 | ETH | ✅ 支持 |
| Avalanche | 43114 | AVAX | ✅ 支持 |
| Linea | 59144 | ETH | ✅ 支持 |
| Zero Network | 543210 | ETH | ✅ 支持 |
| Aurora | 1313161554 | ETH | ✅ 支持 |

### 测试网 (Testnet)
| 网络名称 | Chain ID | 符号 | 状态 |
|---------|----------|------|------|
| Goerli | 5 | ETH | ✅ 支持 |
| Sepolia | 11155111 | ETH | ✅ 支持 |
| Polygon Mumbai | 80001 | MATIC | ✅ 支持 |

## 🔍 为什么限制支持的网络？

### 1. **技术原因**
- **RPC 稳定性**: 我们需要确保 RPC 端点的稳定性和可靠性
- **合约部署**: 每个网络都需要部署和配置特定的合约
- **Gas 费用计算**: 不同网络的 Gas 机制差异很大
- **区块确认**: 不同网络的区块确认时间和机制不同

### 2. **安全考虑**
- **网络验证**: 确保网络的安全性和去中心化程度
- **风险评估**: 避免用户在不安全的网络上进行交易
- **合约审计**: 确保在支持的网络上的合约都经过审计

### 3. **用户体验**
- **功能完整性**: 确保所有功能在支持的网络上都能正常工作
- **错误处理**: 提供更好的错误处理和用户反馈
- **性能优化**: 针对支持的网络进行性能优化

## 🛠 如何添加新网络支持？

如果你需要支持特定的网络，可以通过以下方式：

### 方法 1: 修改配置文件

1. **更新支持的链列表**:
```typescript
// src/_entities/chain/model/index.ts
export const SupportedChains = [
  // ... 现有网络
  Chain.YOUR_NEW_CHAIN, // 添加新网络
];
```

2. **更新链 ID 映射**:
```typescript
// src/_shared/lib/chainlist/adapter.ts
const chainIdMap: Record<number, Chain> = {
  // ... 现有映射
  YOUR_CHAIN_ID: Chain.YOUR_NEW_CHAIN, // 添加新映射
};
```

3. **添加网络配置**:
```typescript
// src/_shared/lib/web3/chains.ts
[Chain.YOUR_NEW_CHAIN]: {
  name: "Your Network Name",
  chainId: YOUR_CHAIN_ID,
  // ... 其他配置
}
```

### 方法 2: 动态网络支持

我们可以实现动态网络支持功能：

```typescript
// 允许用户添加自定义网络
const allowCustomNetworks = true;

<EnhancedChainSelect
  value={selectedChain}
  onChange={setSelectedChain}
  showNetworkSelector={true}
  allowUnsupportedNetworks={allowCustomNetworks} // 启用自定义网络
/>
```

## 🎯 实际使用建议

### 对于普通用户
1. **优先使用支持的网络**: 选择上述列表中的网络以获得最佳体验
2. **检查网络状态**: 注意网络是否为测试网
3. **确认 RPC 连接**: 使用 RPC 切换功能选择最佳端点

### 对于开发者
1. **测试网开发**: 使用 Goerli、Sepolia 或 Mumbai 进行开发测试
2. **主网部署**: 选择适合你项目的主网进行部署
3. **多网络支持**: 考虑在多个网络上部署以提高可用性

## 🔮 未来计划

我们计划逐步扩展网络支持：

### 短期目标 (1-3 个月)
- [ ] 添加更多主流 L2 网络
- [ ] 支持更多测试网
- [ ] 改进网络检测和验证

### 中期目标 (3-6 个月)
- [ ] 动态网络添加功能
- [ ] 自定义 RPC 端点验证
- [ ] 网络性能监控

### 长期目标 (6+ 个月)
- [ ] 完全动态网络支持
- [ ] 社区驱动的网络添加
- [ ] 跨链功能支持

## 💡 解决方案

如果你遇到"不支持的网络"提示：

1. **选择支持的网络**: 从上述列表中选择一个支持的网络
2. **使用传统选择器**: 点击"Supported Networks"使用基础选择器
3. **联系开发团队**: 如果需要特定网络支持，可以提出需求

## 🔧 技术实现细节

网络支持检查的核心逻辑：

```typescript
// 检查网络是否支持
export function isNetworkSupported(network: NetworkConfig): boolean {
  return mapNetworkToChainEnum(network) !== null;
}

// 映射 chainlist 网络到内部链枚举
export function mapNetworkToChainEnum(network: NetworkConfig): Chain | null {
  const chainIdMap: Record<number, Chain> = {
    1: Chain.ETHEREUM,
    137: Chain.POLYGON,
    // ... 其他映射
  };
  
  return chainIdMap[network.chainId] || null;
}
```

这种设计确保了：
- **类型安全**: 所有支持的网络都有明确的类型定义
- **功能完整**: 每个支持的网络都经过完整测试
- **向后兼容**: 现有功能不会因为新网络而受影响

---

**总结**: "不支持的网络"提示是为了确保用户在经过验证和测试的网络上进行合约交互，从而提供最佳的安全性和用户体验。如果需要特定网络支持，可以通过配置修改或联系开发团队来实现。

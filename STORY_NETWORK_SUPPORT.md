# Story Network Support 添加完成

## 修改总结

已成功将 Story Protocol 网络添加到系统支持的网络列表中。现在 Story 网络（Chain ID: 1514）被系统识别为支持合约交互的网络。

## 具体修改

### 1. 添加 Story 链枚举
**文件**: `src/_shared/lib/web3/chains.ts`
```typescript
export enum Chain {
  // ... 其他链
  STORY = 1514,
}
```

### 2. 创建 Story 链定义
**文件**: `src/_shared/lib/web3/story-chain.ts`
```typescript
import { defineChain } from 'viem'

export const story = defineChain({
  id: 1514,
  name: 'Story',
  network: 'story',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.story.foundation'],
    },
    public: {
      http: ['https://rpc.story.foundation'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Explorer',
      url: 'https://explorer.story.foundation',
    },
  },
})
```

### 3. 添加到 Wagmi 映射
**文件**: `src/_shared/lib/web3/wagmi.ts`
- 导入 Story 链定义
- 添加到 ChainWagmiMap 映射中

### 4. 添加到支持的网络列表
**文件**: `src/_entities/chain/model/index.ts`
- 将 `Chain.STORY` 添加到 `SupportedChains` 数组

### 5. 添加到 Chainlist 适配器
**文件**: `src/_shared/lib/chainlist/adapter.ts`
- 在 `mapNetworkToChainEnum` 函数中添加 Chain ID 1514 到 Chain.STORY 的映射

## Story 网络信息

- **Chain ID**: 1514 (0x5ea)
- **网络名称**: Story
- **原生货币**: IP
- **RPC URL**: https://rpc.story.foundation
- **区块浏览器**: https://explorer.story.foundation

## 验证步骤

现在当用户：
1. 在网络选择器中选择 Story 网络
2. 系统会识别它为支持的网络
3. 不再显示"不支持的网络"警告
4. 可以正常进行合约交互

## 网络权限逻辑

Story 网络现在遵循标准的网络权限逻辑：
- **系统默认**: 支持合约交互（因为已添加到支持列表）
- **用户权限**: 用户可以通过网络权限管理器覆盖默认设置
- **最终状态**: 如果用户没有自定义设置，默认允许合约交互

## 注意事项

1. **RPC 可靠性**: 使用的是 Story 官方 RPC，如果有连接问题可以添加备用 RPC
2. **测试建议**: 建议在实际使用前测试网络连接和合约交互
3. **更新维护**: 如果 Story 网络的 RPC 或浏览器 URL 发生变化，需要更新配置

## 解决的问题

- ✅ Story 网络不再显示"不支持的网络"错误
- ✅ 用户可以在 Story 网络上进行合约交互
- ✅ 网络权限设置正常工作
- ✅ 系统正确识别 Story 网络为支持的网络

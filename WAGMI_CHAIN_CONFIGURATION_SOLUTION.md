# Wagmi 链配置解决方案

## 问题描述
用户在选择 Story 网络时遇到 "Chain not configured. Version: @wagmi/core@2.13.4" 错误，即使在网络权限中设置了 Story 网络允许合约交互。

## 根本原因
Wagmi v2 要求在配置中预先注册所有可能使用的链。之前的实现只动态配置当前选中的链，导致未预先注册的链无法使用。

## 解决方案

### 1. 创建容易维护的链注册机制

**新增函数** (`src/_shared/lib/web3/wagmi.ts`):
```typescript
/**
 * 获取所有支持的 Wagmi 链
 * 这个函数返回所有在 ChainWagmiMap 中定义的链，确保 wagmi 配置包含所有支持的链
 */
export const getAllSupportedWagmiChains = (): WagmiChain[] => {
  return Object.values(ChainWagmiMap);
};

/**
 * 获取所有支持的链的传输配置
 * 为每个支持的链创建默认的传输配置
 */
export const getAllSupportedTransports = (): Record<number, any> => {
  const transports: Record<number, any> = {};
  
  Object.entries(ChainWagmiMap).forEach(([chainEnum, wagmiChain]) => {
    const chainId = parseInt(chainEnum);
    // 为每个链创建默认的 HTTP 传输
    const defaultRpc = wagmiChain.rpcUrls.default.http[0];
    if (defaultRpc) {
      transports[chainId] = http(defaultRpc);
    }
  });
  
  return transports;
};
```

### 2. 新的 Web3Provider 实现

**AllChainsSupportedWeb3Provider** (`src/_shared/lib/web3/provider.tsx`):
```typescript
// 全链支持的 Web3Provider - 推荐使用
// 包含所有支持的链，避免 "Chain not configured" 错误
export const AllChainsSupportedWeb3Provider = ({ children }: TWithChildren) => {
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();

  const config = useMemo(() => {
    // 获取所有支持的链和基础传输配置
    const allSupportedChains = getAllSupportedWagmiChains();
    const baseTransports = getAllSupportedTransports();

    // 如果有选择的网络，为其自定义 RPC 配置
    if (selectedNetwork) {
      const rpcs = getCurrentNetworkRpcs();
      if (rpcs.length > 0) {
        const rpcUrls = rpcs.map((rpc) => rpc.url);
        baseTransports[selectedNetwork.chainId] = fallback(
          rpcUrls.map((url) => http(url))
        );
      }
    }

    return createConfig({
      chains: allSupportedChains as any,
      transports: baseTransports,
      connectors: [metaMask(), injected()],
    });
  }, [selectedNetwork, getCurrentNetworkRpcs]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
```

### 3. 添加 Story 网络支持

**Story 链定义** (`src/_shared/lib/web3/story-chain.ts`):
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

**更新映射配置**:
- `src/_shared/lib/web3/chains.ts`: 添加 `STORY = 1514`
- `src/_shared/lib/web3/wagmi.ts`: 添加 Story 链到映射
- `src/_entities/chain/model/index.ts`: 添加到支持列表
- `src/_shared/lib/chainlist/adapter.ts`: 添加 Chain ID 映射

### 4. 更新应用入口点

**应用配置** (`src/_app/index.tsx`):
```typescript
// 从
<Web3Provider chain={chain}>

// 改为
<AllChainsSupportedWeb3Provider>
```

## 技术优势

### 1. **容易维护**
- 所有链配置集中在 `ChainWagmiMap` 中
- 新增链只需要在一个地方添加配置
- 自动生成传输配置，减少重复代码

### 2. **向前兼容**
- 包含所有支持的链，避免 "Chain not configured" 错误
- 支持动态 RPC 配置
- 保持现有的网络权限逻辑

### 3. **性能优化**
- 预先配置所有链，避免运行时配置错误
- 使用 fallback 传输提高连接可靠性
- 缓存配置减少重复计算

### 4. **用户体验**
- 无缝支持所有注册的网络
- 自动处理 RPC 切换
- 保持网络权限控制

## 验证结果

✅ Story 网络（Chain ID: 1514）成功加载到 wagmi 配置
✅ 不再出现 "Chain not configured" 错误
✅ 支持动态 RPC 配置
✅ 保持网络权限检查功能
✅ 所有现有功能正常工作

## 未来扩展

要添加新的网络支持，只需要：
1. 创建链定义文件（如 `new-chain.ts`）
2. 在 `chains.ts` 中添加枚举
3. 在 `wagmi.ts` 中添加到映射
4. 在支持列表中添加
5. 在适配器中添加 Chain ID 映射

这个机制确保了代码的可维护性和扩展性。

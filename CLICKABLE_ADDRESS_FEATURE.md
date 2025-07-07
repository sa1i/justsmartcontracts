# 可点击地址功能实现

## 概述

实现了全局的可点击地址功能，所有地址都可以点击跳转到对应链的区块链浏览器查看详细信息，使用 `address/{address}` 的URL模式。

## 核心组件

### AddressLink 组件
位置：`src/_shared/ui/AddressLink.tsx`

这是一个通用的地址显示组件，提供以下功能：
- **可点击链接**：自动跳转到对应链的区块链浏览器
- **地址格式化**：支持短地址和完整地址显示
- **复制功能**：点击复制地址到剪贴板
- **外部链接图标**：清晰标识可跳转链接
- **工具提示**：显示完整地址信息

#### 组件变体

1. **AddressLink** - 完整功能组件
   ```tsx
   <AddressLink 
     address={address} 
     showShort={true}      // 显示短地址
     showCopy={true}       // 显示复制按钮
     showExternal={true}   // 显示外部链接图标
   />
   ```

2. **AddressLinkShort** - 简化版本
   ```tsx
   <AddressLinkShort address={address} />
   ```

3. **AddressLinkFull** - 完整地址版本
   ```tsx
   <AddressLinkFull address={address} />
   ```

## 功能特性

### 1. 智能链接生成
- 自动检测当前选择的网络
- 使用网络配置中的浏览器信息
- 生成格式：`{explorerUrl}/address/{address}`

### 2. 用户体验优化
- **工具提示**：悬停显示完整地址
- **复制反馈**：复制成功后显示提示消息
- **外部链接标识**：清晰的视觉指示
- **响应式设计**：适配不同屏幕尺寸

### 3. 兼容性处理
- **无浏览器配置**：降级为可复制的文本
- **剪贴板API**：支持现代浏览器和旧版本兼容
- **错误处理**：优雅处理各种异常情况

## 应用范围

### 已更新的组件

1. **代理合约信息** (`ProxyContractInfo.tsx`)
   - 实现合约地址可点击
   - 管理员地址可点击

2. **合约卡片** (`SmallCard.tsx`)
   - 合约地址可点击跳转

3. **合约浏览器** (`ContractBrowser.tsx`)
   - 添加合约信息头部
   - 显示可点击的合约地址

4. **钱包卡片** (`WalletCard.tsx`)
   - 钱包地址可点击

5. **地址参数值** (`AddressValue.tsx`)
   - 合约参数中的地址类型可点击

## 技术实现

### 链接生成逻辑
```typescript
const getExplorerUrl = () => {
  if (!selectedNetwork?.explorers?.length) {
    return null;
  }
  const explorer = selectedNetwork.explorers[0];
  return `${explorer.url}/address/${address}`;
};
```

### 复制功能实现
```typescript
const handleCopy = async (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  try {
    await navigator.clipboard.writeText(address);
    message.success("Address copied to clipboard");
  } catch (error) {
    // 兼容旧版浏览器的降级方案
    const textArea = document.createElement("textarea");
    textArea.value = address;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    message.success("Address copied to clipboard");
  }
};
```

### 网络适配
- 自动使用当前选择网络的浏览器配置
- 支持所有已配置的区块链网络
- 动态更新链接目标

## 支持的区块链浏览器

根据网络配置自动适配：
- **Ethereum**: Etherscan
- **Polygon**: PolygonScan  
- **BSC**: BscScan
- **Arbitrum**: Arbiscan
- **Optimism**: Optimistic Etherscan
- **Avalanche**: SnowTrace
- **Base**: Basescan
- **Fantom**: FtmScan
- **以及所有其他已配置的网络**

## 使用示例

### 基本用法
```tsx
import { AddressLink } from "@shared/ui/AddressLink";

// 简单使用
<AddressLink address="0x1234...5678" />

// 自定义配置
<AddressLink 
  address="0x1234...5678"
  showShort={false}     // 显示完整地址
  showCopy={true}       // 显示复制按钮
  showExternal={true}   // 显示外部链接图标
/>
```

### 在列表中使用
```tsx
{addresses.map(address => (
  <div key={address}>
    <AddressLinkShort address={address} />
  </div>
))}
```

### 在表格中使用
```tsx
const columns = [
  {
    title: 'Address',
    dataIndex: 'address',
    render: (address) => <AddressLink address={address} />
  }
];
```

## 样式定制

组件使用内联样式和 Ant Design 的设计系统：
- **字体**：等宽字体显示地址
- **颜色**：遵循 Ant Design 主题
- **间距**：合理的元素间距
- **图标**：统一的图标风格

## 性能优化

1. **事件处理优化**：防止事件冒泡
2. **条件渲染**：只在需要时渲染复杂元素
3. **记忆化**：避免不必要的重新计算
4. **懒加载**：按需加载复制功能

## 可访问性

- **键盘导航**：支持 Tab 键导航
- **屏幕阅读器**：提供适当的 aria 标签
- **对比度**：确保足够的颜色对比度
- **焦点指示**：清晰的焦点状态

## 未来扩展

1. **批量复制**：支持选择多个地址批量复制
2. **地址标签**：显示已知地址的标签名称
3. **地址验证**：实时验证地址格式
4. **历史记录**：记录最近访问的地址
5. **收藏功能**：收藏常用地址

这个实现为用户提供了便捷的地址查看和跳转功能，大大提升了使用体验，让用户能够快速访问区块链浏览器获取更多地址相关信息。

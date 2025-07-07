# RPC 切换功能使用指南

本指南介绍如何使用新的 RPC 切换功能，支持手动切换和管理多个 RPC 端点。

## 🚀 功能概览

### 核心功能
- **多 RPC 支持**: 每个网络支持多个 RPC 端点
- **手动切换**: 快速在不同 RPC 之间切换
- **自定义 RPC**: 添加、编辑、删除自定义 RPC 端点
- **RPC 测试**: 实时测试 RPC 连接状态
- **智能命名**: 自动为 RPC 端点生成友好名称

## 📱 组件使用

### 1. NetworkRpcPanel - 综合网络和 RPC 面板

```tsx
import { NetworkRpcPanel } from '@features/network-selector';

// 水平布局 - 网络和 RPC 并排显示
<NetworkRpcPanel layout="horizontal" size="middle" />

// 紧凑布局 - 单个按钮显示所有信息
<NetworkRpcPanel layout="compact" size="small" />

// 垂直布局 - 网络和 RPC 上下排列
<NetworkRpcPanel layout="vertical" size="large" />
```

### 2. RpcSwitcher - 独立 RPC 切换器

```tsx
import { RpcSwitcher } from '@features/network-selector';

// 基本使用
<RpcSwitcher size="middle" showLabel={true} />

// 小尺寸，不显示标签
<RpcSwitcher size="small" showLabel={false} />
```

### 3. NetworkRpcCard - 状态显示卡片

```tsx
import { NetworkRpcCard } from '@features/network-selector';

<NetworkRpcCard 
  title="当前网络状态" 
  extra={<Button>刷新</Button>}
/>
```

## 🔧 使用方法

### 快速 RPC 切换

1. **通过下拉菜单切换**
   - 点击网络面板的下拉箭头
   - 选择 "Switch RPC" 子菜单
   - 点击要切换到的 RPC 端点

2. **通过 RPC 切换器**
   - 点击 RPC 切换器按钮
   - 从下拉列表中选择 RPC
   - 或点击 "Switch" 按钮快速切换

### 管理自定义 RPC

1. **添加自定义 RPC**
   ```
   1. 点击网络面板 → "RPC Settings"
   2. 点击 "Add Custom RPC" 按钮
   3. 输入 RPC 名称和 URL
   4. 点击 "Add" 保存
   ```

2. **编辑 RPC**
   ```
   1. 在 RPC 设置中找到要编辑的 RPC
   2. 点击编辑图标
   3. 修改名称或 URL
   4. 点击 "Update" 保存
   ```

3. **删除 RPC**
   ```
   1. 在 RPC 设置中找到要删除的 RPC
   2. 点击删除图标
   3. 确认删除操作
   ```

### RPC 连接测试

1. **自动测试**
   - 系统会自动验证 RPC URL 格式
   - 检查 RPC 是否返回正确的链 ID

2. **手动测试**
   ```
   1. 在 RPC 切换器中点击 "Test" 按钮
   2. 系统会发送测试请求到 RPC 端点
   3. 显示测试结果（成功/失败）
   ```

## 🎯 实际应用场景

### 场景 1: 网络拥堵时切换 RPC
```
当前 RPC 响应慢 → 打开 RPC 切换器 → 选择其他 RPC → 立即生效
```

### 场景 2: 使用私有 RPC 节点
```
添加自定义 RPC → 输入私有节点 URL → 切换到私有节点 → 享受更快速度
```

### 场景 3: 开发环境切换
```
开发时使用本地节点 → 测试时切换到测试网 RPC → 生产时使用主网 RPC
```

## 🔍 功能特性

### RPC 状态指示
- **绿色圆点**: 当前活跃的 RPC
- **灰色圆点**: 默认 RPC（未激活）
- **蓝色圆点**: 其他可用 RPC

### RPC 标签
- **Default**: 网络的默认 RPC 端点
- **Custom**: 用户添加的自定义 RPC
- **Active**: 当前正在使用的 RPC

### 智能命名
- 自动从 URL 提取域名作为 RPC 名称
- 支持自定义友好名称
- 避免重复名称冲突

## 📊 数据持久化

### 本地存储
- 自定义 RPC 配置保存在本地存储
- 当前选择的 RPC 会被记住
- 跨会话保持用户偏好

### 数据结构
```typescript
interface RpcConfig {
  url: string;        // RPC 端点 URL
  name: string;       // 显示名称
  isDefault: boolean; // 是否为默认 RPC
  isCustom: boolean;  // 是否为自定义 RPC
}
```

## 🛠 开发者接口

### Hooks

```typescript
// 网络和 RPC 选择
const { 
  selectedNetwork, 
  selectedRpcIndex, 
  selectRpc,
  getCurrentNetworkRpcs 
} = useNetworkSelection();

// 自定义 RPC 管理
const { 
  addCustomRpc, 
  removeCustomRpc, 
  updateCustomRpc 
} = useCustomRpcs();
```

### 事件回调

```typescript
// 监听网络变化
<NetworkRpcPanel 
  onNetworkChange={(network) => {
    console.log('网络已切换:', network.name);
  }}
/>
```

## 🔒 安全考虑

### RPC 验证
- 验证 URL 格式的有效性
- 检查 RPC 返回的链 ID 是否匹配
- 防止恶意 RPC 端点

### 数据保护
- 不存储敏感信息
- 仅保存 RPC 配置数据
- 支持清除本地数据

## 📈 性能优化

### 缓存策略
- RPC 配置本地缓存
- 避免重复网络请求
- 智能预加载

### 错误处理
- 网络请求超时处理
- RPC 连接失败回退
- 用户友好的错误提示

## 🎨 UI/UX 特性

### 响应式设计
- 支持不同屏幕尺寸
- 自适应布局
- 移动端友好

### 交互反馈
- 加载状态指示
- 成功/失败消息提示
- 平滑的动画过渡

## 🔄 与现有系统集成

### 向后兼容
- 现有链选择器继续工作
- 渐进式功能增强
- 无缝迁移路径

### 扩展性
- 模块化组件设计
- 可插拔的 RPC 提供商
- 支持自定义主题

---

## 快速开始

1. **访问演示页面**: http://localhost:4001/networks
2. **查看头部面板**: 新的网络和 RPC 选择器
3. **尝试切换**: 选择不同网络和 RPC 端点
4. **添加自定义**: 配置你自己的 RPC 节点

享受更灵活、更强大的网络和 RPC 管理体验！

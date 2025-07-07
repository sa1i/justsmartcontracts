import React from "react";
import { Alert, Button, Space, Typography } from "antd";
import { ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { RpcSwitcher } from "@features/network-selector/ui/RpcSwitcher";

const { Text, Link } = Typography;

interface RpcErrorHandlerProps {
  error: Error | null;
  onRetry?: () => void;
  showRpcSwitcher?: boolean;
  style?: React.CSSProperties;
}

export const RpcErrorHandler: React.FC<RpcErrorHandlerProps> = ({
  error,
  onRetry,
  showRpcSwitcher = true,
  style,
}) => {
  const { selectedNetwork, getCurrentNetworkRpcs } = useNetworkSelection();

  if (!error) return null;

  const isRpcError =
    error.message.includes("InternalRpcError") ||
    error.message.includes("RPC") ||
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("timeout");

  const rpcs = getCurrentNetworkRpcs();
  const hasMultipleRpcs = rpcs.length > 1;

  if (!isRpcError) {
    return (
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
        style={style}
        action={
          onRetry && (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              Retry
            </Button>
          )
        }
      />
    );
  }

  return (
    <Alert
      message="RPC Connection Error"
      description={
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>
            The current RPC endpoint is experiencing issues: {error.message}
          </Text>

          {selectedNetwork && (
            <Text type="secondary">
              Network: <Text strong>{selectedNetwork.name}</Text>
            </Text>
          )}

          {hasMultipleRpcs && (
            <Text>
              Try switching to a different RPC endpoint using the switcher
              below.
            </Text>
          )}

          {!hasMultipleRpcs && (
            <Text>
              Consider adding custom RPC endpoints for better reliability.
            </Text>
          )}
        </Space>
      }
      type="error"
      showIcon
      style={style}
      action={
        <Space>
          {onRetry && (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              Retry
            </Button>
          )}
          {showRpcSwitcher && hasMultipleRpcs && (
            <RpcSwitcher size="small" showLabel={false} />
          )}
        </Space>
      }
    />
  );
};

// 用于检测是否为RPC相关错误的工具函数
export const isRpcRelatedError = (error: Error): boolean => {
  const errorMessage = error.message.toLowerCase();
  const rpcErrorKeywords = [
    "internalrpcerror",
    "rpc",
    "fetch",
    "network",
    "timeout",
    "connection",
    "cloudflare-eth.com",
    "internal error",
    "bad gateway",
    "service unavailable",
    "[object object]", // 添加对象URL错误检测
    "unexpected token",
    "not valid json",
  ];

  return rpcErrorKeywords.some((keyword) => errorMessage.includes(keyword));
};

// RPC错误重试逻辑的Hook
export const useRpcErrorRetry = () => {
  const { getCurrentNetworkRpcs, selectRpc, selectedRpcIndex } =
    useNetworkSelection();

  const retryWithNextRpc = async (
    operation: () => Promise<any>
  ): Promise<any> => {
    const rpcs = getCurrentNetworkRpcs();
    const maxRetries = Math.min(rpcs.length, 3); // 最多尝试3个RPC

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        if (i < maxRetries - 1 && isRpcRelatedError(error as Error)) {
          // 切换到下一个RPC
          const nextRpcIndex = (selectedRpcIndex + i + 1) % rpcs.length;
          selectRpc(nextRpcIndex);

          // 等待一小段时间让RPC切换生效
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }
    }
  };

  return { retryWithNextRpc };
};

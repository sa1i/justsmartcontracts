import React, { useEffect } from "react";
import {
  EnhancedWeb3Provider,
  DynamicMultiChainWeb3Provider,
} from "./provider";
import { useNetworks, useNetworkSelection } from "../chainlist/store";
import { TWithChildren } from "../props";
import { Spin } from "antd";

/**
 * 增强版 Web3 包装器
 * 负责初始化网络数据并提供 Web3 上下文
 */
export const EnhancedWeb3Wrapper: React.FC<TWithChildren> = ({ children }) => {
  const { networks, isLoading, fetchNetworks } = useNetworks();
  const { selectedNetwork, selectNetwork } = useNetworkSelection();

  // 初始化网络数据
  useEffect(() => {
    if (networks.length === 0 && !isLoading) {
      fetchNetworks();
    }
  }, [networks.length, isLoading, fetchNetworks]);

  // 如果没有选择网络，选择第一个可用的网络
  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      // 优先选择以太坊主网，如果没有则选择第一个
      const ethereum = networks.find((n) => n.chainId === 1);
      const defaultNetwork = ethereum || networks[0];
      selectNetwork(defaultNetwork);
    }
  }, [selectedNetwork, networks, selectNetwork]);

  // 显示加载状态
  if (isLoading || (!selectedNetwork && networks.length === 0)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Loading networks..." />
      </div>
    );
  }

  return <EnhancedWeb3Provider>{children}</EnhancedWeb3Provider>;
};

/**
 * 动态多链 Web3 包装器
 * 支持所有允许合约交互的链
 */
export const DynamicMultiChainWeb3Wrapper: React.FC<TWithChildren> = ({
  children,
}) => {
  const { networks, isLoading, fetchNetworks } = useNetworks();
  const { selectedNetwork, selectNetwork } = useNetworkSelection();

  // 初始化网络数据
  useEffect(() => {
    if (networks.length === 0 && !isLoading) {
      fetchNetworks();
    }
  }, [networks.length, isLoading, fetchNetworks]);

  // 如果没有选择网络，选择第一个可用的网络
  useEffect(() => {
    if (!selectedNetwork && networks.length > 0) {
      // 优先选择以太坊主网，如果没有则选择第一个
      const ethereum = networks.find((n) => n.chainId === 1);
      const defaultNetwork = ethereum || networks[0];
      selectNetwork(defaultNetwork);
    }
  }, [selectedNetwork, networks, selectNetwork]);

  // 显示加载状态
  if (isLoading || (!selectedNetwork && networks.length === 0)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Loading networks..." />
      </div>
    );
  }

  return (
    <DynamicMultiChainWeb3Provider>{children}</DynamicMultiChainWeb3Provider>
  );
};

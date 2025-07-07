import React, { useEffect, useState } from "react";
import {
  Card,
  Alert,
  Button,
  Space,
  Typography,
  Spin,
  Divider,
  Tag,
  Input,
  Modal,
  message,
} from "antd";
import { AbiInput } from "@shared/ui/AbiInput";
import {
  LinkOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { TAddress } from "@shared/lib/web3";
import { TAbiItem } from "@entities/contract";
import { useProxyDetection } from "../model/useProxyDetection";
import { useImplementationAbi } from "../model/useImplementationAbi";
import { AddressLink, AddressLinkShort } from "@shared/ui/AddressLink";

const { Text, Link } = Typography;
const { TextArea } = Input;

interface ProxyContractInfoProps {
  contractAddress: TAddress;
  onImplementationFound?: (
    implementationAddress: TAddress,
    abi: TAbiItem[]
  ) => void;
}

export const ProxyContractInfo: React.FC<ProxyContractInfoProps> = ({
  contractAddress,
  onImplementationFound,
}) => {
  const [showManualAbiModal, setShowManualAbiModal] = useState(false);
  const [manualAbiText, setManualAbiText] = useState("");

  const {
    proxyInfo,
    isLoading: isDetecting,
    error: detectionError,
    detectProxy,
    reset: resetDetection,
  } = useProxyDetection();

  const {
    implementationContract,
    isLoading: isFetchingAbi,
    error: abiError,
    fetchImplementationAbi,
    setManualAbi: setManualImplementationAbi,
    reset: resetAbi,
  } = useImplementationAbi();

  // 自动检测代理
  useEffect(() => {
    if (contractAddress) {
      detectProxy(contractAddress);
    }
    return () => {
      resetDetection();
      resetAbi();
    };
  }, [contractAddress, detectProxy, resetDetection, resetAbi]);

  // 当检测到代理时，自动获取实现合约的 ABI
  useEffect(() => {
    if (proxyInfo?.isProxy && proxyInfo.implementationAddress) {
      fetchImplementationAbi(proxyInfo.implementationAddress);
    }
  }, [proxyInfo, fetchImplementationAbi]);

  // 当获取到实现合约信息时，通知父组件
  useEffect(() => {
    if (implementationContract && onImplementationFound) {
      onImplementationFound(
        implementationContract.address,
        implementationContract.abi
      );
    }
  }, [implementationContract, onImplementationFound]);

  const handleManualAbiSubmit = () => {
    if (!proxyInfo?.implementationAddress || !manualAbiText) return;

    try {
      const parsedAbi = JSON.parse(manualAbiText);
      setManualImplementationAbi(
        proxyInfo.implementationAddress,
        parsedAbi,
        "Manual Implementation"
      );
      setShowManualAbiModal(false);
      setManualAbiText("");
      message.success("Manual ABI set successfully!");
    } catch (error) {
      message.error("Invalid JSON format for ABI");
    }
  };

  const getProxyTypeColor = (type?: string) => {
    switch (type) {
      case "EIP1967":
        return "blue";
      case "Transparent":
        return "green";
      case "UUPS":
        return "purple";
      case "Custom":
        return "orange";
      default:
        return "default";
    }
  };

  if (isDetecting) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Spin size="small" />
          <Text>Detecting proxy contract...</Text>
        </Space>
      </Card>
    );
  }

  if (detectionError) {
    return (
      <Alert
        message="Proxy Detection Error"
        description={detectionError}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Button size="small" onClick={() => detectProxy(contractAddress)}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!proxyInfo?.isProxy) {
    return null; // 不是代理合约，不显示任何内容
  }

  return (
    <>
      <Card
        size="small"
        title={
          <Space>
            <LinkOutlined />
            <Text strong>Proxy Contract Detected</Text>
            <Tag color={getProxyTypeColor(proxyInfo.proxyType)}>
              {proxyInfo.proxyType}
            </Tag>
          </Space>
        }
        style={{ marginBottom: 16 }}
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => detectProxy(contractAddress)}
          >
            Refresh
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 实现合约地址 */}
          {proxyInfo.implementationAddress && (
            <div>
              <Text type="secondary">Implementation Contract:</Text>
              <br />
              <AddressLink address={proxyInfo.implementationAddress} />
            </div>
          )}

          {/* 管理员地址 */}
          {proxyInfo.adminAddress && (
            <div>
              <Text type="secondary">Admin Address:</Text>
              <br />
              <AddressLink address={proxyInfo.adminAddress} />
            </div>
          )}

          <Divider style={{ margin: "12px 0" }} />

          {/* 实现合约 ABI 状态 */}
          {isFetchingAbi ? (
            <Space>
              <Spin size="small" />
              <Text>Fetching implementation contract ABI...</Text>
            </Space>
          ) : implementationContract ? (
            <Space>
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
              <Text>
                Implementation ABI loaded
                {implementationContract.verified ? " (verified)" : " (manual)"}
              </Text>
              <Text type="secondary">
                ({implementationContract.abi.length} functions)
              </Text>
            </Space>
          ) : abiError ? (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                <Text type="warning">Could not fetch implementation ABI</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {abiError}
              </Text>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => setShowManualAbiModal(true)}
              >
                Set Manual ABI
              </Button>
            </Space>
          ) : null}
        </Space>
      </Card>

      {/* 手动设置 ABI 的模态框 */}
      <Modal
        title="Set Implementation Contract ABI"
        open={showManualAbiModal}
        onOk={handleManualAbiSubmit}
        onCancel={() => {
          setShowManualAbiModal(false);
          setManualAbiText("");
        }}
        width={600}
        okText="Set ABI"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>
            Please paste the ABI JSON for the implementation contract:
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Implementation Address: {proxyInfo.implementationAddress}
          </Text>
          <AbiInput
            value={manualAbiText}
            onChange={setManualAbiText}
            placeholder="Paste ABI JSON here..."
            rows={10}
            showSaveButton={true}
            showHistoryButton={true}
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            The ABI should be a valid JSON array containing the contract's
            function definitions.
          </Text>
        </Space>
      </Modal>
    </>
  );
};

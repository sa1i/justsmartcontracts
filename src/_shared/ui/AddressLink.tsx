import React from "react";
import { Typography, Tooltip, Button } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { LinkOutlined } from "@ant-design/icons";
import { TAddress } from "@shared/lib/web3";
import { useNetworkSelection } from "@shared/lib/chainlist/store";
import { shortAddress } from "@shared/lib/web3/address";
import { message } from "antd";

const { Link, Text } = Typography;

interface AddressLinkProps {
  address: TAddress;
  showShort?: boolean;
  showCopy?: boolean;
  showExternal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AddressLink: React.FC<AddressLinkProps> = ({
  address,
  showShort = true,
  showCopy = true,
  showExternal = true,
  className,
  style,
}) => {
  const { selectedNetwork } = useNetworkSelection();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(address);
      message.success("Address copied to clipboard");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      message.success("Address copied to clipboard");
    }
  };

  const getExplorerUrl = () => {
    if (!selectedNetwork?.blockExplorers?.length) {
      return null;
    }

    const explorer = selectedNetwork.blockExplorers[0];
    return `${explorer.url}/address/${address}`;
  };

  const explorerUrl = getExplorerUrl();
  const displayAddress = showShort ? shortAddress(address) : address;

  return (
    <span 
      className={className} 
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: "8px",
        ...style 
      }}
    >
      <Tooltip title={`Full address: ${address}`}>
        {explorerUrl ? (
          <Link
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "monospace",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {displayAddress}
            {showExternal && <LinkOutlined style={{ fontSize: "12px" }} />}
          </Link>
        ) : (
          <Text
            code
            style={{
              fontFamily: "monospace",
              cursor: "default",
            }}
          >
            {displayAddress}
          </Text>
        )}
      </Tooltip>
      {showCopy && (
        <Tooltip title="Copy full address">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            style={{
              padding: "0 4px",
              height: "auto",
              minWidth: "auto",
            }}
          />
        </Tooltip>
      )}
    </span>
  );
};

// 简化版本，只显示短地址和外部链接
export const AddressLinkShort: React.FC<{
  address: TAddress;
  className?: string;
}> = ({ address, className }) => (
  <AddressLink
    address={address}
    showShort={true}
    showCopy={false}
    showExternal={true}
    className={className}
  />
);

// 完整版本，显示完整地址
export const AddressLinkFull: React.FC<{
  address: TAddress;
  className?: string;
}> = ({ address, className }) => (
  <AddressLink
    address={address}
    showShort={false}
    showCopy={true}
    showExternal={true}
    className={className}
  />
);

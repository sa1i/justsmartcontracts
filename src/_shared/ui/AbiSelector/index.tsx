import React, { useState } from "react";
import {
  Button,
  Select,
  Input,
  Space,
  Typography,
  Tag,
  Tooltip,
  Modal,
  message,
} from "antd";
import {
  HistoryOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAbiStorage } from "@shared/lib/abi-storage";
import { TSavedAbi } from "@shared/lib/abi-storage/types";

const { Option } = Select;
const { Text } = Typography;

type TAbiSelectorProps = {
  value?: string;
  onChange?: (abi: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const AbiSelector: React.FC<TAbiSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select from saved ABIs",
  disabled = false,
}) => {
  const { savedAbis, deleteAbi, markAsUsed } = useAbiStorage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filteredAbis = searchQuery
    ? savedAbis.filter(
        (abi) =>
          abi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          abi.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          abi.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : savedAbis;

  const handleSelect = (abiId: string) => {
    const selectedAbi = savedAbis.find((abi) => abi.id === abiId);
    if (selectedAbi && onChange) {
      onChange(selectedAbi.abi);
      markAsUsed(abiId);
      setShowModal(false);
    }
  };

  const handleDelete = (abiId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete ABI",
      content: "Are you sure you want to delete this saved ABI?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteAbi(abiId);
        message.success("ABI deleted successfully");
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderAbiItem = (abi: TSavedAbi) => (
    <div
      key={abi.id}
      className="abi-item"
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid #f0f0f0",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      onClick={() => handleSelect(abi.id)}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Text strong>{abi.name}</Text>
          {abi.tags && abi.tags.length > 0 && (
            <div>
              {abi.tags.map((tag) => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>
        {abi.description && (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {abi.description}
          </Text>
        )}
        <div style={{ marginTop: "4px" }}>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            Created: {formatDate(abi.createdAt)} | Last used:{" "}
            {formatDate(abi.lastUsedAt)}
          </Text>
        </div>
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={(e) => handleDelete(abi.id, e)}
          danger
        />
      </div>
    </div>
  );

  return (
    <div>
      <Button
        icon={<HistoryOutlined />}
        onClick={() => setShowModal(true)}
        disabled={disabled || savedAbis.length === 0}
        style={{ marginBottom: "8px" }}
      >
        Load from History ({savedAbis.length})
      </Button>

      <Modal
        title="Select ABI from History"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: "16px" }}>
          <Input
            placeholder="Search ABIs by name, description, or tags..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>

        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredAbis.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <Text type="secondary">
                {searchQuery
                  ? "No ABIs match your search"
                  : "No saved ABIs found"}
              </Text>
            </div>
          ) : (
            filteredAbis.map(renderAbiItem)
          )}
        </div>
      </Modal>
    </div>
  );
};

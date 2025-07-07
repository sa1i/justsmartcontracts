import React, { useState } from "react";
import { Input, Button, Space, Form, Modal, message, Tooltip } from "antd";
import { SaveOutlined, HistoryOutlined } from "@ant-design/icons";
import { AbiSelector } from "@shared/ui/AbiSelector";
import { useAbiStorage } from "@shared/lib/abi-storage";

const { TextArea } = Input;

type TAbiInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  showSaveButton?: boolean;
  showHistoryButton?: boolean;
};

export const AbiInput: React.FC<TAbiInputProps> = ({
  value,
  onChange,
  placeholder = "Enter ABI JSON...",
  disabled = false,
  rows = 10,
  showSaveButton = true,
  showHistoryButton = true,
}) => {
  const { saveAbi } = useAbiStorage();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm] = Form.useForm();

  const isValidAbi = (abi: string): boolean => {
    try {
      const parsed = JSON.parse(abi);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!value || !isValidAbi(value)) {
      message.error("Please enter a valid ABI before saving");
      return;
    }

    setShowSaveModal(true);
  };

  const handleSaveSubmit = async () => {
    try {
      const values = await saveForm.validateFields();
      await saveAbi(
        values.name,
        value!,
        values.description,
        values.tags ? values.tags.split(",").map((tag: string) => tag.trim()) : []
      );
      message.success("ABI saved successfully!");
      setShowSaveModal(false);
      saveForm.resetFields();
    } catch (error) {
      message.error("Failed to save ABI: " + (error as Error).message);
    }
  };

  const handleLoadFromHistory = (abi: string) => {
    if (onChange) {
      onChange(abi);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "8px" }}>
        <Space>
          {showHistoryButton && (
            <AbiSelector
              value={value}
              onChange={handleLoadFromHistory}
              disabled={disabled}
            />
          )}
          {showSaveButton && (
            <Tooltip title="Save this ABI for future use">
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={disabled || !value || !isValidAbi(value)}
              >
                Save ABI
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      <TextArea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        style={{ fontFamily: "monospace" }}
      />

      <Modal
        title="Save ABI"
        open={showSaveModal}
        onOk={handleSaveSubmit}
        onCancel={() => {
          setShowSaveModal(false);
          saveForm.resetFields();
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={saveForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name for this ABI" }]}
          >
            <Input placeholder="e.g., ERC20 Token, Uniswap V3 Pool" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea
              placeholder="Optional description for this ABI"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="Tags"
            name="tags"
          >
            <Input placeholder="Comma-separated tags (e.g., DeFi, NFT, Gaming)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
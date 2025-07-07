import React, { useState } from "react";
import { 
  Button, 
  Card, 
  Input, 
  Space, 
  Table, 
  Tag, 
  Typography, 
  Modal, 
  Form, 
  message,
  Upload,
  Tooltip
} from "antd";
import { 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExportOutlined, 
  ImportOutlined,
  CopyOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { useAbiStorage } from "@shared/lib/abi-storage";
import { TSavedAbi } from "@shared/lib/abi-storage/types";
import { abiStorageService } from "@shared/lib/abi-storage/service";

const { Title, Text } = Typography;
const { TextArea } = Input;

export const AbiManagerPage: React.FC = () => {
  const { savedAbis, deleteAbi, updateAbi, loadAbis } = useAbiStorage();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAbi, setEditingAbi] = useState<TSavedAbi | null>(null);
  const [viewingAbi, setViewingAbi] = useState<TSavedAbi | null>(null);
  const [editForm] = Form.useForm();

  const filteredAbis = searchQuery 
    ? savedAbis.filter(abi => 
        abi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        abi.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        abi.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : savedAbis;

  const handleEdit = (abi: TSavedAbi) => {
    setEditingAbi(abi);
    editForm.setFieldsValue({
      name: abi.name,
      description: abi.description || "",
      tags: abi.tags?.join(", ") || "",
    });
  };

  const handleUpdateAbi = async () => {
    try {
      const values = await editForm.validateFields();
      if (editingAbi) {
        await updateAbi(editingAbi.id, {
          name: values.name,
          description: values.description,
          tags: values.tags ? values.tags.split(",").map((tag: string) => tag.trim()) : [],
        });
        message.success("ABI updated successfully!");
        setEditingAbi(null);
        editForm.resetFields();
      }
    } catch (error) {
      message.error("Failed to update ABI");
    }
  };

  const handleDelete = (abi: TSavedAbi) => {
    Modal.confirm({
      title: "Delete ABI",
      content: `Are you sure you want to delete "${abi.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteAbi(abi.id);
        message.success("ABI deleted successfully!");
      },
    });
  };

  const handleCopy = (abi: TSavedAbi) => {
    navigator.clipboard.writeText(abi.abi);
    message.success("ABI copied to clipboard!");
  };

  const handleExport = () => {
    try {
      const exported = abiStorageService.exportAbis();
      const blob = new Blob([exported], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `abi-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("ABIs exported successfully!");
    } catch (error) {
      message.error("Failed to export ABIs");
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedCount = abiStorageService.importAbis(content);
        loadAbis();
        message.success(`Successfully imported ${importedCount} ABIs!`);
      } catch (error) {
        message.error("Failed to import ABIs: " + (error as Error).message);
      }
    };
    reader.readAsText(file);
    return false;
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: TSavedAbi) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags: string[]) => (
        <div>
          {tags?.map(tag => (
            <Tag key={tag} color="blue" size="small">{tag}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Last Used",
      dataIndex: "lastUsedAt",
      key: "lastUsedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: TSavedAbi) => (
        <Space>
          <Tooltip title="View ABI">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewingAbi(record)}
            />
          </Tooltip>
          <Tooltip title="Copy ABI">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div style={{ marginBottom: "24px" }}>
          <Title level={2}>ABI Manager</Title>
          <Text type="secondary">
            Manage your saved ABIs for easy reuse across contracts
          </Text>
        </div>

        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Input
            placeholder="Search ABIs by name, description, or tags..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "300px" }}
            allowClear
          />
          
          <Space>
            <Upload
              accept=".json"
              beforeUpload={handleImport}
              showUploadList={false}
            >
              <Button icon={<ImportOutlined />}>
                Import ABIs
              </Button>
            </Upload>
            <Button 
              icon={<ExportOutlined />} 
              onClick={handleExport}
              disabled={savedAbis.length === 0}
            >
              Export ABIs
            </Button>
          </Space>
        </div>

        <Table
          dataSource={filteredAbis}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ABIs`,
          }}
        />

        {/* Edit Modal */}
        <Modal
          title="Edit ABI"
          open={!!editingAbi}
          onOk={handleUpdateAbi}
          onCancel={() => {
            setEditingAbi(null);
            editForm.resetFields();
          }}
          okText="Update"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Please enter a name" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Tags" name="tags">
              <Input placeholder="Comma-separated tags" />
            </Form.Item>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          title={`View ABI: ${viewingAbi?.name}`}
          open={!!viewingAbi}
          onCancel={() => setViewingAbi(null)}
          footer={[
            <Button key="copy" icon={<CopyOutlined />} onClick={() => viewingAbi && handleCopy(viewingAbi)}>
              Copy ABI
            </Button>,
            <Button key="close" onClick={() => setViewingAbi(null)}>
              Close
            </Button>,
          ]}
          width={800}
        >
          {viewingAbi && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {viewingAbi.description && (
                    <div>
                      <Text strong>Description:</Text> {viewingAbi.description}
                    </div>
                  )}
                  {viewingAbi.tags && viewingAbi.tags.length > 0 && (
                    <div>
                      <Text strong>Tags:</Text>{" "}
                      {viewingAbi.tags.map(tag => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </div>
                  )}
                  <div>
                    <Text strong>Created:</Text> {new Date(viewingAbi.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <Text strong>Last Used:</Text> {new Date(viewingAbi.lastUsedAt).toLocaleString()}
                  </div>
                </Space>
              </div>
              <TextArea
                value={viewingAbi.abi}
                rows={20}
                readOnly
                style={{ fontFamily: "monospace" }}
              />
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};
import React from "react";
import { Button, Upload, message } from "antd";
import {
  UploadOutlined,
  ExportOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { contractModel } from "@entities/contract";

export const ContractImportExportButton = () => {
  const { importContracts, exportContracts } = contractModel.useContracts();

  const handleImport = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const contracts = JSON.parse(content);
        importContracts(contracts);
        message.success("Contracts imported successfully!");
      };
      reader.readAsText(file);
    } catch (error) {
      message.error("Failed to import contracts.");
    }
  };

  const handleExport = () => {
    const contracts = exportContracts();
    const blob = new Blob([JSON.stringify(contracts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contracts.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <Upload
        accept=".json"
        beforeUpload={(file) => {
          handleImport(file);
          return false; // Prevent automatic upload
        }}
        showUploadList={false}
      >
        <Button title="Import Contracts" icon={<ImportOutlined />}>
          Import
        </Button>
      </Upload>
      <Button
        icon={<ExportOutlined />}
        title="Export Contracts"
        onClick={handleExport}
        style={{ marginLeft: "10px" }}
      >
        Export
      </Button>
    </div>
  );
};

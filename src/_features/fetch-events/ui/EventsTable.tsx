import { ParamValue, TAbiEvent, TEventLogs } from "@entities/contract";
import { getTxUrl } from "@shared/lib/web3/chainConfig";
import { ExternalLink } from "@shared/ui/ExternalLink";
import { Table } from "antd";
import { useNetworks } from "@shared/lib/chainlist/store";
import { NetworkConfig } from "@shared/lib/chainlist/types";

type TProps = {
  chainId: number;
  event: TAbiEvent;
  items: TEventLogs;
  loading?: boolean;
};

const ROW_KEY = "__rowKey";

export const EventsTable = ({ chainId, event, items, loading }: TProps) => {
  const { networks } = useNetworks();
  const network = networks.find(n => n.chainId === chainId);
  const columns = event.inputs.map((input, index) => ({
    title: input.name || `Param ${index}`,
    dataIndex: input.name || index,
    key: input.name || index,

    render: (value: unknown) => (
      <ParamValue abiType={input.type} value={value} />
    ),
  }));

  //let's add columns for system values: blockNumber or transaction hash, in future
  const systemColumns = [
    {
      title: "Block",
      dataIndex: "blockNumber",
      key: "blockNumber",
      render: (value: number) => <ParamValue abiType="uint" value={value} />,
    },
    {
      title: "TxHash",
      dataIndex: "transactionHash",
      key: "transactionHash",
      render: (txHash: string) => {
        const url = network ? getTxUrl(network, txHash) : `#${txHash}`;
        return (
          <ExternalLink href={url}>{`${txHash.slice(0, 10)}...`}</ExternalLink>
        );
      },
    },
  ];

  const dataSource = items.map((item) => {
    return {
      ...item.args,
      blockNumber: item.blockNumber,
      transactionHash: item.transactionHash,
      [ROW_KEY]: `${item.transactionHash}${item.logIndex}`,
    };
  });

  return (
    <Table
      dataSource={dataSource}
      rowKey={ROW_KEY}
      columns={[...columns, ...systemColumns]}
      size="small"
      scroll={{ x: true }}
      loading={loading}
    ></Table>
  );
};

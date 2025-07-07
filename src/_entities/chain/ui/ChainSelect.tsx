import { Select } from "antd";
import { TValueInput } from "@shared/lib/props";
import { useNetworks } from "@shared/lib/chainlist/store";
import { getNetworkConfig } from "@shared/lib/web3/chainConfig";

type TChainOption = {
  value: number;
  label: string;
  testnet: number;
};

const compareItems = (a: TChainOption, b: TChainOption) => {
  if (a.testnet === b.testnet) {
    return a.value - b.value;
  }

  return a.testnet - b.testnet;
};

type TProps = TValueInput<number> & {};

export const ChainSelect = ({ value, onChange }: TProps) => {
  const { networks } = useNetworks();

  const chainOptions: TChainOption[] = networks
    .map((network) => {
      const config = getNetworkConfig(network);
      return {
        value: network.chainId,
        label: config.name,
        testnet: config.testnet ? 1 : 0,
      };
    })
    .sort(compareItems);

  const options = chainOptions.filter(({ testnet }) => !testnet);
  const testnetOptions = chainOptions.filter(({ testnet }) => testnet);

  return (
    <Select
      style={{ width: "100%" }}
      defaultValue={value}
      onChange={onChange}
      options={[...options, { label: "Testnets", options: testnetOptions }]}
    />
  );
};

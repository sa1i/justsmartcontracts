import { Collapse } from "antd";
import { TContract, contractModel } from "@entities/contract";
import { GetterCall } from "@features/execute-contract";
import { getFunctionSelector } from "viem";

type TProps = {
  contract: TContract;
};

export const CallsList = ({ contract }: TProps) => {
  const functions = contractModel.useContractParamCalls(contract);

  const items = functions.map((item, index) => {
    const hashFunction = getFunctionSelector(item);
    return {
      label: `${item.name}  (${hashFunction})`,
      key: index,
      children: <GetterCall contract={contract} abiItem={item} />,
    };
  });

  return <Collapse items={items} />;
};

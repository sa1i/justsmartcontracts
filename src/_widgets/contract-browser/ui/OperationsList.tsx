import { Collapse } from "antd";
import { TContract, contractModel } from "@entities/contract";
import { CreateTransaction } from "@features/sign-transaction";
import { getFunctionSelector } from "viem";

type TProps = {
  contract: TContract;
};

export const OperationsList = ({ contract }: TProps) => {
  const functions = contractModel.useContractOperations(contract);

  const items = functions.map((item, index) => {
    const hashFunction = getFunctionSelector(item);
    return {
      label: `${item.name}  (${hashFunction})`,
      key: index,
      children: <CreateTransaction contract={contract} abiItem={item} />,
    };
  });

  return <Collapse items={items} />;
};

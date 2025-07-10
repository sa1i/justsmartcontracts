import { chainModel, ChainSelect } from "@entities/chain";
import { useUpdateChain } from "./model";

export const SetCurrentChain = () => {
  const { chainId } = chainModel.useCurrentChain();
  const update = useUpdateChain();

  return <ChainSelect value={chainId} onChange={update} />;
};

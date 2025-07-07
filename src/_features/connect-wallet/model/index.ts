import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export const useConnectWallet = () => {
  const { connect } = useConnect();

  const connectWithMetaMask = async () => {
    const connector = injected();
    await connect({ connector });
  };

  return connectWithMetaMask;
};

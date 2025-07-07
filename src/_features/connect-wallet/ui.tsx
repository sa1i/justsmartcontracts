import { Button, ConfigProvider } from "antd";
import { useConnectWallet } from "./model";

export const ConnectButton = () => {
  const connectWithMetaMask = useConnectWallet();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d1cd47",
        },
      }}
    >
      <Button onClick={connectWithMetaMask} size="middle" type="primary">
        Connect wallet
      </Button>
    </ConfigProvider>
  );
};

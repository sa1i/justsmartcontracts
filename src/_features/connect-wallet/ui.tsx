import { Button, ConfigProvider } from "antd";
import { useConnectWallet } from "./model";

export const ConnectButton = () => {
  const connect = useConnectWallet();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d1cd47",
        },
      }}
    >
      <Button onClick={() => connect()} size="middle" type="primary">
        Connect wallet
      </Button>
    </ConfigProvider>
  );
};

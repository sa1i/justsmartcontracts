import { defineChain } from "viem";

export const zero = /*#__PURE__*/ defineChain({
  id: 543210,
  name: "Zero Network",
  network: "zero",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://zero-network.calderachain.xyz"] },
    public: { http: ["https://zero-network.calderachain.xyz"] },
  },
  blockExplorers: {
    etherscan: { name: "ZeroScan", url: "https://zerion-explorer.vercel.app/" },
    default: { name: "ZeroScan", url: "https://zerion-explorer.vercel.app/" },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 446859,
    },
  },
  testnet: false,
});

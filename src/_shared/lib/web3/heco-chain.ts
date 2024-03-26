import { defineChain } from "viem";

export const heco = /*#__PURE__*/ defineChain({
  id: 128,
  name: "Heco Network",
  network: "heco",
  nativeCurrency: {
    decimals: 18,
    name: "HT",
    symbol: "HT",
  },
  rpcUrls: {
    default: { http: ["https://http-mainnet.hecochain.com"] },
    public: { http: ["https://http-mainnet.hecochain.com"] },
  },
  blockExplorers: {
    etherscan: { name: "HecoScan", url: "https://hecoscan.io/#" },
    default: { name: "HecoScan", url: "https://hecoscan.io/#" },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 446859,
    },
  },
});

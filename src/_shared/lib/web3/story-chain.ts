import { defineChain } from 'viem'

export const story = defineChain({
  id: 1514,
  name: 'Story',
  network: 'story',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.story.foundation'],
    },
    public: {
      http: ['https://rpc.story.foundation'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Explorer',
      url: 'https://explorer.story.foundation',
    },
  },
})

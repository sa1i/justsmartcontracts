/// <reference types="vitest/globals" />
/// <vitest-environment jsdom />

import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createConfig, WagmiProvider, useReadContract, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { zero } from "../_shared/lib/web3/zero-chain";
import { polygon } from "viem/chains";
import { PropsWithChildren } from "react";
import { createPublicClient, getContract } from "viem";

const printChainConfig = (chain: any) => {
  console.log("Chain Config:", {
    id: chain.id,
    name: chain.name,
    network: chain.network,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
    blockExplorers: chain.blockExplorers,
    contracts: chain.contracts,
  });
};

describe("Chain Configs Comparison", () => {
  it("should compare zero and polygon configs", () => {
    console.log("\n=== Zero Chain Config ===");
    printChainConfig(zero);

    console.log("\n=== Polygon Chain Config ===");
    printChainConfig(polygon);

    // 打印 transport 配置
    console.log("\n=== Zero Transport Config ===");
    const zeroTransport = http("https://zero-network.calderachain.xyz", {
      batch: false,
      retryCount: 0,
      timeout: 10000,
    });
    console.log(zeroTransport);

    console.log("\n=== Polygon Transport Config ===");
    const polygonTransport = http("https://polygon-rpc.com", {
      batch: false,
      retryCount: 0,
      timeout: 10000,
    });
    console.log(polygonTransport);
  });
});

describe("Contract Calls", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });

  const config = createConfig({
    chains: [zero],
    transports: {
      [zero.id]: http("https://zero-network.calderachain.xyz", {
        batch: false,
        retryCount: 0,
        timeout: 10000,
      }),
    },
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>{children}</WagmiProvider>
    </QueryClientProvider>
  );

  const MULTISIG_ADDRESS = "0xc2031257C9aceaC26B20b85528272A15aeE3027b";
  const MULTISIG_ABI = [
    {
      inputs: [],
      name: "required",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  it("should test direct viem call", async () => {
    const client = createPublicClient({
      chain: zero,
      transport: http("https://zero-network.calderachain.xyz"),
    });

    try {
      const result = await client.readContract({
        address: MULTISIG_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: "required",
      });

      console.log("Viem direct call result:", result);
      expect(result).toBeDefined();
    } catch (error) {
      console.error("Viem call error:", error);
      throw error;
    }
  });

  it("should test direct viem call using getContract", async () => {
    const client = createPublicClient({
      chain: zero,
      transport: http("https://zero-network.calderachain.xyz"),
    });

    try {
      const result = await client.readContract({
        address: MULTISIG_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: "required",
      });

      console.log("Viem readContract result:", result);
      expect(result).toBeDefined();
    } catch (error) {
      console.error("Viem readContract error:", error);
      throw error;
    }
  });

  // it("should test useReadContract hook", async () => {
  //   const client = createPublicClient({
  //     chain: zero,
  //     transport: http("https://zero-network.calderachain.xyz"),
  //   });

  //   const directResult = await client.readContract({
  //     address: MULTISIG_ADDRESS,
  //     abi: MULTISIG_ABI,
  //     functionName: "required",
  //   });

  //   console.log("Direct viem call result:", directResult);

  //   const { result } = renderHook(
  //     () =>
  //       useReadContract({
  //         address: MULTISIG_ADDRESS,
  //         abi: MULTISIG_ABI,
  //         functionName: "required",
  //         chainId: zero.id,
  //         account: undefined,
  //         blockNumber: undefined,
  //         blockTag: "latest",
  //       }),
  //     { wrapper: Wrapper }
  //   );

  //   await waitFor(
  //     () => {
  //       console.log("Current hook state:", {
  //         data: result.current.data,
  //         error: result.current.error,
  //         status: result.current.status,
  //         isPending: result.current.isPending,
  //         isFetching: result.current.isFetching,
  //         queryKey: result.current.queryKey,
  //       });

  //       if (result.current.error) {
  //         console.error("Hook error details:", {
  //           error: result.current.error,
  //           message: result.current.error.message,
  //           cause: result.current.error.cause,
  //         });
  //       }

  //       expect(result.current.data).toBe(2n);
  //     },
  //     {
  //       timeout: 5000,
  //       interval: 100,
  //     }
  //   );
  // });
});

describe("Polygon Contract Calls", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });

  const config = createConfig({
    chains: [polygon],
    transports: {
      [polygon.id]: http("https://polygon-rpc.com", {
        batch: false,
        retryCount: 0,
        timeout: 10000,
      }),
    },
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>{children}</WagmiProvider>
    </QueryClientProvider>
  );

  const POLYGON_CONTRACT = {
    address: "0x39E3e49C99834C9573c9FC7Ff5A4B226cD7B0E63",
    abi: [
      {
        inputs: [],
        name: "totalWeight",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
  } as const;

  it("should read totalWeight from Polygon contract", async () => {
    const { result } = renderHook(
      () =>
        useReadContract({
          address: POLYGON_CONTRACT.address,
          abi: POLYGON_CONTRACT.abi,
          functionName: "totalWeight",
          chainId: polygon.id,
        }),
      { wrapper: Wrapper }
    );

    await waitFor(
      () => {
        console.log("Polygon contract state:", {
          data: result.current.data,
          error: result.current.error,
          status: result.current.status,
          isPending: result.current.isPending,
          isFetching: result.current.isFetching,
        });

        if (result.current.error) {
          console.error("Polygon contract error:", {
            error: result.current.error,
            message: result.current.error.message,
            cause: result.current.error.cause,
          });
        }

        expect(result.current.data).toBeDefined();
      },
      {
        timeout: 5000,
        interval: 100,
      }
    );
  });
});

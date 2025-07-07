import { useCallback, useState } from "react";
import { TAddress } from "@shared/lib/web3";
import { TAbiItem } from "@entities/contract";
import { useNetworkSelection } from "@shared/lib/chainlist/store";

export interface ImplementationContract {
  address: TAddress;
  abi: TAbiItem[];
  name?: string;
  verified?: boolean;
}

export const useImplementationAbi = () => {
  const [implementationContract, setImplementationContract] = useState<ImplementationContract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedNetwork } = useNetworkSelection();

  const fetchImplementationAbi = useCallback(async (implementationAddress: TAddress) => {
    if (!selectedNetwork) {
      setError("No network selected");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 尝试从区块链浏览器获取 ABI
      const abi = await fetchAbiFromExplorer(implementationAddress, selectedNetwork.chainId);
      
      if (abi) {
        const contract: ImplementationContract = {
          address: implementationAddress,
          abi,
          verified: true,
        };
        
        setImplementationContract(contract);
        return contract;
      } else {
        setError("Could not fetch ABI for implementation contract. The contract may not be verified.");
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch implementation ABI";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedNetwork]);

  const setManualAbi = useCallback((implementationAddress: TAddress, abi: TAbiItem[], name?: string) => {
    const contract: ImplementationContract = {
      address: implementationAddress,
      abi,
      name,
      verified: false,
    };
    
    setImplementationContract(contract);
    setError(null);
    return contract;
  }, []);

  const reset = useCallback(() => {
    setImplementationContract(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    implementationContract,
    isLoading,
    error,
    fetchImplementationAbi,
    setManualAbi,
    reset,
  };
};

// 从区块链浏览器获取 ABI 的辅助函数
async function fetchAbiFromExplorer(address: TAddress, chainId: number): Promise<TAbiItem[] | null> {
  try {
    // 根据不同的链ID使用不同的API
    let apiUrl: string;
    let apiKey: string | undefined;

    switch (chainId) {
      case 1: // Ethereum Mainnet
        apiUrl = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
        break;
      case 137: // Polygon
        apiUrl = `https://api.polygonscan.com/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY;
        break;
      case 56: // BSC
        apiUrl = `https://api.bscscan.com/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY;
        break;
      case 42161: // Arbitrum
        apiUrl = `https://api.arbiscan.io/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_ARBISCAN_API_KEY;
        break;
      case 10: // Optimism
        apiUrl = `https://api-optimistic.etherscan.io/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_OPTIMISM_API_KEY;
        break;
      case 43114: // Avalanche
        apiUrl = `https://api.snowtrace.io/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_SNOWTRACE_API_KEY;
        break;
      case 250: // Fantom
        apiUrl = `https://api.ftmscan.com/api?module=contract&action=getabi&address=${address}`;
        apiKey = process.env.NEXT_PUBLIC_FTMSCAN_API_KEY;
        break;
      default:
        // 对于不支持的链，尝试使用通用的方法或返回null
        console.warn(`No explorer API configured for chain ID ${chainId}`);
        return null;
    }

    // 添加 API key 如果可用
    if (apiKey) {
      apiUrl += `&apikey=${apiKey}`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === "1" && data.result) {
      try {
        const abi = JSON.parse(data.result);
        return abi as TAbiItem[];
      } catch (parseError) {
        console.error("Failed to parse ABI:", parseError);
        return null;
      }
    } else {
      console.warn("Contract not verified or ABI not available:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error fetching ABI from explorer:", error);
    return null;
  }
}

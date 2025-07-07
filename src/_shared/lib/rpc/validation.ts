/**
 * RPC URL 验证和清理工具
 */

export interface RpcValidationResult {
  isValid: boolean;
  url?: string;
  error?: string;
}

/**
 * 验证和清理RPC URL
 */
export function validateRpcUrl(input: any): RpcValidationResult {
  // 检查输入类型
  if (typeof input !== 'string') {
    return {
      isValid: false,
      error: `Invalid RPC URL type: expected string, got ${typeof input}. Value: ${JSON.stringify(input)}`
    };
  }

  const url = input.trim();

  // 检查是否为空
  if (!url) {
    return {
      isValid: false,
      error: 'RPC URL is empty'
    };
  }

  // 检查是否以http开头
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      isValid: false,
      error: `RPC URL must start with http:// or https://, got: ${url}`
    };
  }

  // 尝试创建URL对象验证格式
  try {
    new URL(url);
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL format: ${url}`
    };
  }

  return {
    isValid: true,
    url
  };
}

/**
 * 清理和验证RPC URL数组
 */
export function cleanRpcUrls(urls: any[]): string[] {
  const validUrls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const result = validateRpcUrl(urls[i]);
    if (result.isValid && result.url) {
      validUrls.push(result.url);
    } else {
      errors.push(`Index ${i}: ${result.error}`);
    }
  }

  if (errors.length > 0) {
    console.warn('RPC URL validation errors:', errors);
  }

  return validUrls;
}

/**
 * 验证RPC配置对象
 */
export function validateRpcConfig(rpc: any): RpcValidationResult {
  if (!rpc || typeof rpc !== 'object') {
    return {
      isValid: false,
      error: `Invalid RPC config: expected object, got ${typeof rpc}`
    };
  }

  if (!rpc.url) {
    return {
      isValid: false,
      error: 'RPC config missing url property'
    };
  }

  return validateRpcUrl(rpc.url);
}

/**
 * 清理和验证RPC配置数组
 */
export function cleanRpcConfigs(rpcs: any[]): Array<{url: string, name: string}> {
  const validConfigs: Array<{url: string, name: string}> = [];
  const errors: string[] = [];

  for (let i = 0; i < rpcs.length; i++) {
    const result = validateRpcConfig(rpcs[i]);
    if (result.isValid && result.url) {
      validConfigs.push({
        url: result.url,
        name: rpcs[i].name || `RPC ${i + 1}`
      });
    } else {
      errors.push(`Index ${i}: ${result.error}`);
    }
  }

  if (errors.length > 0) {
    console.warn('RPC config validation errors:', errors);
  }

  return validConfigs;
}

/**
 * 测试RPC连接
 */
export async function testRpcConnection(url: string, chainId?: number): Promise<{
  success: boolean;
  responseTime?: number;
  blockNumber?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        responseTime,
        error: data.error.message || 'RPC Error'
      };
    }

    const returnedChainId = parseInt(data.result, 16);
    
    // 如果提供了期望的chainId，验证是否匹配
    if (chainId && returnedChainId !== chainId) {
      return {
        success: false,
        responseTime,
        error: `Chain ID mismatch: expected ${chainId}, got ${returnedChainId}`
      };
    }

    // 获取最新区块号
    try {
      const blockResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 2,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        const blockNumber = blockData.result ? parseInt(blockData.result, 16) : undefined;
        
        return {
          success: true,
          responseTime,
          blockNumber
        };
      }
    } catch (blockError) {
      // 区块号获取失败不影响整体成功状态
    }

    return {
      success: true,
      responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        responseTime,
        error: 'Request timeout (>10s)'
      };
    }

    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

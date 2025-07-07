# Network Selector Feature

This document describes the new network selection system that integrates with chainlist.org to provide access to thousands of blockchain networks with RPC switching capabilities.

## Features

### 🌐 Chainlist Integration
- Fetches network data from https://chainlist.org/rpcs.json
- Supports thousands of blockchain networks
- Automatic caching with 24-hour expiration
- Real-time network data updates

### 🔄 RPC Switching
- Multiple RPC endpoints per network
- Custom RPC endpoint management
- Automatic RPC validation
- Fallback RPC support

### 🔍 Advanced Search & Filtering
- Search networks by name, chain ID, or symbol
- Filter by mainnet/testnet
- Risk level indicators
- Support status indicators

### 🎨 Modern UI Components
- Network selection modal with search
- RPC management interface
- Enhanced chain selector with chainlist integration
- Network information display components

## Components

### NetworkPanel
Main component for network selection with dropdown interface.

```tsx
import { NetworkPanel } from '@features/network-selector';

<NetworkPanel 
  onNetworkChange={(network) => console.log(network)}
  size="small"
/>
```

### NetworkSelector
Modal component for selecting networks from the full chainlist.

```tsx
import { NetworkSelector } from '@features/network-selector';

<NetworkSelector
  visible={showModal}
  onClose={() => setShowModal(false)}
  onNetworkSelect={(network) => handleSelect(network)}
/>
```

### RpcSelector
Modal component for managing RPC endpoints for the selected network.

```tsx
import { RpcSelector } from '@features/network-selector';

<RpcSelector
  visible={showRpcModal}
  onClose={() => setShowRpcModal(false)}
/>
```

### EnhancedChainSelect
Enhanced version of the traditional chain selector with chainlist integration.

```tsx
import { EnhancedChainSelect } from '@entities/chain';

<EnhancedChainSelect
  value={selectedChain}
  onChange={setSelectedChain}
  showNetworkSelector={true}
/>
```

## State Management

The system uses Zustand for state management with the following stores:

### Network Store
- `useNetworks()` - Network data and loading states
- `useNetworkSelection()` - Current network and RPC selection
- `useNetworkFilters()` - Search and filter states
- `useCustomRpcs()` - Custom RPC management

## Data Flow

1. **Initialization**: Fetch network data from chainlist.org on first use
2. **Caching**: Store data in localStorage with 24-hour expiration
3. **Selection**: User selects network from thousands of options
4. **RPC Management**: Configure and switch between RPC endpoints
5. **Integration**: Map selected network to existing chain system

## Network Data Structure

Each network from chainlist.org includes:

```typescript
interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  chain: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorers?: Array<{
    name: string;
    url: string;
    standard: string;
  }>;
  faucets: string[];
  infoURL: string;
  icon?: string;
  testnet: boolean;
  status?: string;
  redFlags?: string[];
}
```

## RPC Configuration

Each RPC endpoint includes:

```typescript
interface RpcConfig {
  url: string;
  name: string;
  isDefault: boolean;
  isCustom: boolean;
}
```

## Integration with Existing System

The new system integrates with the existing chain management through:

1. **Adapter Layer**: Maps chainlist networks to existing Chain enum
2. **Backward Compatibility**: Existing chain selectors continue to work
3. **Enhanced Components**: New components provide additional functionality
4. **Gradual Migration**: Can be adopted incrementally

## Usage Examples

### Basic Network Selection
```tsx
import { NetworkPanel } from '@features/network-selector';

function MyComponent() {
  return (
    <NetworkPanel 
      onNetworkChange={(network) => {
        console.log('Selected:', network.name, network.chainId);
      }}
    />
  );
}
```

### Custom RPC Management
```tsx
import { useCustomRpcs } from '@shared/lib/chainlist';

function RpcManager() {
  const { addCustomRpc, removeCustomRpc } = useCustomRpcs();
  
  const handleAddRpc = () => {
    addCustomRpc(1, {
      url: 'https://my-custom-rpc.com',
      name: 'My RPC',
      isDefault: false,
      isCustom: true,
    });
  };
  
  return <button onClick={handleAddRpc}>Add Custom RPC</button>;
}
```

### Network Information Display
```tsx
import { NetworkDisplay } from '@features/network-selector';

function NetworkInfo({ network, rpcName }) {
  return (
    <NetworkDisplay 
      network={network}
      rpcName={rpcName}
      size="large"
    />
  );
}
```

## Demo Page

Visit `/networks` to see a comprehensive demo of all network selection features, including:
- Network statistics
- Live network selection
- RPC management
- Network information display
- Integration examples

## Technical Details

### Caching Strategy
- Data cached in localStorage for 24 hours
- Automatic refresh on cache expiration
- Manual refresh capability
- Fallback to cached data on network errors

### Performance Optimizations
- Lazy loading of network data
- Virtualized lists for large datasets
- Debounced search input
- Memoized components

### Error Handling
- Network request failures
- Invalid RPC endpoints
- Unsupported networks
- Cache corruption recovery

## Future Enhancements

- [ ] Network health monitoring
- [ ] RPC performance metrics
- [ ] Custom network addition
- [ ] Network favorites
- [ ] Advanced filtering options
- [ ] Network comparison tools

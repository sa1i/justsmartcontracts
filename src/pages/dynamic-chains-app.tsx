import { DynamicChainsDemoPage } from "@pages/dynamic-chains-demo";
import { DynamicMultiChainWeb3Wrapper } from "@shared/lib/web3";

function DynamicChainsApp() {
  return (
    <DynamicMultiChainWeb3Wrapper>
      <DynamicChainsDemoPage />
    </DynamicMultiChainWeb3Wrapper>
  );
}

export default DynamicChainsApp;

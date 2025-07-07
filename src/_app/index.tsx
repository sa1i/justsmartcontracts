import dynamic from "next/dynamic";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ErrorBoundary } from "react-error-boundary";
import { AllChainsSupportedWeb3Provider } from "@shared/lib/web3/provider";
import { ErrorPage } from "@pages/error";
import { Layout } from "@widgets/layout";
import { NotificationsProvider } from "@shared/lib/notify";

export const metadata = {
  title: "JustAnotherSmartContracts - Contract Interaction Tool",
  description: "Your tool to interact with smart contracts",
};

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Head>
      <ErrorBoundary fallback={<ErrorPage />}>
        <AllChainsSupportedWeb3Provider>
          <NotificationsProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </NotificationsProvider>
        </AllChainsSupportedWeb3Provider>
      </ErrorBoundary>
    </>
  );
};

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});

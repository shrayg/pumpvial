import { httpsServerFundWallets } from "../../../utils/servercode.js";
import { httpsClientFundWallets } from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import { httpsFundWalletsMetadata } from "../../../utils/codemetadata";
import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";
const FundWallets = () => {
  const { parameters, response } = httpsFundWalletsMetadata;
  const [view, setView] = useState("client");

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Fund Wallets</title>
        <link rel="canonical" href="https://pumpagent.com/https/fund-wallets" />
        <meta property="og:title" content="PumpAgent - Fund Wallets" />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/fund-wallets"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Fund Wallets
      </h1>
      <div className="text-[20px] font-light leading-7 mb-4 md:mb-8 dark:text-black">
        Fund up to 50 wallets in a single transaction.
      </div>

      <div className="flex flex-col lg:flex-row w-full justify-center gap-2 mt-0 md:mt-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Parameters parameters={parameters} />
            <Response parameters={response} />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col gap-2 mt-4 lg:mt-0">
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerFundWallets}
            clientCode={httpsClientFundWallets}
            hasToggle={true}
            view={view}
            setView={setView}
          />
        </div>
      </div>
      <BlogNav />
    </article>
  );
};

export default FundWallets;

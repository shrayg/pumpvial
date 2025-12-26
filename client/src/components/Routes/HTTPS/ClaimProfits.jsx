import { httpsServerClaimProfits } from "../../../utils/servercode.js";
import { httpsClientClaimProfits } from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import { httpsClaimProfitsMetadata } from "../../../utils/codemetadata";
import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const ClaimProfits = () => {
  const { parameters, response } = httpsClaimProfitsMetadata;
  const [view, setView] = useState("client");

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Claim Profits</title>
        <link rel="canonical" href="https://pumpagent.com/https/claim-profits" />
        <meta property="og:title" content="PumpAgent - Claim Profits" />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/claim-profits"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Claim Profits
      </h1>
      <div className="text-[20px] font-light leading-7 dark:text-black">
        Helper route which is useful to embed into applications you build, where
        you don't want to manage payment wallets, but instead prefer to collect
        earnings safely into your PumpAgent Fee Earnings dashboard.
      </div>

      <div className="flex flex-col lg:flex-row w-full justify-center gap-2 mt-5 md:mt-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Parameters parameters={parameters} />
            <Response parameters={response} />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col gap-2 mt-4 lg:mt-0">
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerClaimProfits}
            clientCode={httpsClientClaimProfits}
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

export default ClaimProfits;

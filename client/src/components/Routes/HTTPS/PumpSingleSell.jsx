import { httpsServerPumpSingleSell } from "../../../utils/servercode.js";
import { httpsClientPumpSingleSell } from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import { httpsPumpSingleSellMetadata } from "../../../utils/codemetadata";
import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const PumpSingleSell = () => {
  const [view, setView] = useState("client");
  const { parameters, response } = httpsPumpSingleSellMetadata;

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Pump Single Sell</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/https/pump-single-sell"
        />
        <meta property="og:title" content="PumpAgent - Pump Single Sell" />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/pump-single-sell"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Pump Single Sell
      </h1>
      <div className="text-[20px] font-light leading-7 dark:text-black">
        Sell pump.fun tokens to the bonding curve on a single wallet and
        optionally set up fees to be sent to your dashboard.
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
            serverCode={httpsServerPumpSingleSell}
            clientCode={httpsClientPumpSingleSell}
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

export default PumpSingleSell;

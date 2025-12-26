import {
  httpsServerPumpDumpAll,
  httpsServerSendBundle,
} from "../../../utils/servercode.js";
import {
  httpsClientPumpDumpAll,
  httpsClientSendBundle,
} from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import { httpsPumpDumpAllMetadata } from "../../../utils/codemetadata";
import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const PumpDumpAll = () => {
  const [view, setView] = useState("client");
  const { parameters, response } = httpsPumpDumpAllMetadata;

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Pump Dump All</title>
        <link rel="canonical" href="https://pumpagent.com/https/pump-dump-all" />
        <meta property="og:title" content="PumpAgent - Pump Dump All" />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/pump-dump-all"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Pump Dump All
      </h1>
      <div className="text-[20px] font-light leading-7 mb-4 md:mb-8 dark:text-black">
        Pump Dump All lets you sell all tokens from up to 20 wallets—linked to a
        specific pump.fun contract address—in a single transaction. All proceeds
        are automatically consolidated and sent to a designated receiver wallet.
        No need to specify token amounts. Optionally set up fees to be sent to
        your dashboard.
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
            serverCode={httpsServerPumpDumpAll}
            clientCode={httpsClientPumpDumpAll}
            hasToggle={true}
            view={view}
            setView={setView}
          />
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerSendBundle}
            clientCode={httpsClientSendBundle}
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

export default PumpDumpAll;

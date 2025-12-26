import { httpsServerPumpLaunchBundle } from "../../../utils/servercode.js";
import { httpsClientPumpLaunchBundle } from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import { httpsPumpLaunchBundleMetadata } from "../../../utils/codemetadata";
import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { httpsServerSendBundle } from "../../../utils/servercode.js";
import { httpsClientSendBundle } from "../../../utils/clientcode.js";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const PumpLaunchBundle = () => {
  const navigate = useNavigate();
  const search = useLocation().search;
  const [view, setView] = useState("client");
  const { parameters, response, response2 } = httpsPumpLaunchBundleMetadata;

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Pump Launch Bundle</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/https/pump-launch-bundle"
        />
        <meta property="og:title" content="PumpAgent - Pump Launch Bundle" />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/pump-launch-bundle"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Pump Launch Bundle
      </h1>
      <div className="text-[20px] font-light leading-7 mt-0 md:mb-8 dark:text-black">
        <span className="">
          Launch a token on pump.fun and pre buy with up to 20 wallets.
          Optionally set up fees to be sent to your dashboard.
        </span>
        <span
          className="text-greener cursor-pointer"
          onClick={() => navigate(`/https/create-ipfs${search}`)}
        >
          {" "}
          Creating an IPFS storage object{" "}
        </span>{" "}
        and a{" "}
        <span
          className="text-greener cursor-pointer"
          onClick={() => navigate(`/https/create-lookup-table${search}`)}
        >
          Lookup Table
        </span>{" "}
        are prerequisites.
      </div>
      <div className="flex flex-col lg:flex-row w-full justify-center gap-2 mt-5 md:mt-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Parameters parameters={parameters} />
            <Response parameters={response} />
            <Response parameters={response2} hideTitle={true} />
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-2 mt-4 lg:mt-0">
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerPumpLaunchBundle}
            clientCode={httpsClientPumpLaunchBundle}
            hasToggle={true}
            view={view}
            setView={setView}
          />
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerSendBundle}
            clientCode={httpsClientSendBundle}
            view={view}
            setView={setView}
          />
        </div>
      </div>
      <BlogNav />
    </article>
  );
};

export default PumpLaunchBundle;

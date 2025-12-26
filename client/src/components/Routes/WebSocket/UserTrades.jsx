import { webSocketClientUserTrades } from "../../../utils/clientcode.js";
import { webSocketServerUserTrades } from "../../../utils/servercode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import { webSocketUserTradesMetadata } from "../../../utils/codemetadata";

import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";
import Parameters from "../../Wrappers/Parameters.jsx";

const UserTrades = () => {
  const { parameters, response } = webSocketUserTradesMetadata;
  const [view, setView] = useState("client");

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - User Trades</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/websocket/user-trades"
        />
        <meta property="og:title" content="PumpAgent - User Trades" />
        <meta
          property="og:url"
          content="https://pumpagent.com/websocket/user-trades"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">User Trades</h1>
      <div className="text-[20px] font-light leading-7 dark:text-black">
        Receive information about new trades for a list of user wallet
        addresses.
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
            clientCode={webSocketClientUserTrades}
            serverCode={webSocketServerUserTrades}
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

export default UserTrades;

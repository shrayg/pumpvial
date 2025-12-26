import { webSocketClientTokenCreation } from "../../../utils/clientcode.js";
import { webSocketServerTokenCreation } from "../../../utils/servercode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import { webSocketTokenLaunchMetadata } from "../../../utils/codemetadata";

import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const TokenCreation = () => {
  const { response } = webSocketTokenLaunchMetadata;
  const [view, setView] = useState("client");

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Token Creation</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/websocket/token-creation"
        />
        <meta property="og:title" content="PumpAgent - Token Creation" />
        <meta
          property="og:url"
          content="https://pumpagent.com/websocket/token-creation"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Token Creation
      </h1>
      <div className="text-[20px] font-light leading-7 dark:text-black">
        Receive information about new token launches on pump.fun.
      </div>

      <div className="flex flex-col lg:flex-row w-full justify-center gap-2 mt-5 md:mt-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Response parameters={response} />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col gap-2 mt-4 lg:mt-0">
          <CodeBlock
            language="JavaScript"
            clientCode={webSocketClientTokenCreation}
            serverCode={webSocketServerTokenCreation}
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

export default TokenCreation;

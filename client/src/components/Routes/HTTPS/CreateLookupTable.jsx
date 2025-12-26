import {
  httpsServerCreateLookupTable,
  httpsServerExtendLookupTable,
} from "../../../utils/servercode.js";
import {
  httpsClientCreateLookupTable,
  httpsClientExtendLookupTable,
} from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import {
  httpsCreateLookupTableMetadata,
  httpsExtendLookupTableMetadata,
} from "../../../utils/codemetadata";
import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const CreateLookupTable = () => {
  const [view, setView] = useState("client");
  const { parameters, response, response2 } = httpsCreateLookupTableMetadata;
  const { parameters: extendParameters, response: extendResponse } =
    httpsExtendLookupTableMetadata;

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Create Lookup Table</title>
        <link
          rel="canonical"
          href="https://pumpagent.com/https/create-lookup-table"
        />
        <meta property="og:title" content="PumpAgent - Create Lookup Table" />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/create-lookup-table"
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        Create Lookup Table
      </h1>
      <div className="text-[20px] font-light leading-7 mb-4 md:mb-8 dark:text-black">
        Creating a Lookup Table is useful when performing complex operations on
        the Solana blockchain, such as launching a token bundle on pump.fun.
        It's a modern way for the Solana program to interact with multiple
        wallets in a single transaction.
        <br />
        <br />
        Creating a Lookup Table consists of 2 parts: Creating and extending the
        table.
      </div>

      <div className="flex flex-col lg:flex-row w-full justify-center gap-2 mb-5 md:mt-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Parameters parameters={parameters} />
            <Response parameters={response} />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col gap-2 mt-4 lg:mt-0">
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerCreateLookupTable}
            clientCode={httpsClientCreateLookupTable}
            hasToggle={true}
            view={view}
            setView={setView}
          />
        </div>
      </div>
      <div className="h-[1px] bg-gray-800 w-full mb-8"></div>
      <h1 className="text-5xl lg:text-6xl dark:text-black md:mb-8">
        Extend Lookup Table
      </h1>
      <div className="flex flex-col lg:flex-row w-full justify-center gap-2 mt-5 md:mt-10">
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <Parameters parameters={extendParameters} />
            <Response parameters={extendResponse} />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col gap-2 mt-4 lg:mt-0">
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerExtendLookupTable}
            clientCode={httpsClientExtendLookupTable}
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

export default CreateLookupTable;

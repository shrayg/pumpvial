import { httpsServerPumpSingleBuy } from "../../../utils/servercode.js";
import { httpsClientPumpSingleBuy } from "../../../utils/clientcode.js";
import CodeBlock from "../../CodeBlock/CodeBlock";
import BlogNav from "../../BlogNav/BlogNav";
import Parameters from "../../Wrappers/Parameters";
import { httpsIntroductionMetadata } from "../../../utils/codemetadata";

import { useState } from "react";
import Response from "../../Wrappers/Response.jsx";
import Pagination from "../../Pagination/Pagination.jsx";
import { Helmet } from "react-helmet";

const Introduction = () => {
  const [view, setView] = useState("client");
  const { parameters, response } = httpsIntroductionMetadata;

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>Solana Pump.fun HTTPS API - PumpAgent Developer Guide</title>
        <link rel="canonical" href="https://pumpagent.com/https/introduction" />
        <meta
          name="description"
          content="Get started with PumpAgent's HTTPS API for Solana pump.fun development. Simple REST endpoints for wallet generation, token operations, and more."
        />
        <meta
          name="keywords"
          content="solana https api, pump.fun rest api, blockchain api documentation, solana development"
        />
        <meta
          property="og:title"
          content="Solana Pump.fun HTTPS API - PumpAgent"
        />
        <meta
          property="og:url"
          content="https://pumpagent.com/https/introduction"
        />
        <meta
          property="og:description"
          content="Complete guide to PumpAgent's HTTPS API for Solana pump.fun development. REST endpoints for wallets, tokens, and trading."
        />
      </Helmet>
      <Pagination />
      <h1 className="text-5xl lg:text-6xl dark:text-black pb-8">
        HTTPS Introduction
      </h1>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Getting started with our HTTPS client is simple. Send REST requests to
        our endpoints in your preferred language or framework.
      </p>
      <div className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        For simplicity and safety, our HTTPS endpoints expect most parameters as{" "}
        <pre className="bg-tile-green dark:bg-[rgba(78,255,87,0.23)] inline p-1 px-2 dark:text-black">
          strings
        </pre>
        . This includes values like how much SOL to buy or how many tokens to
        sell.
      </div>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Our endpoints <b>DO NOT</b> require you to send private keys over the
        network. Private keys stay within your code's scope, and are exclusively
        used to sign transactions.
      </p>
      <div className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Authentication is handled via the{" "}
        <pre className="bg-tile-green dark:bg-[rgba(78,255,87,0.23)] inline p-1 px-2 dark:text-black">
          x-api-key
        </pre>{" "}
        header. You can retrieve your API key from the dashboard after signing
        in.
      </div>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        To start receiving trading fees, head over to your dashboard's Fee
        Earnings section, and fund the fee wallet with atleast 0.002 SOL. This
        will make sure account rent is paid for and you can start receiving fees
        (if you decide to opt for them).
      </p>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        We provide both client and serverside examples. When deploying to
        production you would want to keep sensitive data on the server, such as
        your API Key.
      </p>

      <div className="flex flex-col lg:flex-row w-full justify-center xl:justify-start gap-2 mt-10 mx-auto">
        <div className="xl:w-1/2">
          <div className="sticky top-20">
            <Parameters parameters={parameters} />
            <Response parameters={response} />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:w-1/2">
          <CodeBlock
            language="JavaScript"
            serverCode={httpsServerPumpSingleBuy}
            clientCode={httpsClientPumpSingleBuy}
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

export default Introduction;

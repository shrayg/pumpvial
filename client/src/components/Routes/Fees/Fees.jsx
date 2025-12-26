import { useState } from "react";
import Pagination from "../../Pagination/Pagination";
import { Helmet } from "react-helmet";

const apprenticeFeeData = [
  {
    name: "Generate Wallets",
    route: "/generate-wallets",
    fee: "None",
    description: "Generate up to 1000 wallets per request.",
    limit: "5K/Hour",
  },
  {
    name: "Fund Wallets",
    route: "/fund-wallets",
    fee: "0.005 SOL",
    description: "Distribute SOL to max. 50 wallets in a single transaction.",
    limit: "5K/Hour",
  },
  {
    name: "Claim Profits",
    route: "/claim-profits",
    fee: "None",
    description: "Securely transfer profits to your PumpAgent Dashboard.",
    limit: "5K/Hour",
  },
  {
    name: "Create IPFS",
    route: "/create-ipfs",
    fee: "None",
    description: "Store token metadata on IPFS (I.e, image, description).",
    limit: "5K/Hour",
  },
  {
    name: "Pump Token Info",
    route: "/token-info",
    fee: "None",
    description: "Get the image and other metadata for a token.",
    limit: "5K/Hour",
  },
  {
    name: "Create Lookup Table",
    route: "/create-lookup-table",
    fee: "0.003 SOL",
    description: "Create a Lookup Table for further complex transactions.",
    limit: "5K/Hour",
  },
  {
    name: "Extend Lookup Table",
    route: "/extend-lookup-table",
    fee: "0.003 SOL",
    description: "Extend a Lookup Table for further complex transactions",
    limit: "5K/Hour",
  },
  {
    name: "Pump Chart",
    route: "/pump-chart",
    fee: "None",
    description: "Receive formatted OHLC price data.",
    limit: "Unlimited",
  },
  {
    name: "Pump Bonding Curve",
    route: "/pump-bonding-curve",
    fee: "None",
    description: "Get the bonding curve percentage of a token on pump.fun.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Token Bump",
    route: "/pump-token-bump",
    fee: "0.5%",
    description: "Buy & sell a pump.fun token in a single transaction.",
    limit: "20K/hour",
  },
  {
    name: "Pump Single Buy",
    route: "/pump-single-buy",
    fee: "0.5%",
    description: "Buy a pump.fun token on a single wallet.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Single Sell",
    route: "/pump-single-sell",
    fee: "0.5%",
    description: "Sell a pump.fun token on a single wallet.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Multi Buy",
    route: "/pump-multi-buy",
    fee: "0.5%",
    description:
      "Buy a pump.fun token on multiple wallets in a single transaction.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Multi Sell",
    route: "/pump-multi-sell",
    fee: "0.5%",
    description:
      "Sell a pump.fun token on multiple wallets in a single transaction.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Dump All",
    route: "/pump-dump-all",
    fee: "0.5%",
    description:
      "Auto sell a pump.fun token from multiple wallets and collect SOL to a single wallet.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Launch Token",
    route: "/pump-launch-token",
    fee: "0.01 SOL",
    description:
      "Launch a token on pump.fun and prebuy from the developer wallet.",
    limit: "5K/Hour",
  },
  {
    name: "Pump Launch Bundle",
    route: "/pump-launch-bundle",
    fee: "0.1 SOL",
    description:
      "Launch a token on pump.fun and prebuy from up to 20 wallets in a single transaction.",
    limit: "5K/Hour",
  },
  {
    name: "DEX Single Buy",
    route: "/dex-single-buy",
    fee: "0.5%",
    description: "Buy a token that's listed on decentralized exchanges.",
    limit: "5K/Hour",
  },
  {
    name: "DEX Single Sell",
    route: "/dex-single-sell",
    fee: "0.5%",
    description: "Sell a token that's listed on decentralized exchanges.",
    limit: "5K/Hour",
  },
  {
    name: "DEX Paid",
    route: "/dex-paid",
    fee: "None",
    description:
      "Check if a token developer has paid for Dexscreener profile updates.",
    limit: "5K/Hour",
  },
];

const alchemistFeeData = [
  {
    name: "Generate Wallets",
    route: "/generate-wallets",
    fee: "None",
    description: "Generate up to 1000 wallets per request.",
    limit: "Unlimited",
  },
  {
    name: "Fund Wallets",
    route: "/fund-wallets",
    fee: "0.0035 SOL",
    description: "Distribute SOL to max. 50 wallets in a single transaction.",
    limit: "Unlimited",
  },
  {
    name: "Claim Profits",
    route: "/claim-profits",
    fee: "None",
    description: "Securely transfer profits to your PumpAgent Dashboard.",
    limit: "Unlimited",
  },
  {
    name: "Create IPFS",
    route: "/create-ipfs",
    fee: "None",
    description: "Store token metadata on IPFS (I.e, image, description).",
    limit: "Unlimited",
  },
  {
    name: "Pump Token Info",
    route: "/token-info",
    fee: "None",
    description: "Get the image and other metadata for a token.",
    limit: "5K/Hour",
  },
  {
    name: "Create Lookup Table",
    route: "/create-lookup-table",
    fee: "0.0021 SOL",
    description: "Create a Lookup Table for further complex transactions.",
    limit: "Unlimited",
  },
  {
    name: "Extend Lookup Table",
    route: "/extend-lookup-table",
    fee: "0.0021 SOL",
    description: "Extend a Lookup Table for further complex transactions.",
    limit: "Unlimited",
  },
  {
    name: "Pump Chart",
    route: "/pump-chart",
    fee: "None",
    description: "Receive formatted OHLC price data.",
    limit: "Unlimited",
  },
  {
    name: "Pump Bonding Curve",
    route: "/pump-bonding-curve",
    fee: "None",
    description: "Get the bonding curve percentage of a token on pump.fun.",
    limit: "Unlimited",
  },
  {
    name: "Pump Token Bump",
    route: "/pump-token-bump",
    fee: "0.35%",
    description: "Buy & sell a pump.fun token in a single transaction.",
    limit: "Unlimited",
  },
  {
    name: "Pump Single Buy",
    route: "/pump-single-buy",
    fee: "0.35%",
    description: "Buy a pump.fun token on a single wallet.",
    limit: "Unlimited",
  },
  {
    name: "Pump Single Sell",
    route: "/pump-single-sell",
    fee: "0.35%",
    description: "Sell a pump.fun token on a single wallet.",
    limit: "Unlimited",
  },
  {
    name: "Pump Multi Buy",
    route: "/pump-multi-buy",
    fee: "0.35%",
    description:
      "Buy a pump.fun token on multiple wallets in a single transaction.",
    limit: "Unlimited",
  },
  {
    name: "Pump Multi Sell",
    route: "/pump-multi-sell",
    fee: "0.35%",
    description:
      "Sell a pump.fun token on multiple wallets in a single transaction.",
    limit: "Unlimited",
  },
  {
    name: "Pump Dump All",
    route: "/pump-dump-all",
    fee: "0.35%",
    description:
      "Auto sell a pump.fun token from multiple wallets and collect SOL to a single wallet.",
    limit: "Unlimited",
  },
  {
    name: "Pump Launch Token",
    route: "/pump-launch-token",
    fee: "0.007 SOL",
    description:
      "Launch a token on pump.fun and prebuy from the developer wallet.",
    limit: "Unlimited",
  },
  {
    name: "Pump Launch Bundle",
    route: "/pump-launch-bundle",
    fee: "0.07 SOL",
    description:
      "Launch a token on pump.fun and prebuy from up to 20 wallets in a single transaction.",
    limit: "Unlimited",
  },
  {
    name: "DEX Single Buy",
    route: "/dex-single-buy",
    fee: "0.35%",
    description: "Buy a token that's listed on decentralized exchanges.",
    limit: "Unlimited",
  },
  {
    name: "DEX Single Sell",
    route: "/dex-single-sell",
    fee: "0.35%",
    description: "Sell a token that's listed on decentralized exchanges.",
    limit: "Unlimited",
  },
  {
    name: "DEX Paid",
    route: "/dex-paid",
    fee: "None",
    description:
      "Check if a token developer has paid for Dexscreener profile updates.",
    limit: "Unlimited",
  },
];

const Fees = () => {
  const [feeMenu, setFeeMenu] = useState("Alchemist");

  const feeStructure =
    feeMenu === "Apprentice" ? apprenticeFeeData : alchemistFeeData;

  return (
    <article className="pt-0 text-[12px] text-white px-5 md:px-10 lg:px-10 flex-1 w-[97vw] xl:max-w-[950px] lg:mx-auto">
      <Helmet>
        <title>PumpAgent - Fees</title>
        <link rel="canonical" href="https://pumpagent.com/fees" />
        <meta property="og:title" content="PumpAgent - Fees" />
        <meta property="og:url" content="https://pumpagent.com/fees" />
      </Helmet>
      <Pagination />
      <h1 className="text-6xl dark:text-black pb-8">Fees</h1>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Usage of the PumpAgent platform is completely free of charge, sign up for
        an account and start building right away.
      </p>
      <div className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        To support the costs of running our platform — including servers,
        infrastructure, and data providers — we charge standard fees. We're
        committed to transparency, so here’s a clear breakdown of how our fee
        structure works.
      </div>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        We have two tiers:{" "}
        <span className="text-greener font-bold">Apprentice</span> and{" "}
        <span className="text-purple-500 font-bold">Alchemist</span>.<br />
        Apprentice tier is free for life, with slightly increased platform fees
        and reduced request limits. Unlock lifetime access to the Alchemist tier
        from your dashboard with a one-time payment of $199. Enjoy 30% reduced
        platform fees, increased rate limits, priority Discord support, higher
        referrals rewards and more.
      </p>
      <p className="text-[20px] font-light leading-7 mb-8 dark:text-black">
        Optional fees earned through our API's are paid out in SOL. Referral
        payouts are done in USDC.
      </p>
      <p className="text-[20px] leading-7 dark:text-black font-bold text-center">
        Claiming profits from your PumpAgent dashboard is free of charge.
      </p>

      <div className="flex flex-col justify-center items-center gap-3 my-8 border border-gray-900 w-min mx-auto p-3 rounded-xl">
        <span className="text-gray-600">Tiers</span>
        <div className="flex justify-center items-center text-[16px] rounded-l-lg">
          <button
            onClick={() => setFeeMenu("Alchemist")}
            className={`flex p-3 cursor-pointer ${
              feeMenu === "Alchemist" ? "bg-purple-500" : "text-purple-500"
            } rounded-l-lg`}
          >
            Alchemist
          </button>
          <button
            onClick={() => setFeeMenu("Apprentice")}
            className={`flex p-3 cursor-pointer ${
              feeMenu === "Apprentice" ? "bg-[#16ad69]" : "text-greener"
            }  rounded-r-lg`}
          >
            Apprentice
          </button>
        </div>
      </div>

      <div className="border border-gray-800 rounded-lg p-1 mb-10 bg-tile dark:bg-transparent">
        <table className="w-full ">
          <thead className="sticky left-0 top-[68px]">
            <tr
              className={`bg-black dark:bg-transparent text-[9px] md:text-[14px] ${
                feeMenu === "Apprentice" ? "text-greener" : "text-purple-500"
              }`}
            >
              <th className="py-4 text-start pl-3">Name</th>
              <th className="py-4 text-start pl-3">Route</th>
              <th className="py-4 text-start pl-3">Fee</th>
              {/* <th className="py-4 text-start pl-3">Limit</th> */}
              <th className="py-4 text-start pl-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {feeStructure.map((row, i) => {
              const bgColor =
                i % 2 === 0 ? "bg-[#00000026]" : "bg-black dark:bg-transparent";
              return (
                <tr
                  key={row.name}
                  className={`text-white dark:text-black text-[9px] md:text-[14px] ${bgColor}`}
                >
                  <td className="px-3">{row.name}</td>
                  <td className="">{row.route}</td>
                  <td className="px-2">{row.fee}</td>
                  {/* <td className="px-2">{row.limit}</td> */}
                  <td className="p-3 max-w-50">{row.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export default Fees;

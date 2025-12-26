import { useEffect, useState } from "react";
import {
  calculateMarketCap,
  formatMarketcap,
  formatTokens,
  getIPFSUrl,
  smallerTimeAgo,
} from "../../../../../utils/functions";
import { AiFillThunderbolt } from "react-icons/ai";
import Question from "../../../../../assets/Question.webp";
import { FaXTwitter } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { FaGlobeAmericas } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";

const SOL = "So11111111111111111111111111111111111111112";

const KOLTradesFeed = ({
  trackedHolders,
  solPrice,
  kolTrades,
  setCurrentTrade,
}) => {
  const [tokenData, setTokenData] = useState([]);
  const lastTrade = kolTrades[0];

  const loadPumpData = async (data, delay = 300, retries = 0) => {
    const ca = data.mint;
    if (!ca) return;

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      const res = await fetch("https://api.pumpagent.com/pump-token-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ca }),
      });

      const { response } = await res.json();

      if (!response) {
        if (retries < 10) {
          return loadPumpData(ca, 150, retries + 1);
        } else {
          console.warn(`Failed to fetch after 10 retries for ${ca}`);
          return null;
        }
      }

      const finalData = {
        ...response,
        lastTrade,
        uid: crypto.randomUUID(),
      };

      setTokenData((prev) => [finalData, ...prev]);
    } catch (err) {
      if (retries < 10) {
        return loadPumpData(ca, 150, retries + 1);
      } else {
        console.warn(`Failed to fetch after 10 retries for ${ca}`);
      }
    }
  };

  const loadSwapData = async (data, delay = 300, retries = 0) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const ca = data?.base_mint === SOL ? data?.quote_mint : data?.base_mint;
    if (!ca) return;

    try {
      const res = await fetch("https://api.pumpagent.com/asset-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ ca }),
      });

      const response = await res.json();
      if (!response.result.content.links.image) {
        if (retries < 10) {
          return fetchMetadata(300, retries + 1);
        } else {
          console.warn(`Failed to fetch after 10 retries for ${ca}`);
          return null;
        }
      }

      const finalData = {
        ...response,
        pooldata: lastPool,
        lastTrade,
        uid: crypto.randomUUID(),
      };

      setTokenData((prev) => [finalData, ...prev]);
    } catch (err) {
      if (retries < 10) {
        return fetchMetadata(150, retries + 1);
      } else {
        console.warn(`Failed to fetch after 10 retries for ${ca}`);
      }
    }
  };

  useEffect(() => {
    const tradeType = lastTrade?.mint ? "Pump" : "Swap";

    if (tradeType === "Pump") {
      loadPumpData(lastTrade);
    } else {
      loadSwapData(lastTrade);
    }
  }, [lastTrade]);

  return (
    <div className="flex flex-col w-1/3 justify-start items-start pt-2 border-r border-gray-900 bg-black text-white overflow-y-auto">
      <div className="flex px-2 justify-between items-center w-full bg-black pb-2">
        <span className="text-gray-600 text-[10px] font-semibold">
          KOL Trades
        </span>
        <button className="text-gray-700 text-[10px] bg-[#141414] rounded-sm p-1">
          <FaFilter />
        </button>
      </div>
      {tokenData.length > 0 && (
        <ul className="flex-1 w-full max-h-[calc(100vh-105px)] overflow-x-hidden hide-scrollbar px-1 flex flex-col gap-1.25">
          {tokenData.map((token) => {
            // console.log(token);
            const mint = token?.mint;
            const holdersForToken = trackedHolders[mint]?.holders || {};
            const { virtual_sol_reserves, virtual_token_reserves } =
              trackedHolders[mint]?.lastTrade || {};
            const holderCounts = Object.values(holdersForToken);
            const solReserve =
              virtual_sol_reserves || token.virtual_sol_reserves;
            const tokenReserve =
              virtual_token_reserves || token.virtual_token_reserves;

            const above10 = holderCounts.filter((num) => num > 10).length;
            const below10 = holderCounts.filter((num) => num < 10).length;
            return (
              <li
                key={token.uid}
                className="border border-[#121212] bg-[#030303] flex items-stretch justify-start space-x-3 transition cursor-pointer hover:bg-[#090909] p-1 rounded-sm"
                onClick={() => setCurrentTrade(token)}
              >
                <div className="flex flex-col justify-center items-start gap-1">
                  <span className="text-[8px] text-gray-400">
                    {smallerTimeAgo(token.created_timestamp)}
                  </span>
                  <img
                    src={getIPFSUrl(token.image_uri) || Question}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = Question;
                    }}
                    alt={token.name}
                    className="min-w-8 max-w-8 min-h-8 max-h-8 rounded-full object-cover"
                  />
                  <div className="flex pb-0.5 gap-1">
                    {token.twitter && (
                      <span className="bg-[#222] text-[8px] rounded-full">
                        <FaXTwitter className="text-gray-400" />
                      </span>
                    )}
                    {token.telegram && (
                      <span className="bg-[#222] text-[8px] rounded-full">
                        <FaTelegramPlane className="text-gray-400" />
                      </span>
                    )}
                    {token.website && (
                      <span className="bg-[#222] text-[8px] rounded-full">
                        <FaGlobeAmericas className="text-gray-400" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start flex-1 pt-1 relative">
                  <div className="font-semibold text-[10px] uppercase flex">
                    {token.symbol}{" "}
                  </div>
                  <span className="text-gray-500 text-[8px]">
                    {token.name.slice(0, 22)}
                  </span>

                  <span
                    className={` text-greener text-[8px] border-b items-center border-[#111] w-full pb-0.5`}
                  >
                    {token.lastTrade.kol}{" "}
                    <span
                      className={`ml-1 ${
                        token.lastTrade.type === "Buy"
                          ? "text-greener"
                          : "text-red-400"
                      }`}
                    >
                      {token.lastTrade.type === "Buy" ? "+" : "-"}
                      <span>
                        {token.lastTrade.type === "Buy"
                          ? formatTokens(token.lastTrade.tokens_received / 1e6)
                          : formatTokens(token.lastTrade.tokens_sold / 1e6)}
                      </span>
                    </span>
                  </span>

                  <div className="flex gap-1 items-center justify-center flex-1 pt-1 w-full">
                    <span className="text-gray-500 flex justify-center items-center text-[8px] gap-0.25">
                      MC
                      <span className="text-white text-[8px]">
                        {formatMarketcap(
                          calculateMarketCap(
                            solReserve,
                            tokenReserve,
                            solPrice / 1e9
                          )?.toFixed(1) || ""
                        )}
                        K
                      </span>
                    </span>
                    <button className=" text-[10px] p-2 pl-3 bg-[#111] right-0 w-9 h-6 rounded-md flex justify-center items-center border border-[#222] ml-auto cursor-pointer hover:bg-[#222]">
                      <span className="text-[8px]">0</span>
                      <AiFillThunderbolt className="text-purple-500 mt-0.25" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {tokenData.length === 0 && (
        <div className="flex h-full justify-center items-center w-full select-none">
          <span className="text-[12px] text-gray-800">
            Listening For KOL Trades
          </span>
        </div>
      )}
    </div>
  );
};

export default KOLTradesFeed;

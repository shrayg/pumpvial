import { useEffect, useState } from "react";
import {
  calculatePoolMarketCap,
  formatMarketcap,
  getIPFSUrl,
  smallerTimeAgo,
} from "../../../../../utils/functions";
import { AiFillThunderbolt } from "react-icons/ai";
import Question from "../../../../../assets/Question.webp";
import Pump from "../../../../../assets/Pump.png";
import { MdPeopleAlt } from "react-icons/md";
import { FaFilter } from "react-icons/fa";

const SOL = "So11111111111111111111111111111111111111112";

const NewPoolsFeed = ({
  solPrice,
  newPools,
  apiKey,
  trackedPoolTrades,
  migratedMints,
  setCurrentTrade,
}) => {
  const [tokenData, setTokenData] = useState([]);

  const lastPool = newPools[0];
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMetadata = async (delay = 300, retries = 0) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const ca =
        lastPool.base_mint === SOL ? lastPool.quote_mint : lastPool.base_mint;
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
          uid: crypto.randomUUID(),
        };

        setTokenData((prev) => [finalData, ...prev]);
        return { ...response };
      } catch (err) {
        if (retries < 10) {
          return fetchMetadata(150, retries + 1);
        } else {
          console.warn(`Failed to fetch after 10 retries for ${ca}`);
          return null;
        }
      }
    };

    if (lastPool?.pool) {
      fetchMetadata();
    }
  }, [lastPool]);

  return (
    <div className="flex flex-col w-1/3 justify-start items-start pt-2 border-r border-gray-900 bg-black text-white overflow-y-auto">
      <div className="flex px-2 justify-between items-center w-full bg-black pb-2">
        <span className="text-gray-600 text-[10px] font-semibold">
          New Pools
        </span>
        <button className="text-gray-700 text-[10px] bg-[#141414] rounded-sm p-1">
          <FaFilter />
        </button>
      </div>
      {tokenData.length > 0 && (
        <ul className="flex-1 w-full max-h-[calc(100vh-105px)] overflow-x-hidden hide-scrollbar px-1 flex flex-col gap-1.5">
          {tokenData.map((token) => {
            const baseSol = token.pooldata.base_mint === SOL;
            const pool = token.pooldata.pool;
            const baseMint = token.pooldata.base_mint;
            const data = token.result;
            const name = data.content.metadata.name;
            const symbol = data.content.metadata.symbol;
            const image = data.content.links.image;
            const quoteAmount = token.pooldata.pool_quote_amount;
            const baseAmount = token.pooldata.pool_base_amount;
            const initialTokenReserves = baseSol ? quoteAmount : baseAmount;
            const initialSolReserves = baseSol ? baseAmount : quoteAmount;
            const holdersForToken = trackedPoolTrades[pool]?.holders || {};
            const { virtual_sol_reserves, virtual_token_reserves } =
              trackedPoolTrades[pool]?.lastTrade || {};
            const holderCounts = Object.values(holdersForToken);
            // const solReserve = virtual_sol_reserves;
            const solReserve =
              virtual_sol_reserves ||
              (baseSol ? initialSolReserves : initialTokenReserves);
            // const tokenReserve = virtual_token_reserves;
            const tokenReserve =
              virtual_token_reserves ||
              (baseSol ? initialTokenReserves : initialSolReserves);
            const canonical = migratedMints.find((token) => token === baseMint);
            const above10 = holderCounts.filter((num) => num > 10).length;

            return (
              <li
                key={token.uid}
                className={`border  ${
                  canonical ? "border-green-800" : "border-[#121212]"
                } bg-[#030303] flex items-stretch justify-start space-x-3 transition cursor-pointer hover:bg-[#090909] p-1 rounded-sm`}
                onClick={() => setCurrentTrade(token)}
              >
                <div className="flex flex-col justify-center items-center gap-1 max-w-10 relative">
                  {canonical && (
                    <span className="text-greener text-[10px] absolute top-[6px] left-[-2px] bg-[#00a61e82] p-0.25 px-0.5 flex justify-center items-center rounded-full cursor-info pointer-events-auto z-10">
                      <img src={Pump} alt="Pump" className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <img
                    src={getIPFSUrl(image) || Question}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = Question;
                    }}
                    alt={name}
                    className="min-w-8 max-w-8 min-h-8 max-h-8 rounded-full object-cover"
                  />
                  <span className="text-[8px] text-gray-400 absolute top-0.25 z-10 left-0">
                    {smallerTimeAgo(token.pooldata.timestamp)}
                  </span>
                </div>

                <div className="flex flex-col items-start flex-1 pt-1 relative">
                  <div className="font-semibold text-[10px] uppercase flex">
                    {symbol}
                  </div>
                  <span className="text-gray-500 text-[8px]">
                    {name.slice(0, 22)}
                  </span>
                  <div className="flex border-b items-center border-[#111] w-full pb-0.5 gap-1"></div>
                  <div className="flex gap-1 items-center justify-center flex-1 pt-1 w-full">
                    <span className="text-white flex justify-center items-center text-[8px] gap-0.25">
                      <MdPeopleAlt className="text-gray-500" />
                      <span className="text-white text-[8px]">{above10}</span>
                    </span>
                    <span className="text-gray-500 flex justify-center items-center text-[8px] gap-0.25">
                      MC
                      <span className="text-white text-[8px] pl-0.25">
                        {/* {Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          notation: "compact",
                          maximumFractionDigits: 2,
                        }).format(
                          calculatePoolMarketCap(
                            solReserve,
                            tokenReserve,
                            solPrice / 1e9,
                            token.result.token_info.supply,
                            token.result.token_info.decimals
                          ) * 1000
                        ) || ""} */}
                        {tokenReserve &&
                          solReserve &&
                          formatMarketcap(
                            (
                              calculatePoolMarketCap(
                                tokenReserve,
                                solReserve,
                                solPrice / 1e9,
                                token.result.token_info.supply,
                                token.result.token_info.decimals
                              ) / 1000
                            ).toFixed(2)
                          )}
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
        <div className="flex h-full justify-center items-center w-full">
          <span className="text-[12px] text-gray-800 select-none">
            Listening For New Pools
          </span>
        </div>
      )}
    </div>
  );
};

export default NewPoolsFeed;

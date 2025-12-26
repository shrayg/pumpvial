import { useEffect, useState } from "react";
import {
  calculateMarketCap,
  getIPFSUrl,
  smallerTimeAgo,
} from "../../../../../utils/functions";
import { AiFillThunderbolt } from "react-icons/ai";
import Question from "../../../../../assets/Question.webp";
import { MdPeopleAlt } from "react-icons/md";
import { FaXTwitter } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { FaGlobeAmericas } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";

const NewCreationsFeed = ({
  newTokenMints,
  trackedHolders,
  solPrice,
  setCurrentTrade,
}) => {
  const [tokenData, setTokenData] = useState([]);
  const lastMint = newTokenMints[0];
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMetadata = async (mint, delay = 300, retries = 0) => {
      const ca = mint || lastMint?.mint;
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
            return fetchMetadata(ca, 150, retries + 1);
          } else {
            console.warn(`Failed to fetch after 10 retries for ${ca}`);
            return null;
          }
        }

        response.uid = crypto.randomUUID();
        setTokenData((prev) => [response, ...prev]);
        return { ...response };
      } catch (err) {
        if (retries < 10) {
          return fetchMetadata(ca, 150, retries + 1);
        } else {
          console.warn(`Failed to fetch after 10 retries for ${ca}`);
          return null;
        }
      }
    };

    if (lastMint?.mint) {
      fetchMetadata(lastMint.mint);
    }
  }, [lastMint]);

  return (
    <div className="flex flex-col w-1/3 justify-start items-start pt-2 border-r border-gray-900 bg-black text-white overflow-y-auto">
      <div className="flex px-2 justify-between items-center w-full bg-black pb-2">
        <span className="text-gray-600 text-[10px] font-semibold">
          New Mints
        </span>
        <button className="text-gray-700 text-[10px] bg-[#141414] rounded-sm p-1">
          <FaFilter />
        </button>
      </div>
      {tokenData.length > 0 && (
        <ul className="flex-1 w-full max-h-[calc(100vh-105px)] overflow-x-hidden hide-scrollbar px-1 flex flex-col gap-1.5">
          {tokenData.map((token) => {
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
                className="border border-[#121212] bg-[#030303] flex items-stretch justify-start space-x-3 transition cursor-pointer hover:bg-[#090909] p-1 px-1.5 rounded-sm"
                onClick={() => setCurrentTrade(token)}
              >
                <div className="flex flex-col justify-center items-start gap-1  relative">
                  <span className="text-[8px] text-gray-400  top-0.25 z-10 left-0">
                    {smallerTimeAgo(token.created_timestamp)}
                  </span>
                  <img
                    src={getIPFSUrl(token.image_uri)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = Question;
                    }}
                    alt={token.name}
                    className="min-w-8 max-w-8 min-h-8 max-h-8 rounded-full object-cover"
                  />

                  <div className="flex w-full pb-0.5 gap-1">
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

                  <div className="flex gap-1 items-center justify-center flex-1 pt-1 w-full  border-t border-[#111] ">
                    <span className="text-white flex justify-center items-center text-[8px] gap-0.25">
                      <MdPeopleAlt className="text-gray-500" />
                      <span className="text-white text-[8px]">{above10}</span>
                    </span>
                    <span className="text-gray-500 flex justify-center items-center text-[8px] gap-0.25">
                      MC
                      <span className="text-white text-[8px] pl-0.25">
                        {calculateMarketCap(
                          solReserve,
                          tokenReserve,
                          solPrice / 1e9
                        )?.toFixed(1)}
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
        <div className="flex h-full justify-center items-center w-full">
          <span className="text-[12px] text-gray-800 select-none">
            Listening For New Mints
          </span>
        </div>
      )}
    </div>
  );
};

export default NewCreationsFeed;

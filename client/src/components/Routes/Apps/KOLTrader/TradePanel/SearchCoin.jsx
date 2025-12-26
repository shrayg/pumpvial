import { useState, useEffect } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import {
  formatMarketcap,
  getMintAddressesFromPool,
} from "../../../../../utils/functions";
import { FaDollarSign } from "react-icons/fa";
import Spinner from "../../../../../assets/Spinner.svg";

const SearchCoin = ({
  searchOpen,
  setSearchOpen,
  trackedPoolsRef,
  poolSocketRef,
  setCharts,
  setView,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debounce logic
  useEffect(() => {
    if (!searchValue) {
      setTokenInfo(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchToken();
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce); // clear previous timeout
  }, [searchValue]);

  const searchToken = async () => {
    try {
      setLoading(true);
      const request = await fetch("https://api.pumpagent.com/pump-token-info", {
        method: "POST",
        body: JSON.stringify({ ca: searchValue }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await request.json();
      setTokenInfo(response?.response);
      console.log(response);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setToken = async () => {
    const newChart = {
      mint: tokenInfo.mint,
    };

    const chartToOpen = { ...newChart };
    if (!chartToOpen.mint) {
      chartToOpen.mint = await getMintAddressesFromPool(newChart.pool);
    }

    if (chartToOpen.mint) {
      trackedPoolsRef.current[chartToOpen.mint] = chartToOpen.pool;
      poolSocketRef.current.emit(
        "updatePools",
        Object.values(trackedPoolsRef.current)
      );
    }
    if (!chartToOpen.mint) return;

    setCharts((prev) => {
      // Skip if chart already exists
      if (prev.some((chart) => chart?.mint === newChart.mint)) return prev;

      // Find the first null index
      const nullIndex = prev.findIndex((chart) => chart === null);

      const updated = [...prev];

      if (nullIndex !== -1) {
        // If there's a null slot, fill it
        updated[nullIndex] = newChart;
      } else if (updated.length === 4) {
        // If all 4 slots are filled, replace the last one
        updated[3] = newChart;
      } else {
        // If less than 4 and no nulls, just add the chart
        updated.push(newChart);
      }

      return updated;
    });
    setView("Charts");
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <div
      className={`flex flex-col min-h-[36px] border-b border-gray-800 ${
        searchOpen ? "w-full" : "w-1/2"
      }`}
    >
      {!searchOpen && (
        <div
          className="h-full flex justify-end items-center hover:bg-[#14141469] pr-4 group cursor-pointer"
          onClick={() => setSearchOpen(true)}
        >
          <FaMagnifyingGlass className="text-[16px] text-gray-700 group-hover:text-gray-400" />
        </div>
      )}
      {searchOpen && (
        <div className="flex flex-col h-full flex-1">
          <div
            className="flex h-full justify-center items-center bg-[#14141469] hover:bg-[#14141469] text-gray-700 hover:text-gray-400 cursor-pointer max-h-[36px] "
            onClick={() => setSearchOpen(false)}
          >
            <span className="text-[12px] select-none">Close</span>
          </div>
          <div className="flex w-full flex-1 flex-col justify-start items-center pb-20">
            <div className="flex flex-col h-1/2 w-full justify-end items-center">
              <span className="text-gray-500 text-[12px]">
                Search for pump.fun tokens
              </span>
              <input
                type="text"
                placeholder="Enter pump contract address"
                className="w-4/5 text-[12px] p-2 rounded-md mt-2 border border-gray-800 placeholder:text-gray-700 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] text-white"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            {!tokenInfo && loading && (
              <img src={Spinner} alt="Spinner" className="mt-4" />
            )}
            {tokenInfo && !loading && (
              <div
                className="flex mt-4 w-4/5 p-1.5 cursor-pointer border border-[#1f1f1f] rounded-md  hover:border hover:border-[#79ff6d4b]"
                onClick={setToken}
              >
                <div className="flex">
                  <img
                    src={tokenInfo.image_uri}
                    alt={tokenInfo.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex flex-col justify-center text-[14px] text-gray-700 pl-2 break-all">
                    <span className="text-gray-500">{tokenInfo.name}</span>
                    <span>{tokenInfo.symbol}</span>
                  </div>
                </div>
                <div className="flex flex-col ml-auto justify-center gap-1">
                  <span className="text-greener text-[12px] flex items-center gap-0.25 ml-auto">
                    <FaDollarSign />
                    {formatMarketcap(tokenInfo.usd_market_cap)}
                  </span>
                  <span className="text-gray-700 text-[12px]">
                    Replies {tokenInfo.reply_count}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchCoin;

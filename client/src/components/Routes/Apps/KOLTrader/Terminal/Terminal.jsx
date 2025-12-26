import { FaLongArrowAltUp } from "react-icons/fa";
import { FaLongArrowAltDown } from "react-icons/fa";
import SOL from "../../../../../assets/SOL.png";
import Spinner from "../../../../../assets/Spinner.svg";
import Pump from "../../../../../assets/Pump.png";
import {
  calculateMarketcap,
  formatMarketcap,
  formatTokens,
  getIPFSUrl,
  getMintAddressesFromPool,
  smallTimeAgo,
} from "../../../../../utils/functions";
import { useEffect, useState, useRef, useContext } from "react";
import { BsLightningChargeFill } from "react-icons/bs";
import { FaRegCopy } from "react-icons/fa6";
import { AuthContext } from "../../../../../utils/AuthProvider";
const processedMints = new Set();

const Terminal = ({
  kolTrades,
  setCharts,
  setView,
  overlay,
  charts,
  traderWallet,
  apiKey,
  setOpenPositions,
  setKolTrades,
  solPrice,
  poolSocketRef,
  trackedPoolsRef,
  trackedPoolTrades,
  tokenInfo,
  setTokenInfo,
}) => {
  const { user } = useContext(AuthContext);
  const containerRef = useRef(null);
  const [height, setHeight] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [buying, setBuying] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const queueRef = useRef([]);
  const processingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Copy CA
  const handleCopy = (mint, index) => {
    navigator.clipboard.writeText(mint);
    setCopied(index);
    setTimeout(() => setCopied(null), 150);
  };

  // Show message if KOL trades take long to appear
  useEffect(() => {
    // If there are no KOL trades, start a 2 minute timer
    if (kolTrades.length === 0) {
      setShowTimeoutMessage(false); // reset on new data change
      const timeout = setTimeout(
        () => setShowTimeoutMessage(true),
        4 * 60 * 1000
      ); // 4 minutes in ms

      return () => clearTimeout(timeout); // clear on unmount or on kolTrades change
    } else {
      // If we have trades, hide the timeout message
      setShowTimeoutMessage(false);
    }
  }, [kolTrades]);

  // Calculate container height - bottom settings bar
  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.clientHeight - 40);
    }
  }, []);

  // Open new chart to dashboard
  const openChart = async (newChart) => {
    try {
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
        if (prev.some((chart) => chart?.mint === chartToOpen.mint)) return prev;

        // Find the first null index
        const nullIndex = prev.findIndex((chart) => chart === null);
        // If a null slot exists, replace it
        if (nullIndex !== -1) {
          const updated = [...prev];
          updated[nullIndex] = chartToOpen;
          return updated;
        } else {
          const updated = [...prev];
          updated[3] = chartToOpen;
          return updated;
        }
      });
      setView("Charts");
    } catch (err) {
      console.error(err);
    }
  };

  // Auto open new chart is opted for
  useEffect(() => {
    // Return if there are no kol trades
    if (!kolTrades.length) return;
    const terminalSettings = localStorage.getItem("terminalSettings");
    // Exit is no localstorage is found
    if (!terminalSettings) return;
    const { autoOpen, autoSwitch } = JSON.parse(terminalSettings);
    // Destructure settings
    if (!autoOpen) return;

    const lastTrade = kolTrades[0];
    // Don't open when menu is open
    if (overlay) return;

    // Only open new Buy trades
    if (lastTrade.type === "Sell" || charts.every((item) => item !== null))
      return;
    openChart(lastTrade);
    if (!autoSwitch) return;

    setView("Charts");
  }, [kolTrades]);

  const handleSnipe = async (token) => {
    setBuying(token.timestamp);
    const solIn = +localStorage.getItem("quickBuyAmountTerminal");
    if (!solIn) return setBuying(null);

    const ca = token.mint;
    const swapSetting = JSON.parse(localStorage.getItem("swapSettings"));
    const retryEnabled = swapSetting.autoRetry;
    const retryDelay = 1000; // 1 second
    const startTime = performance.now();

    const migrated = trackedPoolTrades[ca];

    const buyUrl = migrated
      ? "https://api.pumpagent.com/koltrader-dex-buy"
      : "https://api.pumpagent.com/koltrader-buy";

    const attemptBuy = async () => {
      const request = await fetch(buyUrl, {
        method: "POST",
        body: JSON.stringify({
          ca,
          solIn,
          prioFee: swapSetting.prioFee,
          recipient: traderWallet,
          slippage: swapSetting.slippage,
          coinData: token,
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });

      const response = await request.json();
      if (!response.txResult.tokens) throw new Error("No tokens received");
      return response;
    };

    try {
      let response;
      const maxRetries = retryEnabled ? 2 : 0; // 2 retries = 3 total attempts
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          response = await attemptBuy();
          break; // success
        } catch (err) {
          console.error(`Buy attempt ${attempt + 1} failed:`, err);
          if (!retryEnabled || attempt === maxRetries) throw err;
          attempt++;
          await new Promise((res) => setTimeout(res, retryDelay));
        }
      }

      setOpenPositions(response.remainingTrades);

      const userKolEntry = {
        mint: ca,
        type: "Buy",
        timestamp: Math.floor(Date.now() / 1000),
        marketcap: calculateMarketcap(
          response.txResult.virtual_sol_reserves,
          response.txResult.virtual_token_reserves,
          solPrice
        ),
        virtual_sol_reserves: response.txResult.virtual_sol_reserves,
        virtual_token_reserves: response.txResult.virtual_token_reserves,
        sol_buy: Number(solIn),
        tokens_received: response.txResult.tokens,
        kol: user,
        kol_twitter: "",
      };

      setKolTrades((prev) => [userKolEntry, ...prev]);
      openChart(token);
    } catch (err) {
      console.error("All buy attempts failed.");
    } finally {
      setBuying(null);
    }
  };

  const processQueue = async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const trade = queueRef.current.shift();
        let mint = trade.mint;

        if (processedMints.has(mint) || tokenInfo[mint]) continue;

        if (!mint) mint = await getMintAddressesFromPool(trade?.pool);
        if (!mint) continue;

        try {
          const res = await fetch("https://api.pumpagent.com/pump-token-info", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({ ca: mint }),
          });

          const data = await res.json();
          const response = data.response;
          if (!response) return;
          if (typeof response !== "object" || response === null) {
            console.warn(`Invalid response for mint ${mint}`, data);
            continue;
          }

          response.pool = trade?.pool;
          response.mint = mint;

          setTokenInfo((prev) => ({
            ...prev,
            [mint]: response,
          }));

          processedMints.add(mint);
        } catch (err) {
          console.error(`Error fetching token info for ${mint}`, err);
        }
      }
    } finally {
      processingRef.current = false;
    }
  };

  useEffect(() => {
    if (!kolTrades.length) return;

    // Step 1: Deduplicate based on mint/pool
    const seen = new Set();
    const dedupedMints = kolTrades
      .map((trade) => trade.mint || trade.pool)
      .filter((mint) => {
        if (seen.has(mint)) return false;
        seen.add(mint);
        return true;
      });

    // Step 2: Filter only those not already processed or in queue
    const uniqueNewMints = dedupedMints.filter(
      (mint) =>
        !processedMints.has(mint) &&
        !queueRef.current.some((t) => t.mint === mint)
    );

    if (uniqueNewMints.length) {
      const newTrades = kolTrades.filter((t) =>
        uniqueNewMints.includes(t.mint || t.pool)
      );
      queueRef.current.push(...newTrades);
      processQueue();
    }
  }, [kolTrades]);

  function progress(reserves) {
    if (!reserves) return;

    const initialRealTokenReserves = 793100000000000n;
    const currentReserves = BigInt(reserves);
    const tokensSold = initialRealTokenReserves - currentReserves;

    // Calculate current percentage (how much remains from the initial supply)
    const currentPercentage =
      (currentReserves * 10000n) / initialRealTokenReserves; // *10000 for 2 decimals
    return Number(currentPercentage) / 100;
  }

  return (
    <div
      className={`overflow-auto h-full w-full relative`}
      ref={containerRef}
      style={{ height: `${height}px` }}
    >
      {kolTrades.length > 0 && (
        <table className="w-full text-[14px] text-left text-gray-300">
          <thead className=" text-gray-200 sticky top-0 z-10 rounded-xl border-b border-gray-900">
            <tr className="text-gray-600">
              <th className="px-4 py-2 bg-black rounded-md font-[400]">KOL</th>
              <th className="px-4 py-2 bg-black text-center rounded-md font-[400]">
                Trade
              </th>
              <th className="px-4 py-2 bg-black rounded-md font-[400]">
                Amount
              </th>
              <th className="px-4 py-2 bg-black rounded-md font-[400]">
                Token
              </th>
              <th className="px-4 py-2 bg-black rounded-md font-[400]">MC</th>
              <th className="px-4 py-2 bg-black rounded-md font-[400]">
                Market
              </th>
              <th className="px-4 py-2 bg-black rounded-md font-[400]">Time</th>
              <th className="px-4 py-2 bg-black text-center rounded-md font-[400]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {kolTrades.map((trade, index) => {
              const marketCap =
                calculateMarketcap(
                  trade.virtual_sol_reserves,
                  trade.virtual_token_reserves,
                  solPrice
                ) || trade.marketCap;

              const identifyer = trade?.mint || trade?.pool;
              const tokenData = Object.entries(tokenInfo).find(
                ([key, value]) =>
                  value.mint === identifyer || value.pool === identifyer
              )?.[1];
              const migrated =
                tokenData?.complete ||
                tokenData?.pump_swap_pool ||
                tokenData?.pool ||
                trackedPoolTrades[identifyer];
              const curve = progress(trade?.real_token_reserves);

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-900 hover:bg-[#2121216d] cursor-pointer`}
                  onClick={() => openChart(trade)}
                >
                  <td className="px-1 pl-1 py-1">
                    <a
                      href={trade.kol_twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 z-10 rounded-b-md text-start break-words leading-3 mt-0.5"
                    >
                      <div className="flex gap-2 items-center justify-start relative h-full cursor-pointer border-1 border-transparent rounded-md hover:border-[#6dff5a53] pl-2 p-1">
                        <img
                          src={`https://unavatar.io/x/${
                            trade?.kol_twitter.split("/")[3]
                          }`}
                          className="w-[28px] h-[28px] rounded-md"
                        />
                        <span className="break-words text-[12px]">
                          {/* {trade?.kol_twitter.split("/").filter(Boolean).pop()} */}
                          {trade?.kol}
                        </span>
                      </div>
                    </a>
                  </td>
                  <td
                    className={`px-2 py-2 ${
                      trade?.type === "Buy" ? "text-greener" : "text-red-500"
                    } ${copied === index ? "bg-[#33ff0017] rounded-md" : ""}`}
                  >
                    <div
                      className={`flex flex-col cursor-pointer select-none text-[12px] `}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(trade.mint || trade.pool, index);
                      }}
                    >
                      <span className="flex pr-3 justify-center items-center group">
                        {trade.type === "Buy" && (
                          <FaLongArrowAltUp className="" />
                        )}
                        {trade.type === "Sell" && (
                          <FaLongArrowAltDown className="" />
                        )}
                        {trade.type}
                        <FaRegCopy
                          className={`ml-1 text-[12px] ease-in-out ${
                            copied === index ? "text-greener" : "text-gray-500"
                          }`}
                        />
                      </span>
                      <span className="text-[10px] flex justify-center items-center gap-1 w-full pr-3">
                        {trade.mint && (
                          <>
                            {trade.mint.slice(0, 4) +
                              "..." +
                              trade.mint.slice(trade.mint.length - 4)}
                          </>
                        )}
                        {trade.pool && (
                          <>
                            {trade.pool.slice(0, 4) +
                              "..." +
                              trade.pool.slice(trade.pool.length - 4)}
                          </>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex gap-0.5 justify-start items-center text-[12px]">
                      <img src={SOL} alt="Solana" className="w-4 h-4" />
                      {trade.type === "Buy"
                        ? (trade.sol_buy / 1e9).toFixed(2)
                        : (trade.sol_received / 1e9).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-0.5">
                      <div className="flex items-center gap-1 mr-0.5 min-w-[24px] min-h-[24px]">
                        {tokenData && (
                          <img
                            src={getIPFSUrl(tokenData.image_uri)}
                            alt={tokenData.symbol}
                            className="w-6 h-6 rounded-md object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px]">
                          {tokenData && <span>{tokenData.symbol}</span>}
                        </span>
                        <span className="text-[12px] text-gray-500">
                          {trade.type === "Buy"
                            ? formatTokens(
                                Math.floor(trade.tokens_received / 1e6)
                              )
                            : formatTokens(Math.floor(trade.tokens_sold / 1e6))}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <span className="flex gap-0.5 justify-start items-center text-[12px]">
                      ${formatMarketcap(Math.floor(marketCap))}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex gap-0.5 justify-start items-center text-[12px] text-gray-600">
                      {migrated && (
                        <>
                          <img src={Pump} alt="Pump" className="w-3.5 h-3.5" />
                          AMM
                        </>
                      )}
                    </span>
                    <span className="flex gap-0.5 justify-start text-[12px] flex-col">
                      {!migrated && (
                        <>
                          <span className="pl-2 text-gray-600">Curve</span>
                          <div className="w-12 h-2 bg-[#333] rounded-full p-0.25">
                            <div
                              className={` h-full buycta rounded-full`}
                              style={{
                                width: `${100 - curve}%`,
                              }}
                            ></div>
                          </div>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[12px]">
                    {smallTimeAgo(trade.timestamp)}
                  </td>
                  <td className="px-4 max-w-[140px]">
                    <div className="flex gap-2 justify-center items-center h-[35px]">
                      <button
                        className={`flex gap-1 justify-center items-center border border-gray-600 rounded-lg p-1 px-0 text-black cursor-pointer flex-1 h-full leading-3 text-[12px] ${
                          buying === trade.timestamp
                            ? "gradbtn"
                            : " bg-green-400  hover:bg-green-300"
                        }`}
                        onClick={() => handleSnipe(trade)}
                        disabled={buying === trade.timestamp ? true : false}
                      >
                        <BsLightningChargeFill />
                        <span>BUY</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {kolTrades.length === 0 && (
        <div className="flex justify-center items-center h-full gap-2 flex-col select-none">
          <span className="flex gap-2">
            <img src={Spinner} alt="Spinner" className="opacity-30" />
            <span className="text-gray-800 text-base select-none">
              Listening for KOL trades
            </span>
          </span>
          {showTimeoutMessage && (
            <span className="text-gray-500 text-[10px] select-none">
              Low KOL activity. Hang in there.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;

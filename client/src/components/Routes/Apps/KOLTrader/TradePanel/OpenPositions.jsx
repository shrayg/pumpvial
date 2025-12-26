import ContentLoader from "react-content-loader";
import { FaInbox } from "react-icons/fa";
import SOL from "../../../../../assets/SOL.png";
import { FaRegCopy } from "react-icons/fa6";
import {
  copy,
  formatTokens,
  getPumpPoolPdaString,
  getSolBalanceDifference,
} from "../../../../../utils/functions";
import { createSocket } from "../createSocket";
import { useCallback, useContext, useEffect, useRef } from "react";
import { VscGraphLine } from "react-icons/vsc";
import { useState } from "react";
import { AuthContext } from "../../../../../utils/AuthProvider";

const calculateSolReceivedForSell = ({ tokenReserves, solReserves }) =>
  Number(solReserves) / 1e9 / (Number(tokenReserves) / 10 ** 6);

const OpenPositions = ({
  openPositions,
  setOpenPositions,
  setCharts,
  setView,
  traderWallet,
  apiKey,
  setKolTrades,
  setSolBalance,
  solBalance,
  trackedPoolsRef,
  trackedPoolTrades,
  solPrice,
  poolSocketRef,
}) => {
  const [closing, setClosing] = useState("");
  const solBalanceRef = useRef();
  const { user } = useContext(AuthContext);

  // Track trades for open positions
  useEffect(() => {
    if (!openPositions || !openPositions.length) return;

    const mints = openPositions.map((ca) => ca.mint);
    const socket = createSocket({ mints });

    socket.on("tokenTrades", handleTokenTrades);

    return () => {
      socket.off("tokenTrades", handleTokenTrades);
      socket.disconnect();
    };
  }, [openPositions]);

  useEffect(() => {
    solBalanceRef.current = solBalance;
  }, [solBalance]);

  // Load open positions
  useEffect(() => {
    if (!user || !traderWallet) return;
    const loader = async () => {
      try {
        // Get held balances from the chain
        const request = await fetch(
          "https://api.pumpagent.com/load-openpositions",

          {
            method: "POST",
            body: JSON.stringify({ wallet: traderWallet }),
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
          }
        );

        const response = await request.json();
        const clean = response.filter(Boolean);
        clean.forEach((trade) => {
          trackedPoolsRef.current[trade.mint] = getPumpPoolPdaString(
            trade.mint
          );
        });
        poolSocketRef.current.emit(
          "updatePools",
          Object.values(trackedPoolsRef.current)
        );
        setOpenPositions(clean);
      } catch (err) {
        console.error(err);
      }
    };
    loader();
  }, [user, traderWallet]);

  const handleTokenTrades = useCallback(
    (payload, poolMint) => {
      const mint = payload.mint || poolMint;
      const solReserves = parseFloat(payload.virtual_sol_reserves);
      const tokenReserves = parseFloat(payload.virtual_token_reserves);

      const tokenPrice = calculateSolReceivedForSell({
        tokenReserves,
        solReserves,
      });
      setOpenPositions((prevPositions) =>
        prevPositions.map((pos) => {
          if (pos.mint === mint) {
            const solReceived = tokenPrice * (pos.tokens / 1e6);

            if (pos.position !== "N/A") {
              return {
                ...pos,
                pnl: Number(solReceived - Number(pos.position)),
              };
            } else {
              return {
                ...pos,
                worth: solReceived,
              };
            }
          }
          return pos;
        })
      );
    },
    [setOpenPositions]
  );

  useEffect(() => {
    if (!trackedPoolTrades || !Object.keys(trackedPoolTrades).length) return;
    Object.entries(trackedPoolTrades).forEach(([mint, data]) => {
      if (data?.lastTrade) {
        handleTokenTrades(data.lastTrade, mint);
      }
    });
  }, [trackedPoolTrades, handleTokenTrades]);

  // Open chart in UI
  const openChart = async (position) => {
    const newChart = {
      mint: position.mint,
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
  };

  const handleClosePosition = async (toClose) => {
    const ca = toClose.mint;
    const recipient = traderWallet;
    const tokenAmount = toClose.tokens;
    const entryTimestamp = toClose.timestamp;
    setClosing(ca);
    const swapSetting = JSON.parse(localStorage.getItem("swapSettings"));
    const retryEnabled = swapSetting.autoRetry;
    const jitoTip = Math.floor(Number(swapSetting.jitoTip) * 1e9);
    const migrated = trackedPoolTrades[ca] || toClose.migrated;

    const sellUrl = migrated
      ? "https://api.pumpagent.com/koltrader-dex-sell"
      : "https://api.pumpagent.com/koltrader-sell";

    let attempt = 0;
    const maxRetries = retryEnabled ? 2 : 0;

    while (attempt <= maxRetries) {
      try {
        const start = performance.now(); // measure time start

        const request = await fetch(sellUrl, {
          method: "POST",
          body: JSON.stringify({
            ca,
            recipient,
            tokenAmount,
            prioFee: swapSetting.prioFee,
            coinData: toClose,
            solPrice,
            jitoTip,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        const response = await request.json();
        console.log(response);
        if (!response.txResult?.mint) {
          throw new Error("Invalid sell response");
        }

        setOpenPositions(response.remainingTrades);
        response.txResult.kol = user;
        response.txResult.kol_twitter = "";
        response.txResult.timestamp = response.txResult.timestamp / 1000;

        setKolTrades((prev) => [response.txResult, ...prev]);
        setClosing("");

        const solSpend = await getSolBalanceDifference(
          response.txResult.txid,
          traderWallet
        );

        setSolBalance((prev) => prev + solSpend);

        return; // Exit after successful sell
      } catch (err) {
        console.error(`Attempt ${attempt + 1} failed:`, err);
        setClosing("");
        if (attempt === maxRetries) {
          console.error("Sell failed after 3 attempts");
        }
      }
      attempt++;
    }
  };

  return (
    <div className="flex justify-start items-start h-full text-[14px] text-gray-700 gap-1 pb-2 max-h-[309px]">
      {!openPositions.length && (
        <div className="flex justify-center items-center gap-1 w-full h-full select-none">
          <FaInbox />
          <span>No Open Positions</span>
        </div>
      )}
      {openPositions.length > 0 && (
        <div className="h-[300px] w-full  overflow-auto">
          <span className="text-gray-700 text-center text-[12px] w-full block pb-2 sticky top-0 bg-black z-5000 pt-2">
            Positions
          </span>
          <ul className="flex flex-col justify-start items-center w-full h-full pt-0 p-2 gap-2">
            {openPositions.map((position, i) => (
              <li
                key={i}
                className="flex justify-start w-full bg-[#3333336c] p-2 rounded-md"
              >
                <button
                  className="border-gray-800 p-2 border rounded-md mr-2 cursor-pointer group hover:border-gray-700 transition ease-in-out w-17 flex justify-center items-center"
                  onClick={() => openChart(position)}
                >
                  <VscGraphLine className="text-gray-500 group-hover:text-white transition ease-in-out" />
                </button>

                <div className="flex flex-col select-none">
                  <div className="flex justify-center items-center gap-1">
                    <img
                      src={position.image}
                      alt="SOL"
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-white text-[12px] w-12 word-break">
                      {position.symbol}
                    </span>
                  </div>
                  <span
                    className="group text-gray-600 text-[10px] flex justify-start items-center gap-1 pt-1 cursor-pointer"
                    onClick={() => copy(position.mint)}
                  >
                    <FaRegCopy className="text-gray-500 group-active:text-greener" />
                    <span className="group-active:underline group-active:text-greener">
                      {position.mint.slice(0, 8) + "..."}
                    </span>
                  </span>
                </div>

                <div className="w-full flex justify-evenly items-center pb-0.5">
                  <div className="flex flex-col justify-start items-center h-full">
                    <span className="text-gray-600 text-[12px] pb-1">Size</span>
                    <div className="flex justify-center items-center">
                      <span className="text-white text-[12px]">
                        {formatTokens(Math.floor(position.tokens / 1e6))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-start items-center gap-0.5 h-full">
                    <span className="text-gray-600 text-[12px] pb-0.5">
                      {position.position === "N/A" ? "Worth" : "PnL"}
                    </span>
                    <div className="flex justify-center items-center gap-0.5">
                      {(position.worth || position?.position !== "N/A") && (
                        <img
                          src={SOL}
                          alt="SOL"
                          className="w-4 h-4 rounded-full"
                        />
                      )}

                      <span
                        className={`text-[12px] ${
                          position?.pnl >= 0 ? "text-greener" : "text-red-500"
                        }`}
                      >
                        {position?.pnl >= 0 && position?.position !== "N/A"
                          ? "+"
                          : ""}

                        {position?.position !== "N/A"
                          ? position?.pnl?.toFixed(3)
                          : ""}

                        {position?.position === "N/A" && (
                          <>
                            {position.worth && (
                              <span>{position.worth.toFixed(3)}</span>
                            )}
                            {!position.worth && (
                              <span className="mt-2 w-12 flex">
                                <ContentLoader
                                  speed={2}
                                  width={75}
                                  height={10}
                                  viewBox="0 0 100 20"
                                  backgroundColor="#404040"
                                  foregroundColor="#ecebeb"
                                >
                                  <rect
                                    x="0"
                                    y="0"
                                    rx="3"
                                    ry="3"
                                    width="100"
                                    height="5"
                                  />
                                </ContentLoader>
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className={`flex  text-white justify-center items-center px-2 rounded-md ml-auto cursor-pointer opacity-60 hover:opacity-100 hover:bg-red-600 min-w-[47px] max-w-[47px] ${
                    closing === position.mint
                      ? "gradbtn text-[10px]"
                      : "bg-red-900 text-[12px]"
                  }`}
                  onClick={() => handleClosePosition(position)}
                  disabled={closing === position.mint ? true : false}
                >
                  {closing !== position.mint ? "Close" : "Closing"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OpenPositions;

import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { FaRegCopy } from "react-icons/fa6";
import {
  getIPFSUrl,
  getPumpPoolPdaString,
} from "../../../../../utils/functions";
import { createChart } from "lightweight-charts";
import { createSocket } from "../createSocket";
import Question from "../../../../../assets/Question.webp";
import Pill from "../../../../../assets/Pump.png";

const Chart = ({ currentTrade, apiKey, solPrice }) => {
  const chartContainerRef = useRef(null);
  const chartWrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const seriesRef = useRef(null);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);
  const [candles, setCandles] = useState([]);
  const [trades, setTrades] = useState({});
  const chartSocketRef = useRef(null);
  const [curveProgress, setCurveProgress] = useState(0);

  // Add flag to track if we've started receiving real-time trades
  const hasRealTimeTradesRef = useRef(false);

  // console.log(currentTrade);

  useEffect(() => {
    const currentReserves = trades && trades[currentTrade?.mint];
    const tokenReserves =
      currentReserves?.lastTrade?.virtual_token_reserves ||
      currentTrade?.virtual_token_reserves;
    const bondingCurveProgress =
      ((1_073_000_000 * 10 ** 6 - tokenReserves) * 100) /
      (793_100_000 * 10 ** 6);
    setCurveProgress(bondingCurveProgress);
  }, [trades, currentTrade]);

  const inversePool =
    currentTrade?.pooldata?.base_mint ===
    "So11111111111111111111111111111111111111112";

  const mint =
    currentTrade?.mint ||
    (inversePool
      ? currentTrade?.pooldata?.quote_mint
      : currentTrade?.pooldata?.base_mint);

  const pool =
    currentTrade?.pooldata?.pool || (mint && getPumpPoolPdaString(mint));

  const creationTime = currentTrade?.pooldata?.timestamp || 0;

  useEffect(() => {
    if (!mint) return;

    // Clear trades for previous mint
    setTrades({});
    setCandles([]);
    candleRef.current = [];
    // chartRef.current = null;

    // Optionally clear the chart if it's already initialized
    if (seriesRef.current) {
      seriesRef.current.setData([]);
    }
  }, [mint]);

  const handleTokenTrades = (payload) => {
    // Mark that we've started receiving real-time trades
    hasRealTimeTradesRef.current = true;

    const { mint, recipient, type, tokens_received, tokens_sold } = payload;
    setTrades((prev) => {
      const holdersMap = new Map(Object.entries(prev[mint]?.holders || {}));
      const currentBalance = holdersMap.get(recipient) || 0;
      let updatedBalance = currentBalance;

      if (type === "Buy" && tokens_received) {
        updatedBalance += tokens_received;
      } else if (type === "Sell" && tokens_sold) {
        updatedBalance -= tokens_sold;
        if (updatedBalance < 10) updatedBalance = 0;
      }

      holdersMap.set(recipient, updatedBalance);

      const mintEntries = Object.entries(prev);
      mintEntries.sort((a, b) => a[1].createdAt - b[1].createdAt);

      // Rebuild the trackedHolders object with the updated mint added
      const newTrackedHolders = Object.fromEntries(mintEntries);

      newTrackedHolders[mint] = {
        holders: Object.fromEntries(holdersMap),
        createdAt: prev[mint]?.createdAt || Date.now(),
        lastTrade: {
          virtual_sol_reserves: payload.virtual_sol_reserves,
          virtual_token_reserves: payload.virtual_token_reserves,
          recipient,
          tokens_received,
          tokens_sold,
          type,
        },
      };

      return newTrackedHolders;
    });
  };

  const handlePoolTrade = (payload) => {
    // Mark that we've started receiving real-time trades
    hasRealTimeTradesRef.current = true;

    const { pool, user, type, base_amount_out, base_amount_in } = payload;

    if (!pool) return;
    setTrades((prev) => {
      const holdersMap = new Map(Object.entries(prev[pool]?.holders || {}));
      const currentBalance = holdersMap.get(user) || 0;
      let updatedBalance = currentBalance;

      if (type === "Buy" && base_amount_out) {
        updatedBalance += base_amount_out;
      } else if (type === "Sell" && base_amount_in) {
        updatedBalance -= base_amount_in;
        if (updatedBalance < 10) updatedBalance = 0;
      }

      holdersMap.set(user, updatedBalance);

      const mintEntries = Object.entries(prev);
      mintEntries.sort((a, b) => a[1].createdAt - b[1].createdAt);

      // Rebuild the trackedHolders object with the updated mint added
      const newTrackedHolders = Object.fromEntries(mintEntries);

      newTrackedHolders[pool] = {
        holders: Object.fromEntries(holdersMap),
        createdAt: prev[pool]?.createdAt || Date.now(),
        lastTrade: {
          virtual_sol_reserves: payload.pool_quote_token_reserves,
          virtual_token_reserves: payload.pool_base_token_reserves,
          recipient: user,
          base_amount_out,
          base_amount_in,
          type,
        },
      };

      return newTrackedHolders;
    });
  };

  useEffect(() => {
    if (!mint) return;
    console.log("Tracking mint: ", mint.slice(0, 10));
    // Reset the real-time trades flag when mint changes
    hasRealTimeTradesRef.current = false;

    const socket = createSocket(); // Create only one socket connection
    chartSocketRef.current = socket;
    chartSocketRef.current.emit("updateMints", [mint]);
    chartSocketRef.current.emit("updatePools", [pool]);
    // Attach all event listeners
    socket.on("tokenTrades", handleTokenTrades);
    socket.on("poolTrade", handlePoolTrade);

    return () => {
      // Clean up all listeners and disconnect
      socket.off("tokenTrades", handleTokenTrades);
      socket.off("poolTrade", handlePoolTrade);
      socket.disconnect();
    };
  }, [mint]);

  const calculateCandlePositions = (width) => {
    if (typeof width !== "number") return { single: 0, multiple: 0 };

    if (width < 500) return { single: 25, multiple: 15 };
    if (width < 600) return { single: 30, multiple: 25 };
    if (width < 700) return { single: 42, multiple: 40 };

    return { single: 52, multiple: 50 };
  };

  // Set chart dimensions
  useLayoutEffect(() => {
    if (!width && chartWrapRef?.current) {
      setHeight(chartWrapRef.current.clientHeight);
      setWidth(chartWrapRef.current.clientWidth);
    }
  }, [chartWrapRef, width]);

  // Fetch chart data when mint/pool is available
  useEffect(() => {
    const fetchChart = async () => {
      if (!pool) return;
      try {
        const res = await fetch("https://api.pumpagent.com/pumpswap-chart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            pool,
            creationTime,
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch chart data");

        const data = await res.json();
        console.log("New tokendata: ", data);
        setCandles(data);
      } catch (err) {
        console.error("Chart fetch error:", err);
      }
    };

    fetchChart();
  }, [mint, pool]);

  useEffect(() => {
    if (!height || !candles.length) return;
    console.log("Creating chart");
    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: "#000" },
        textColor: "#fff",
      },
      width,
      height: height - 50,
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: "#fff",
        scaleMargins: {
          top: 0.2,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    chartRef.current.applyOptions({
      localization: {
        priceFormatter: function (price) {
          const value = Number(price).toFixed(1);
          if (value > 1000) return (value / 1000).toFixed(2) + "M";
          return value + "K";
        },
      },
    });

    const placements = calculateCandlePositions(width);

    // If candles exist, set them
    if (candles.length) {
      let currentCandles = candles
        .map((c) => ({
          ...c,
          time: Math.floor(Number(c.time) / 1000),
        }))
        .filter((c) => c.time && !isNaN(c.time))
        .sort((a, b) => a.time - b.time);

      // Deduplicate
      const seenTimes = new Set();
      currentCandles = currentCandles.filter((c) => {
        if (seenTimes.has(c.time)) return false;
        seenTimes.add(c.time);
        return true;
      });

      candleRef.current = currentCandles;
      seriesRef.current.setData(currentCandles);

      chartRef.current
        .timeScale()
        .scrollToPosition(
          currentCandles.length < 5 ? placements.single : placements.multiple,
          false
        );
    } else {
      // If no candles, just initialize empty chart so real-time updates can work
      candleRef.current = [];
      seriesRef.current.setData([]);
    }

    return () => chartRef.current?.remove();
  }, [candles, height]);

  const getTokenTradeData = useCallback(() => {
    const totalSupply = 1_000_000_000;

    const tradeData = trades[mint] || trades[pool];
    const solReserves =
      tradeData?.lastTrade?.virtual_sol_reserves ||
      currentTrade?.virtual_sol_reserves;

    const tokenReserves =
      tradeData?.lastTrade?.virtual_token_reserves ||
      currentTrade?.virtual_token_reserves;

    const parsedSol = Number(solReserves / 1e9);
    const parsedTokens = Number(tokenReserves / 1e6);

    if (
      !parsedTokens ||
      parsedTokens <= 0 ||
      parsedSol < 0.001 ||
      parsedSol <= 10
    ) {
      return null;
    }

    const pricePerTokenInSOL = parsedSol / parsedTokens;
    const pricePerTokenInUSD = pricePerTokenInSOL * solPrice;
    const marketCap = (totalSupply * pricePerTokenInUSD) / 1000;

    return { marketCap };
  }, [trades, mint, pool, solPrice, currentTrade]);

  useEffect(() => {
    const handleTokenTrades = () => {
      if (!seriesRef.current) return;

      const data = getTokenTradeData();
      if (!data) return;

      const { marketCap } = data;
      const now = Math.floor(Date.now() / 1000);
      const alignedTime = now - (now % 60);

      // Defensive default
      const prev = candleRef.current || [];
      const last = prev[prev.length - 1];

      let newCandle;

      if (!last || last.time !== alignedTime) {
        newCandle = {
          time: alignedTime,
          open: last ? last.close : marketCap,
          high: marketCap,
          low: marketCap,
          close: marketCap,
        };
      } else {
        newCandle = {
          ...last,
          high: Math.max(last.high, marketCap),
          low: Math.min(last.low, marketCap),
          close: marketCap,
        };
      }

      // Update chart
      seriesRef.current.update(newCandle);

      // Update local ref
      if (!last || last.time !== alignedTime) {
        candleRef.current = [...prev, newCandle];
      } else {
        candleRef.current = [...prev.slice(0, -1), newCandle];
      }
    };

    handleTokenTrades();
  }, [trades]);

  const fallBackName = currentTrade?.result?.content?.metadata?.name;
  const fallBackSymbol = currentTrade?.result?.content?.metadata?.symbol;
  const fallBackImage = currentTrade?.result?.content?.links?.image;
  const fallBackMint = mint;

  return (
    <div className="h-2/3 border-b border-gray-900 flex justify-center items-center relative">
      <div className="litcanvas w-full h-full relative" ref={chartWrapRef}>
        {currentTrade && (
          <div className=" w-full h-[50px] z-20 flex items-center justify-between px-2">
            <img
              src={getIPFSUrl(currentTrade?.image_uri || fallBackImage)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = Question;
              }}
              alt={currentTrade?.symbol || fallBackSymbol}
              className="w-8 h-8 z-10 rounded-full"
            />
            <div className="flex flex-col text-[12px] text-gray-600 pl-1">
              <span className="text-[12px] text-gray-400">
                {currentTrade?.symbol || fallBackSymbol}
              </span>
              <span className="text-[12px] text-gray-600">
                {currentTrade?.name || fallBackName}
              </span>
              <span
                className="text-[10px] text-gray-600 flex items-center gap-1 select-none"
                onClick={() =>
                  navigator.clipboard.writeText(currentTrade?.mint)
                }
              >
                {(currentTrade?.mint?.slice(0, 8) ||
                  fallBackMint?.slice(0, 8)) +
                  "..." +
                  (currentTrade?.mint?.slice(-8) || fallBackMint?.slice(-8))}
                <FaRegCopy className="text-gray-400 cursor-pointer hover:white active:text-greener text-[12px]" />
              </span>
            </div>
            {!currentTrade?.complete && !currentTrade.pooldata && (
              <div className="flex flex-col   justify-end ml-auto">
                <span className="text-[12px] text-gray-700">Curve</span>
                <div className="flex  rounded-full w-50 h-4">
                  <div className="flex p-2 px-0.5 mt-1 bg-[#3cbd0028] w-full h-3 rounded-md justify-start items-center relative">
                    <div
                      className="w-full h-3 rounded-md bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition flex justify-center items-center"
                      style={{
                        width: `${
                          currentTrade?.complete ? 100 : curveProgress
                        }%`,
                        background: "",
                      }}
                    ></div>
                    <span className=" text-white text-[10px] w-full text-center absolute">
                      {curveProgress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            {currentTrade?.complete ||
              (currentTrade.pooldata && (
                <div className="flex justify-end ml-auto items-center pr-2 gap-0.5">
                  <img src={Pill} alt="Pill" className="w-5 h-5 opacity-50" />
                  <span className="text-[12px] text-gray-700">PumpSwap</span>
                </div>
              ))}
          </div>
        )}
        <div
          ref={chartContainerRef}
          style={{ width: `${width}px`, height: `${height - 50}px` }}
          className={`absolute top-[50px] ${
            chartContainerRef.current &&
            (candles.length || Object.entries(trades).length)
              ? "fadefast"
              : "hidden"
          }`}
        />
        {((currentTrade && !candles.length) ||
          !Object.entries(trades).length) && (
          <span className="text-gray-700 text-[12px] w-full h-full flex justify-center items-center pb-0">
            Awaiting Trades
          </span>
        )}
      </div>
      <div className="h-[30px] bg-black absolute w-full bottom-0 left-0"></div>
    </div>
  );
};

export default Chart;

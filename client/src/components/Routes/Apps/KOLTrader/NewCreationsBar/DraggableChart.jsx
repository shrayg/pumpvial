import { useContext, useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import Draggable from "react-draggable";
import { createSocket } from "../createSocket";
import { FaXTwitter } from "react-icons/fa6";
import { FaGlobeAmericas } from "react-icons/fa";
import { BsLightningChargeFill } from "react-icons/bs";
import { VscGraphLine } from "react-icons/vsc";
import { AuthContext } from "../../../../../utils/AuthProvider";
import { calculateMarketcap } from "../../../../../utils/functions";
const DraggableChart = ({
  token,
  apiKey,
  onClose,
  solPrice,
  trackedHolders,
  setCharts,
  setLockedTab,
  setOpenPositions,
  setKolTrades,
  traderWallet,
}) => {
  const { user } = useContext(AuthContext);
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const nodeRef = useRef(null); // required for React 18+
  const [buying, setBuying] = useState(false);
  const candleRef = useRef([]);

  useEffect(() => {
    const ca = token.mint;
    if (!ca) return;

    const socket = createSocket({ mints: [ca] });

    const handleTokenTrades = (payload) => {
      const now = Math.floor(Date.now() / 1000);
      const alignedTime = now - (now % 60); // Round to minute start
      const totalSupply = 1_000_000_000;

      let pricePerTokenInSOL;
      const tokens =
        payload.type === "Buy" ? payload.tokens_received : payload.tokens_sold;
      const sol =
        payload.type === "Buy" ? payload.sol_buy : payload.sol_received;

      const parsedSol = Number((sol / 1e9).toFixed(5));
      const parsedTokens = Number((tokens / 1e6).toFixed(0));
      // Validate valid candles
      if (!parsedTokens || parsedTokens <= 0 || !parsedSol || parsedSol <= 0) {
        return;
      }

      pricePerTokenInSOL = parsedSol / parsedTokens;
      const pricePerTokenInUSD = pricePerTokenInSOL * solPrice;
      const marketCap = (totalSupply * pricePerTokenInUSD) / 1000;

      const prev = candleRef.current;
      const last = prev[prev.length - 1];

      if (!last || last.time !== alignedTime) {
        const newCandle = {
          time: alignedTime,
          open: last ? last.close : marketCap,
          high: marketCap,
          low: marketCap,
          close: marketCap,
        };
        if (seriesRef.current) seriesRef.current.update(newCandle);
        candleRef.current = [...prev, newCandle];
      } else {
        const updated = {
          ...last,
          high: Math.max(last.high, marketCap),
          low: Math.min(last.low, marketCap),
          close: marketCap,
        };
        if (seriesRef.current) seriesRef.current.update(updated);
        candleRef.current = [...prev.slice(0, -1), updated];
      }
    };

    socket.on("tokenTrades", handleTokenTrades);

    return () => {
      socket.off("tokenTrades", handleTokenTrades);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!token || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: "#000" },
        textColor: "#fff",
      },
      width: 300,
      height: 250,
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: "#fff",
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;
    const candleSeries = chart.addCandlestickSeries();
    seriesRef.current = candleSeries;

    const fetchChart = async () => {
      try {
        const res = await fetch("https://api.pumpagent.com/pump-chart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({ ca: token.mint }),
        });

        const candles = await res.json();
        if (!candles?.length) return;

        candles.sort((a, b) => a.time - b.time);
        candleSeries.setData(candles);
        candleRef.current = candles;
      } catch (e) {
        console.error("Chart load failed", e);
      }
    };

    fetchChart();

    return () => chart.remove();
  }, [token]);

  const twitter = token?.twitter;
  const website = token?.website;
  const holders = trackedHolders[token.mint]?.holders ?? {};

  const holdersAbove10 = Object.entries(holders).filter(
    ([_, amount]) => amount > 10
  ).length;

  const holdersBelow10 = Object.entries(holders).filter(
    ([_, amount]) => amount < 10
  ).length;

  // Open new chart to dashboard
  const openChart = (newChart) => {
    setCharts((prev) => {
      // Skip if chart already exists
      if (prev.some((chart) => chart?.mint === newChart.mint)) return prev;

      // Find the first null index
      const nullIndex = prev.findIndex((chart) => chart === null);

      const updated = [...prev];
      if (nullIndex !== -1) {
        // If a null slot exists, replace it
        updated[nullIndex] = newChart;
      } else if (updated.length > 3) {
        // Otherwise, replace the 4th slot (index 3) if it exists
        updated[3] = newChart;
      }
      return updated;
    });
    setLockedTab(null);
  };

  const handleQuickBuy = async () => {
    setBuying(true);
    const solIn = +localStorage.getItem("quickBuyAmountCharts");
    if (!solIn) return;

    const ca = token.mint;
    const swapSetting = JSON.parse(localStorage.getItem("swapSettings"));
    const retryEnabled = swapSetting.autoRetry;
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second
    const startTime = performance.now();

    const attemptBuy = async () => {
      const request = await fetch("https://api.pumpagent.com/koltrader-buy", {
        method: "POST",
        body: JSON.stringify({
          ca,
          solIn,
          prioFee: swapSetting.prioFee,
          recipient: traderWallet,
          slippage: swapSetting.slippage,
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
        sol_in_bondingcurve: Number(
          (response.txResult.real_sol_reserves / 1e9).toFixed(2)
        ),
        marketcap: calculateMarketcap(
          response.txResult.virtual_sol_reserves,
          response.txResult.virtual_token_reserves,
          solPrice
        ),
        real_sol_reserves: response.txResult.real_sol_reserves,
        real_token_reserves: response.txResult.real_token_reserves,
        virtual_sol_reserves: response.txResult.virtual_sol_reserves,
        virtual_token_reserves: response.txResult.virtual_token_reserves,
        sol_buy: Number(solIn),
        tokens_received: response.txResult.tokens,
        kol: user,
        kol_twitter: "",
        message: `${user} bought ${response.txResult.tokens} tokens for ${solIn} SOL`,
      };

      setKolTrades((prev) => [userKolEntry, ...prev]);
      openChart(token);
      setView("Charts");
    } catch (err) {
      console.error("All buy attempts failed.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <Draggable nodeRef={nodeRef} handle="#only">
      <div
        ref={nodeRef}
        className="absolute top-10 left-10 z-[9999] bg-[#111] border border-gray-700 rounded-lg p-2 cursor-move select-none"
      >
        <div className="flex justify-between items-center mb-1" id="only">
          <div className="flex">
            <img
              src={token.image}
              alt={token.name}
              className="w-5 h-5 rounded-md object-cover mr-2"
            />
            <span className="text-xs text-greener font-bold">
              {token.symbol}
            </span>
            <div className="flex justify-center items-center gap-2 mb-1 px-2">
              <span className="text-green-500 flex flex-col justify-between items-center">
                <span className="text-[10px]">{holdersAbove10}</span>
              </span>
              <span className=" text-red-500 flex flex-col justify-between items-center">
                <span className="text-[10px]">{holdersBelow10}</span>
              </span>
            </div>
            <div className="flex justify-center items-center mb-1">
              {twitter && (
                <a
                  href={`https://twitter.com/${twitter}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-500 font-bold hover:text-white ml-2"
                >
                  <FaXTwitter size={14} />
                </a>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-500 font-bold hover:text-white ml-1"
                >
                  <FaGlobeAmericas size={14} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white text-xs mr-1 mb-1"
          >
            ✕
          </button>
        </div>
        <div ref={chartContainerRef} />
        <div className="h-10 w-full  mt-2 rounded-md flex">
          <button
            className="border-gray-800 p-2 border rounded-md mr-2 cursor-pointer group hover:border-gray-700 transition ease-in-out w-1/2 flex justify-center items-center text-[14px]"
            onClick={() => openChart(token)}
          >
            <VscGraphLine className="text-gray-500 group-hover:text-white transition ease-in-out" />
          </button>
          <button
            className={`flex gap-1 h-full justify-center items-center p-1 px-4 w-1/2 rounded-sm  border border-[#00e12d11] text-[#555] hover:text-white cursor-pointer hover:bg-[#00e12d8c] flex-1 text-[12px] ${
              buying ? "gradbtn" : "bg-[#00e12d11]"
            }`}
            onClick={handleQuickBuy}
            disabled={buying ? true : false}
          >
            <BsLightningChargeFill />
            <span>BUY</span>
          </button>
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableChart;

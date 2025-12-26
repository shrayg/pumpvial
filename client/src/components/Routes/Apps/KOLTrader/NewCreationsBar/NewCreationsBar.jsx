import { useContext, useEffect, useRef, useState } from "react";
import { FaXTwitter } from "react-icons/fa6";
import { FaGlobeAmericas } from "react-icons/fa";
import { createChart } from "lightweight-charts";
import { createSocket } from "../createSocket";
import DraggableChart from "./DraggableChart";
import { FaTriangleExclamation } from "react-icons/fa6";
import { AuthContext } from "../../../../../utils/AuthProvider";

const NewCreationsBar = ({
  trackedCreations,
  trackedHolders,
  apiKey,
  solPrice,
  setCharts,
  setOpenPositions,
  setKolTrades,
  traderWallet,
  setView,
}) => {
  const { user } = useContext(AuthContext);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const candleRef = useRef([]); // Use ref instead of state
  const [hoveredTab, setHoveredTab] = useState(null);
  const containerRefs = useRef({});
  const [lockedTab, setLockedTab] = useState(null);
  const [fetchedData, setFetchedData] = useState([]);
  const fetchedIds = useRef(new Set()); // tokens already fetched
  const clickTimeoutRef = useRef(null);
  const entries = Object.entries(trackedCreations);

  // Fetch last mint metadata once trackedCreations changes
  useEffect(() => {
    const lastMint = entries[entries.length - 1]?.[0];
    const uri = entries[entries.length - 1]?.[1]?.uri;
    const fetchLastMint = async () => {
      try {
        if (!lastMint || !uri || !uri.includes("http")) return;

        const existing = fetchedIds.current.has(lastMint);
        if (existing) return;
        fetchedIds.current.add(lastMint);

        // Rebuild the IPFS URI if it ends with an IPFS hash or contains one
        const ipfsRegex = /(?:\/ipfs\/)?(Qm[1-9A-HJ-NP-Za-km-z]{44,})$/;
        const match = uri.match(ipfsRegex);

        let rebuiltUri = uri;

        if (match) {
          const ipfsHash = match[1];
          rebuiltUri = `https://ipfs.io/ipfs/${ipfsHash}`;
        }

        const response = await fetch(rebuiltUri);
        if (!response.ok) return;

        const data = await response.json();
        data.mint = lastMint;
        data.uri = uri;
        data.safeUri = data.uri.includes("ipfs.io/ipfs");

        setFetchedData((prev) => {
          const updated = [data, ...prev];
          if (updated.length > 75) updated.pop(); // remove the last item
          return updated;
        });
      } catch (_) {}
    };

    fetchLastMint();
  }, [trackedCreations]);

  // Handle real-time tokenTrades socket updates
  useEffect(() => {
    if (!hoveredTab) return;
    const ca = hoveredTab.mint;
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
  }, [hoveredTab, solPrice]);

  // Initialize chart and update on hoveredTab changes
  useEffect(() => {
    if (!hoveredTab) return;
    const container = containerRefs.current[hoveredTab.mint];
    if (!container) return;

    // Clean up old chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    seriesRef.current = null;
    candleRef.current = []; // reset candle data

    // Create new chart
    const chart = createChart(container, {
      layout: {
        background: { type: "solid", color: "#000" },
        textColor: "#fff",
      },
      width: container.clientWidth,
      height: container.clientHeight,
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: "#fff",
        scaleMargins: { top: 0.2, bottom: 0.15 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chart.applyOptions({
      localization: {
        priceFormatter: (price) => {
          const value = Number(price).toFixed(1);
          if (value > 1000) return value / 1000 + "M";
          return value + "K";
        },
      },
    });

    const candleSeries = chart.addCandlestickSeries();

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Fetch initial candle data
    const fetchChart = async () => {
      try {
        const res = await fetch("https://api.pumpagent.com/pump-chart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({ ca: hoveredTab.mint }),
        });

        let candles = await res.json();
        if (!candles || candles.length === 0) return;

        candles.sort((a, b) => a.time - b.time);

        candleSeries.setData(candles);
        candleRef.current = candles;

        // Scroll time scale to latest data nicely
        if (candles.length < 5) {
          chart.timeScale().scrollToPosition(25, false);
        } else {
          chart.timeScale().scrollToPosition(15, false);
        }
      } catch (err) {
        console.error("Chart fetch failed:", err);
      }
    };

    fetchChart();

    // Handle resizing
    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
        chartRef.current.timeScale().fitContent();
      }
    });

    let currentContainer = container;

    resizeObserver.observe(currentContainer);

    return () => {
      if (currentContainer) resizeObserver.unobserve(currentContainer);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      candleRef.current = [];
    };
  }, [hoveredTab]);

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
  };

  const clickDelay = 200; // Shorter is better for UX

  const handleClick = (e, item) => {
    // If there's already a timer, clear it to prevent overlaps
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    clickTimeoutRef.current = setTimeout(() => {
      setLockedTab(item);
      clickTimeoutRef.current = null;
    }, clickDelay);
  };

  const handleDoubleClick = (e, item) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current); // Cancel single-click
      clickTimeoutRef.current = null;
      setView("Charts");
    }
    openChart(item);
  };

  const handleMouseEnter = (item) => {
    if (!user) return;
    setHoveredTab(item);
  };

  const handleMouseLeave = () => {
    if (!user) return;
    setHoveredTab(null);
  };

  return (
    <>
      {lockedTab && (
        <DraggableChart
          token={lockedTab}
          apiKey={apiKey}
          solPrice={solPrice}
          onClose={() => setLockedTab(null)}
          trackedHolders={trackedHolders}
          setCharts={setCharts}
          setLockedTab={setLockedTab}
          setOpenPositions={setOpenPositions}
          setKolTrades={setKolTrades}
          traderWallet={traderWallet}
          setView={setView}
        />
      )}
      <div
        className={`flex items-center h-[70px] absolute z-[9000] top-0 transform left-45 w-[55%] lg:w-[70%] whitespace-nowrap select-none ${
          !user ? "cursor-not-allowed" : ""
        }`}
      >
        {fetchedData.length && (
          <div className="marquee flex space-x-1 text-[12px] w-full relative">
            <div className="overflow-x-hidden flex gap-1">
              {fetchedData.map((item, i) => {
                const mint = item.mint;
                const twitter = item?.twitter;
                const website = item?.website;
                const holders = trackedHolders[mint]?.holders ?? {};
                const safeUri = item.safeUri;
                const validPumpCA = mint.slice(-4) === "pump";
                const holdersAbove10 = Object.entries(holders).filter(
                  ([_, amount]) => amount > 10
                ).length;

                const holdersBelow10 = Object.entries(holders).filter(
                  ([_, amount]) => amount < 10
                ).length;

                return (
                  <div
                    key={i}
                    className={`flex items-center space-x-1 flex-col gap-0.5  hover:bg-[#222] p-2 px-4 rounded-md min-w-[75px] group ${
                      !user
                        ? "pointer-events-none cursor-not-allowed"
                        : "pointer-events-auto cursor-pointer"
                    }`}
                    onMouseEnter={() => handleMouseEnter(item)}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => handleClick(e, item)}
                    onDoubleClick={(e) => handleDoubleClick(e, item)}
                  >
                    <div className={`flex gap-0.75 items-end relative `}>
                      <span className=" text-red-500 flex flex-col justify-between items-center w-[12px]">
                        <span className="text-[8px]">{holdersBelow10}</span>
                      </span>
                      <img
                        loading="lazy"
                        src={item.image}
                        alt={item.name}
                        className="min-w-5 max-w-5 min-h-5 max-h-5 object-cover rounded-md"
                      />
                      <span className="text-green-500 flex flex-col justify-between items-center w-[12px]">
                        <span className="text-[8px]">{holdersAbove10}</span>
                      </span>
                      <button
                        title="3rd Party Deployment"
                        className="absolute top-0 left-0.5"
                      >
                        {(safeUri === false || !validPumpCA) && (
                          <FaTriangleExclamation className="text-yellow-500 text-[8px] z-100" />
                        )}
                      </button>
                    </div>
                    <span className="text-gray-500 font-bold">
                      {item?.symbol}
                    </span>
                    <div className="absolute min-w-80 h-60 bg-[#222] top-12 hidden group-hover:flex justify-start items-start border flex-col border-gray-800 rounded-b-lg overflow-hidden">
                      <div className="flex w-full justify-between px-2 border-b border-gray-800">
                        <div className="flex justify-start items-center gap-1">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-5 h-5 rounded-md"
                          />

                          <span className="text-xs font-bold py-2 text-greener">
                            {item.symbol}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center py-2">
                          {twitter && (
                            <a
                              href={`https://twitter.com/${twitter}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-gray-500 font-bold hover:text-white"
                            >
                              <FaXTwitter size={14} />
                            </a>
                          )}
                          {website && (
                            <a
                              href={website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-gray-500 font-bold hover:text-white"
                            >
                              <FaGlobeAmericas size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      <div
                        ref={(el) => (containerRefs.current[item.mint] = el)}
                        className={`relative w-full h-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewCreationsBar;

import { useContext, useEffect, useState } from "react";
import Terminal from "./Terminal/Terminal.jsx";
import ChartsView from "./ChartView/ChartsView.jsx";
import { HiCog6Tooth } from "react-icons/hi2";
import TerminalSettings from "./Terminal/TerminalSettings.jsx";
import TerminalFilters from "./Terminal/TerminalFilters.jsx";
import { FaTrash } from "react-icons/fa6";
import { createSocket } from "./createSocket.jsx";
import { useRef } from "react";
import TradePanel from "./TradePanel/TradePanel.jsx";
import CreateStrategy from "./CreateStrategy.jsx";
import { FaChartArea } from "react-icons/fa";
import { MdTerminal } from "react-icons/md";
import { AuthContext } from "../../../../utils/AuthProvider.jsx";
import ManageStrategy from "./ManageStrategy.jsx";
import NewCreationsBar from "./NewCreationsBar/NewCreationsBar.jsx";

const KOLTrader = () => {
  const poolSocketRef = useRef(null);
  const { user } = useContext(AuthContext);
  const [kolTrades, setKolTrades] = useState([]);
  const [charts, setCharts] = useState([null, null, null, null]);
  const chartsRef = useRef(null);
  const [view, setView] = useState("Terminal");
  const [overlay, setOverlay] = useState("");
  const [trackedPositions, setTrackedPositions] = useState({}); // KOL => Mint => Trades
  const [trackedCreations, setTrackedCreations] = useState({}); // Mint => {uri: img}
  const [trackedHolders, setTrackedHolders] = useState({}); // Mint => Holders/Last trade
  const [tokenInfo, setTokenInfo] = useState({}); // Mint => Token Info
  const [traderWallet, setTraderWallet] = useState(""); // Trader
  const [apiKey, setApiKey] = useState("");
  const [strategies, setStrategies] = useState([]);
  const [enabledStrategies, setEnabledStrategies] = useState([]);
  const [openPositions, setOpenPositions] = useState([]); // Open trades
  const [solBalance, setSolBalance] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [activeTab, setActiveTab] = useState(null);
  const [pumpswapCandles, setPumpswapCandles] = useState({}); // Mint => OHLC array
  const [trackedPoolTrades, setTrackedPoolTrades] = useState({}); // Mint => Trades
  const trackedPoolsRef = useRef({}); // Mint => Pool
  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;

  // Get current SOL price every 1 minute
  useEffect(() => {
    const solFetcher = async () => {
      try {
        const res = await fetch(
          "https://lite-api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112&vsToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        );
        const { data } = await res.json();

        // Extract the price
        const solPrice =
          data["So11111111111111111111111111111111111111112"].price;
        setSolPrice(+solPrice);
      } catch (err) {
        console.error("Failed to fetch SOL price:", err);
      }
    };

    solFetcher();
    const interval = setInterval(solFetcher, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load strategies
  useEffect(() => {
    const saved = localStorage.getItem(`${user}-strategies`);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    setEnabledStrategies(parsed);
  }, [user]);

  // Load user apiKey & wallet
  useEffect(() => {
    if (!user) return;
    const loadUser = async () => {
      try {
        const request = await fetch("https://api.pumpagent.com/load-koltrader", {
          method: "POST",
          body: JSON.stringify({
            proof,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const response = await request.json();
        if (response.error) return;
        setTraderWallet(response.pubKey);
        setApiKey(response.apiKey);
        if (response.strategy) setStrategies(response.strategy);
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, [user]);

  // Sync charts to ref
  useEffect(() => {
    chartsRef.current = charts;
  }, [charts]);

  // Handle KOl trades
  const handleKolTrades = (payload) => {
    setKolTrades((prev) => {
      const updated = [payload, ...prev];
      if (updated.length > 150) {
        updated.pop(); // remove the last (oldest) item
      }
      return updated;
    });
  };

  // Handle token creation
  const handleTokenCreation = (launch) => {
    setTrackedCreations((prev) => {
      const chartMints = new Set(
        chartsRef.current.map((c) => c?.mint).filter(Boolean)
      );

      const entries = [
        ...Object.entries(prev),
        [launch.mint, { uri: launch.uri }],
      ];

      let i = 0;

      // Remove non-chart mints from the front while length > 75
      while (entries.length > 75 && i < entries.length) {
        const [mint] = entries[i];
        if (!chartMints.has(mint)) {
          entries.splice(i, 1);

          setTrackedHolders((prev) => {
            const prevHolders = { ...prev };
            delete prevHolders[mint];
            return prevHolders;
          });
          // don't increment i, because after removal next element shifts to i
        } else {
          i++; // skip chart mints to keep them for now
        }
      }

      return Object.fromEntries(entries);
    });
  };

  // Track trades for migrated tokens and add to normal trades state
  const handlePoolTrade = (payload) => {
    const { pool, user, type, base_amount_out, base_amount_in } = payload;
    const mint = Object.keys(trackedPoolsRef.current).find(
      (key) => trackedPoolsRef.current[key] === pool
    );

    if (!mint) return;
    setTrackedPoolTrades((prev) => {
      const holdersMap = new Map(Object.entries(prev[mint]?.holders || {}));
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

      newTrackedHolders[mint] = {
        holders: Object.fromEntries(holdersMap),
        createdAt: prev[mint]?.createdAt || Date.now(),
        lastTrade: {
          virtual_sol_reserves: payload.pool_quote_token_reserves,
          virtual_token_reserves: payload.pool_base_token_reserves,
        },
      };

      return newTrackedHolders;
    });
  };

  // Check if new pool should be tracked
  const handleNewPoolCreation = (newPool) => {
    const matchingMintForPool = chartsRef.current.find(
      (c) => c?.mint === newPool.base_mint
    );

    if (matchingMintForPool) {
      trackedPoolsRef.current[newPool.base_mint] = newPool.pool;
      poolSocketRef.current.emit(
        "updatePools",
        Object.values(trackedPoolsRef.current)
      );
    }
  };

  const handleKOLPumpSwapTrade = (payload) => {
    setKolTrades((prev) => {
      const updated = [payload, ...prev];
      if (updated.length > 150) {
        updated.pop(); // remove the last (oldest) item
      }
      return updated;
    });
  };

  const handleTokenTrades = (payload) => {
    const { mint, recipient, type, tokens_received, tokens_sold } = payload;
    setTrackedHolders((prev) => {
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
        },
      };

      return newTrackedHolders;
    });
  };

  useEffect(() => {
    const socket = createSocket(); // Create only one socket connection
    poolSocketRef.current = socket;

    // Attach all event listeners
    socket.on("kolPoolTrade", handleKOLPumpSwapTrade);
    socket.on("poolTrade", handlePoolTrade);
    socket.on("kolTrades", handleKolTrades);
    socket.on("tokenCreation", handleTokenCreation);
    socket.on("poolCreation", handleNewPoolCreation);
    socket.on("tokenTrades", handleTokenTrades);

    return () => {
      // Clean up all listeners and disconnect
      socket.off("kolPoolTrade", handleKOLPumpSwapTrade);
      socket.off("poolTrade", handlePoolTrade);
      socket.off("kolTrades", handleKolTrades);
      socket.off("tokenCreation", handleTokenCreation);
      socket.off("poolCreation", handleNewPoolCreation);
      socket.off("tokenTrades", handleTokenTrades);
      socket.disconnect();
    };
  }, []);

  // Track holders of last 75 created or currently active tokens in charts
  useEffect(() => {
    const mintArray = Object.keys(trackedCreations);
    if (!mintArray.length) return;

    poolSocketRef.current.emit("updateMints", mintArray);
  }, [trackedCreations]);

  // Track trades for KOLS along with their current balances
  useEffect(() => {
    if (!kolTrades.length) return;
    const trade = kolTrades[0];

    const { kol, mint: ca, pool } = trade;
    // Set tracked kol positions
    const mint = ca || pool;

    setTrackedPositions((prev) => {
      const prevMintTrades = prev[kol]?.[mint]?.[0] || [];
      const newTrades = [...prevMintTrades, trade];
      // Compute balance
      let balance = 0;
      for (const t of newTrades) {
        if (t.type === "Buy" && t.tokens_received) {
          balance += t.tokens_received / 1e6;
        } else if (t.type === "Sell" && t.tokens_sold) {
          balance -= t.tokens_sold / 1e6;
        }
      }
      if (balance < 10) balance = 0;
      return {
        ...prev,
        [kol]: {
          ...(prev[kol] || {}),
          [mint]: [newTrades, balance],
        },
      };
    });
  }, [kolTrades]);

  return (
    <div className="flex h-full flex-col w-full mx-auto">
      <div className="flex w-full h-full opacity-100 xl:hidden justify-center items-center text-[12px] text-gray-500">
        <span>PumpAgent DEX is only availabe on desktop.</span>
      </div>
      <div className="h-full flex-col w-full mx-auto hidden xl:flex">
        {/* <NewCreationsBar
          trackedCreations={trackedCreations}
          trackedHolders={trackedHolders}
          apiKey={apiKey}
          solPrice={solPrice}
          setCharts={setCharts}
          setOpenPositions={setOpenPositions}
          setKolTrades={setKolTrades}
          traderWallet={traderWallet}
          setView={setView}
        /> */}

        {overlay === "Create Strategy" && (
          <CreateStrategy
            setOverlay={setOverlay}
            strategies={strategies}
            setStrategies={setStrategies}
            apiKey={apiKey}
          />
        )}
        {overlay === "Manage Strategy" && (
          <ManageStrategy
            setOverlay={setOverlay}
            strategies={strategies}
            setStrategies={setStrategies}
            apiKey={apiKey}
            setEnabledStrategies={setEnabledStrategies}
            enabledStrategies={enabledStrategies}
          />
        )}
        {/* Content */}
        <div className="flex flex-1">
          <div className="relative w-full h-full flex flex-col">
            {/* Nav */}
            <div className="flex w-full justify-center items-center">
              <div className="flex text-gray-600 text-[14px] w-full border-b border-gray-900">
                <button
                  className={`${
                    view === "Terminal"
                      ? "bg-[#3337] text-gray-400"
                      : "cursor-pointer hover:bg-[#050505]"
                  } p-2 py-2.5 w-1/2 flex justify-center items-center gap-1`}
                  onClick={() => setView("Terminal")}
                >
                  <MdTerminal />
                  Terminal
                </button>
                <button
                  className={`${
                    view === "Charts"
                      ? "bg-[#3337] text-gray-400"
                      : "cursor-pointer hover:bg-[#050505]"
                  } p-2 py-2  flex justify-center items-center gap-1 w-1/2`}
                  onClick={() => setView("Charts")}
                >
                  <FaChartArea />
                  Charts
                </button>
              </div>
            </div>
            <div
              className={`${
                view === "Terminal" ? "flex flex-col" : "hidden"
              }  rounded-md relative overflow-hidden flex-1`}
            >
              {overlay === "Settings" && (
                <TerminalSettings setOverlay={setOverlay} />
              )}
              {overlay === "Filters" && (
                <TerminalFilters setOverlay={setOverlay} />
              )}

              <Terminal
                kolTrades={kolTrades}
                setCharts={setCharts}
                setView={setView}
                overlay={overlay}
                charts={charts}
                traderWallet={traderWallet}
                apiKey={apiKey}
                setOpenPositions={setOpenPositions}
                setKolTrades={setKolTrades}
                solPrice={solPrice}
                poolSocketRef={poolSocketRef}
                trackedPoolsRef={trackedPoolsRef}
                trackedPoolTrades={trackedPoolTrades}
                tokenInfo={tokenInfo}
                setTokenInfo={setTokenInfo}
              />
              <div className="h-10 w-full absolute bottom-0 border-t border-gray-800 flex justify-between items-center px-2">
                <div className="flex gap-2">
                  <button
                    className="text-[12px] text-gray-600 flex justify-center items-center gap-1 cursor-pointer hover:text-gray-400 bg-[#3333334f] hover:bg-[#33333392] p-2 rounded-md"
                    onClick={() => setOverlay("Settings")}
                  >
                    <HiCog6Tooth />
                    Settings
                  </button>
                  {/* <button
                  className="text-[12px] text-gray-600 flex justify-center items-center gap-1 cursor-pointer hover:text-gray-400 bg-[#3333334f] hover:bg-[#33333392] p-2 rounded-md"
                  onClick={() => setOverlay("Filters")}
                  >
                  <FaFilter className="text-gray-700 group-hover:text-gray-400" />
                  Filters
                  </button> */}
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-[12px] text-gray-600 flex justify-center items-center gap-1 cursor-pointer hover:text-gray-400 bg-[#3333334f] hover:bg-[#33333392] p-2 rounded-md"
                    onClick={() => setKolTrades([])}
                  >
                    <FaTrash />
                    Clear Terminal
                  </button>
                </div>
              </div>
            </div>
            <div className={`${view === "Charts" ? "h-full" : "hidden"}`}>
              <ChartsView
                charts={charts}
                setCharts={setCharts}
                kolTrades={kolTrades}
                trackedPositions={trackedPositions}
                trackedHolders={trackedHolders}
                tokenInfo={tokenInfo}
                setTokenInfo={setTokenInfo}
                openPositions={openPositions}
                solPrice={solPrice}
                apiKey={apiKey}
                traderWallet={traderWallet}
                activeTab={activeTab}
                setOpenPositions={setOpenPositions}
                pumpswapCandles={pumpswapCandles}
                setPumpswapCandles={setPumpswapCandles}
                setKolTrades={setKolTrades}
                setTrackedCreations={setTrackedCreations}
                trackedPoolTrades={trackedPoolTrades}
                trackedPoolsRef={trackedPoolsRef}
                setTrackedPoolTrades={setTrackedPoolTrades}
                setSolBalance={setSolBalance}
                poolSocketRef={poolSocketRef}
                trackedCreations={trackedCreations}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>

          <TradePanel
            view={view}
            setView={setView}
            charts={charts}
            tokenInfo={tokenInfo}
            setOverlay={setOverlay}
            strategies={strategies}
            openPositions={openPositions}
            setOpenPositions={setOpenPositions}
            setCharts={setCharts}
            apiKey={apiKey}
            traderWallet={traderWallet}
            setKolTrades={setKolTrades}
            solBalance={solBalance}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            trackedHolders={trackedHolders}
            setTraderWallet={setTraderWallet}
            trackedPoolsRef={trackedPoolsRef}
            setSolBalance={setSolBalance}
            trackedPoolTrades={trackedPoolTrades}
            solPrice={solPrice}
            poolSocketRef={poolSocketRef}
          />
        </div>
      </div>
    </div>
  );
};

export default KOLTrader;

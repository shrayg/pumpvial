import { useRef, useState, useEffect, useLayoutEffect } from "react";
import Chart from "./Chart/Chart";
import { VscGraphLine } from "react-icons/vsc";
import ActionBar from "./ActionBar";
import { getPumpPoolPdaString } from "../../../../../utils/functions.js";

const ChartsView = ({
  charts,
  setCharts,
  kolTrades,
  trackedPositions,
  trackedHolders,
  tokenInfo,
  setTokenInfo,
  openPositions,
  solPrice,
  apiKey,
  traderWallet,
  activeTab,
  setOpenPositions,
  setKolTrades,
  setTrackedCreations,
  trackedPoolTrades,
  trackedPoolsRef,
  setTrackedPoolTrades,
  pumpswapCandles,
  setPumpswapCandles,
  setSolBalance,
  poolSocketRef,
  trackedCreations,
  setActiveTab,
}) => {
  const chartRefs = useRef([]);
  const [height, setHeight] = useState(null);
  const [width, setWidth] = useState(null);
  const [runBumps, setRunBumps] = useState({});
  const [trackedTrades, setTrackedTrades] = useState({});

  useEffect(() => {
    if (!charts || charts.length === 0) return;

    const validCharts = charts.filter((pos) => pos && pos.mint);
    if (validCharts.length === 0) return;

    const newPools = validCharts.reduce((acc, { mint }) => {
      acc[mint] = getPumpPoolPdaString(mint);
      return acc;
    }, {});

    // Merge new pools with existing tracked pools
    trackedPoolsRef.current = {
      ...trackedPoolsRef.current,
      ...newPools,
    };

    poolSocketRef.current.emit(
      "updatePools",
      Object.values(trackedPoolsRef.current)
    );
  }, [charts]);

  // Calculate height of charts
  useLayoutEffect(() => {
    if (chartRefs.current[0] && !width) {
      setHeight(chartRefs.current[0].clientHeight);
      setWidth(chartRefs.current[0].clientWidth);
    }
  }, [charts]);

  // Remove chart from UI and cleanup states
  const deleteChart = (index, chart) => {
    const newCharts = [...charts];
    newCharts[index] = null;

    // delete tokenInfo[chart.mint];
    setCharts(newCharts);
    setTrackedPoolTrades((prev) => {
      const old = { ...prev };
      delete old[chart.mint];
      return old;
    });

    setPumpswapCandles((prev) => {
      const old = { ...prev };
      delete old[chart.mint];
      return old;
    });

    delete trackedPoolsRef.current[chart.mint];
  };

  // Get token data when tracking new coin
  useEffect(() => {
    const fetchAllTokenInfoAndCandles = async () => {
      const validCharts = charts.filter((c) => c && c.mint).filter(Boolean);
      const mints = validCharts.map((c) => c.mint);

      // Find missing mints that we don't have info for
      const missingMints = mints.filter((mint) => !tokenInfo[mint]);
      // Fetch token info for missing mints
      const updates = {};
      for (const mint of missingMints) {
        try {
          const request = await fetch(
            "https://api.pumpagent.com/pump-token-info",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
              body: JSON.stringify({ ca: mint }),
            }
          );

          const { response } = await request.json();
          updates[mint] = response;
        } catch (err) {
          console.error(`Failed to fetch token info for ${mint}`, err);
        }
      }
      // Merge new token info
      if (Object.keys(updates).length > 0) {
        setTokenInfo((prev) => ({ ...prev, ...updates }));
      }

      // Now fetch candles for **all** mints (regardless if token info was new or existing)
      for (const mint of mints) {
        try {
          // Use the mint info from either existing tokenInfo or newly fetched updates
          const info = tokenInfo[mint] || updates[mint];
          if (!info) {
            console.warn(
              `No token info found for mint ${mint}, skipping candle fetch`
            );
            continue;
          }

          const pool = getPumpPoolPdaString(info.mint);
          const creationTime = Math.floor(info.created_timestamp / 1000);

          const chartRequest = await fetch(
            "https://api.pumpagent.com/pumpswap-chart",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
              body: JSON.stringify({ pool, creationTime }),
            }
          );

          const chartResponse = await chartRequest.json();

          if (chartResponse.length > 0) {
            setPumpswapCandles((prev) => ({
              ...prev,
              [mint]: chartResponse,
            }));
          }
        } catch (err) {
          console.error(`Failed to fetch candles for ${mint}`, err);
        }
      }
    };

    if (charts.filter(Boolean).length) fetchAllTokenInfoAndCandles();
  }, [charts]);

  // Start tracking current charts
  useEffect(() => {
    if (!charts || !tokenInfo) return;

    // Filter valid charts with a mint
    const validCharts = charts.filter((c) => c && c.mint);

    // Create a new object with all the tracked creations
    const newTracked = {};

    validCharts.forEach(({ mint }) => {
      if (mint && tokenInfo[mint]) {
        newTracked[mint] = {
          uri: tokenInfo[mint]?.metadata_uri,
        };
      }
    });

    setTrackedCreations((prev) => ({
      ...prev,
      ...newTracked,
    }));
  }, [charts]);

  // Track all KOL trades for a certain CA
  useEffect(() => {
    if (!Object.entries(tokenInfo).length || !kolTrades.length) return;
    setTrackedTrades((prev) => {
      const newTrackedTrades = { ...prev };
      for (const key of Object.keys(tokenInfo)) {
        const pool = getPumpPoolPdaString(key);
        const allOfSameType = kolTrades.filter(
          (k) => k.mint === key || k.pool === pool
        );
        newTrackedTrades[key] = [
          ...(newTrackedTrades[key] || []),
          ...allOfSameType,
        ];
      }
      return newTrackedTrades;
    });
  }, [tokenInfo, kolTrades]);

  // Auto close chart if localstorage 'terminalSettings' has 'autoClose' true
  useEffect(() => {
    if (!Object.entries(trackedPositions).length) return;

    const mintBalances = {};

    for (const [kolName, mints] of Object.entries(trackedPositions)) {
      for (const mint in mints) {
        const [_, balance] = mints[mint];
        mintBalances[mint] = (mintBalances[mint] || 0) + balance;
      }
    }

    const mintsWithNegativeBalance = Object.entries(mintBalances)
      .filter(([_, balance]) => balance < 10)
      .map(([mint]) => mint);

    const terminalSettings = localStorage.getItem("terminalSettings");
    if (!terminalSettings) return;

    const { autoClose } = JSON.parse(terminalSettings);
    if (!autoClose) return;

    const openTradeMints = new Set(openPositions.map((trade) => trade.mint));
    charts.forEach((chart, index) => {
      if (
        chart &&
        mintsWithNegativeBalance.includes(chart.mint) &&
        !openTradeMints.has(chart.mint)
      ) {
        deleteChart(index, chart);
      }
    });
  }, [trackedPositions]);

  return (
    <div className="flex h-full flex-wrap justify-center items-center">
      {charts.length &&
        charts.map((chart, index) => (
          <div
            key={index}
            ref={(el) => (chartRefs.current[index] = el)}
            className={`w-[50%] h-[50%] relative overflow-hidden flex flex-col ${
              index === 0
                ? "border-r border-b border-gray-900"
                : index === 1
                ? "border-r border-b border-gray-900"
                : index === 2
                ? "border-r border-gray-900"
                : "border-r border-gray-900"
            }`}
          >
            {chart && height && width && pumpswapCandles[chart.mint] ? (
              <>
                <Chart
                  key={chart.mint}
                  ca={chart.mint}
                  pool={chart?.pool}
                  height={height}
                  width={width}
                  data={tokenInfo[chart.mint]}
                  trackedTrades={trackedTrades}
                  trackedPositions={trackedPositions}
                  solPrice={solPrice}
                  trackedHolders={trackedHolders}
                  openPositions={openPositions}
                  runBumps={runBumps}
                  apiKey={apiKey}
                  traderWallet={traderWallet}
                  activeTab={activeTab}
                  tokenInfo={tokenInfo}
                  trackedPoolTrades={trackedPoolTrades}
                  pumpswapCandles={pumpswapCandles}
                />
                <ActionBar
                  chart={chart}
                  index={index}
                  deleteChart={deleteChart}
                  setRunBumps={setRunBumps}
                  runBumps={runBumps}
                  mint={chart.mint}
                  traderWallet={traderWallet}
                  setOpenPositions={setOpenPositions}
                  setKolTrades={setKolTrades}
                  apiKey={apiKey}
                  openPositions={openPositions}
                  trackedPoolTrades={trackedPoolTrades}
                  solPrice={solPrice}
                  setSolBalance={setSolBalance}
                  setActiveTab={setActiveTab}
                />
              </>
            ) : (
              <span className="text-gray-800 text-sm w-full h-full flex justify-center items-center gap-2 select-none">
                <VscGraphLine /> No Chart
              </span>
            )}
          </div>
        ))}
    </div>
  );
};
export default ChartsView;

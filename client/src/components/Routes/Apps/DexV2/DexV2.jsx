import { useRef, useEffect, useState } from "react";
import Feeds from "./Feeds/Feeds";
import { createSocket } from "./createSocket";
import { useContext } from "react";
import { AuthContext } from "../../../../utils/AuthProvider";
import Chart from "./Chart/Chart";
import Tradepanel from "./Tradepanel/Tradepanel";
import Orderbook from "./Orderbook/Orderbook";

const DexV2 = () => {
  const { user } = useContext(AuthContext);
  const socketRef = useRef();
  const [newTokenMints, setNewTokenMints] = useState([]);
  const [newPools, setNewPools] = useState([]);
  const [trackedHolders, setTrackedHolders] = useState({}); // Mint => Holders/Last trade
  const [trackedPoolTrades, setTrackedPoolTrades] = useState({}); // Pool => Holders/Last trade
  const [solPrice, setSolPrice] = useState(0);
  const [migratedMints, setMigratedMints] = useState([]);
  const [kolTrades, setKolTrades] = useState([]);
  const [traderWallet, setTraderWallet] = useState(""); // Trader
  const [apiKey, setApiKey] = useState("");
  const [currentTrade, setCurrentTrade] = useState(null);

  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;

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
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, [user]);

  // Get SOL price every 60 sec
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

  const handleTokenCreation = (payload) => {
    setNewTokenMints((prev) => {
      const exists = prev.some((item) => item.mint === payload.mint);
      if (exists) return prev;

      const updated = [payload, ...prev];
      return updated.slice(0, 75); // Keep only the first 75 items
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
          recipient,
          tokens_received,
          tokens_sold,
          type,
        },
      };

      return newTrackedHolders;
    });
  };

  // Check if new pool should be tracked
  const handleNewPoolCreation = (newPool) => {
    setNewPools((prev) => {
      const exists = prev.some((item) => item.pool === newPool.pool);
      if (exists) return prev;

      const updated = [newPool, ...prev];
      return updated.slice(0, 75); // Keep only the first 75 items
    });
  };

  // Track holders of created pools + kol trade pools
  useEffect(() => {
    if (!newPools.length) return;
    const pools = newPools.map((pool) => pool.pool);
    socketRef.current.emit("updatePools", Object.values(pools));
  }, [newPools]);

  // Track holders of created mints
  useEffect(() => {
    const mintArray = newTokenMints.map((token) => token?.mint);
    if (!mintArray.length) return;
    socketRef.current.emit("updateMints", mintArray);
  }, [newTokenMints]);

  const handleKolTrades = (payload) => {
    // console.log("KOL trade: ", payload);
    setKolTrades((prev) => {
      const updated = [payload, ...prev];
      if (updated.length > 150) {
        updated.pop(); // remove the last (oldest) item
      }
      return updated;
    });
  };

  // Track trades for migrated tokens and add to normal trades state
  const handlePoolTrade = (payload) => {
    const { pool, user, type, base_amount_out, base_amount_in } = payload;

    if (!pool) return;
    setTrackedPoolTrades((prev) => {
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

  const handleTokenMigration = (migration) => {
    console.log("NEW MIGRATION: ", migration);
    setMigratedMints((prev) => [...prev, migration.mint]);
  };

  // Init websocket
  useEffect(() => {
    const socket = createSocket(); // Create only one socket connection
    socketRef.current = socket;

    // Attach all event listeners
    socket.on("tokenCreation", handleTokenCreation);
    socket.on("tokenTrades", handleTokenTrades);
    socket.on("poolTrade", handlePoolTrade);
    socket.on("poolCreation", handleNewPoolCreation);
    socket.on("kolTrades", handleKolTrades);
    socket.on("kolPoolTrade", handleKolTrades);
    socket.on("tokenMigration", handleTokenMigration);
    return () => {
      // Clean up all listeners and disconnect
      socket.off("tokenCreation", handleTokenCreation);
      socket.off("tokenTrades", handleTokenTrades);
      socket.off("poolTrade", handlePoolTrade);
      socket.off("poolCreation", handleNewPoolCreation);
      socket.off("kolTrades", handleKolTrades);
      socket.off("kolPoolTrade", handleKolTrades);
      socket.off("tokenMigration", handleTokenMigration);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex h-full">
      <Feeds
        newTokenMints={newTokenMints}
        trackedHolders={trackedHolders}
        solPrice={solPrice}
        newPools={newPools}
        apiKey={apiKey}
        kolTrades={kolTrades}
        trackedPoolTrades={trackedPoolTrades}
        migratedMints={migratedMints}
        setCurrentTrade={setCurrentTrade}
      />
      <div className="flex flex-col flex-1">
        <Chart
          currentTrade={currentTrade}
          apiKey={apiKey}
          solPrice={solPrice}
        />
        <Orderbook
          currentTrade={currentTrade}
          trackedHolders={trackedHolders}
        />
      </div>
      <Tradepanel />
    </div>
  );
};

export default DexV2;

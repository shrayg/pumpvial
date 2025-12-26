import { useState, useEffect, useContext, useRef } from "react";
import { HiCog8Tooth } from "react-icons/hi2";
import { IoIosRocket } from "react-icons/io";
import Setup from "./Setup/Setup";
import Trade from "./Trade/Trade";
import { AuthContext } from "../../../../utils/AuthProvider";
import supabase from "../../../../utils/supabase";
import Toast from "./Toast";
import { createSocket } from "./Trade/createSocket";
import { getPumpPoolPdaString } from "../../../../utils/functions";

const BUNDLE_FORM = "bundler-form";
const BUNDLE_WALLETS = "bundler-wallets";

const trackedHoldersDefault = {
  holders: {},
  createdAt: null,
  lastTrade: {},
};

const walletsDefault = {
  funder: "",
  developer: "",
  bundle: [],
  buyAmounts: {},
};

const formDefault = {
  name: "",
  symbol: "",
  description: "",
  twitter: "",
  telegram: "",
  website: "",
  image: null,
  banner: null,
  walletsSaved: false,
  imageUri: "",
  bannerUri: "",
  metadata: null,
  lut: "",
  vanity: "",
  mintPub: "",
  mintPriv: "",
  creationTime: null,
  solSpend: 0,
  tokenHoldings: 0,
  fullstacked: false,
  curveAddress: "",
  platform: "Pump",
};

const Bundler = () => {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("Setup");
  const poolSocketRef = useRef(null);
  const [solPrice, setSolPrice] = useState(0);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [refetchBalances, setRefetchBalances] = useState(false);
  const [trackedHolders, setTrackedHolders] = useState(trackedHoldersDefault);
  const [wallets, setWallets] = useState(walletsDefault);
  const [form, setForm] = useState(formDefault);
  const ca = form.mintPub;

  // Get SOL price every 60 sec
  useEffect(() => {
    const solFetcher = async () => {
      try {
        // SOL VS USD
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

  // Load user
  useEffect(() => {
    if (userData || !user) return;
    // Function to fetch user data based on username
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", user);

        if (error) throw new Error(error);
        setUserData(data[0]);
      } catch (err) {
        console.error(err);
        alert(err);
      }
    };

    fetchUserData();
  }, [user]);

  // Load from localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem(BUNDLE_FORM);
    if (savedForm) {
      try {
        setForm((prev) => ({ ...prev, ...JSON.parse(savedForm) }));
      } catch (e) {
        console.error("Failed to parse form", e);
      }
    }
    const savedWallets = localStorage.getItem(BUNDLE_WALLETS);
    if (savedWallets) {
      try {
        setWallets((prev) => ({ ...prev, ...JSON.parse(savedWallets) }));
      } catch (e) {
        console.error("Failed to parse wallets", e);
      }
    }
    setStorageLoaded(true);
  }, []);

  // Save only after loading from localStorage
  useEffect(() => {
    // if (!storageLoaded) return;
    const cleanForm = { ...form };
    delete cleanForm.image;
    localStorage.setItem(BUNDLE_FORM, JSON.stringify(cleanForm));
    localStorage.setItem(BUNDLE_WALLETS, JSON.stringify(wallets));
  }, [form, wallets, storageLoaded]);

  // Listen for deployment
  const handleTokenCreation = (creation) => {
    if (creation.mint === ca) {
      setForm((prev) => ({ ...prev, creationTime: creation.timestamp }));
      setActiveTab("Trade");
    }
  };

  const handlePoolTrade = (payload) => {
    const {
      user,
      type,
      base_amount_out,
      base_amount_in,
      pool_quote_token_reserves: virtual_sol_reserves,
      pool_base_token_reserves: virtual_token_reserves,
    } = payload;

    setTrackedHolders((prev) => {
      const holdersMap = new Map(Object.entries(prev?.holders || {}));
      const currentBalance = holdersMap.get(user) || 0;
      let updatedBalance = Number(currentBalance);

      if (type === "Buy" && base_amount_out) {
        updatedBalance += base_amount_out;
      } else if (type === "Sell" && base_amount_in) {
        updatedBalance -= base_amount_in;
        if (updatedBalance < 10) updatedBalance = 0;
      }

      holdersMap.set(user, updatedBalance);

      return {
        holders: Object.fromEntries(holdersMap),
        createdAt: prev?.createdAt || Date.now(),
        lastTrade: {
          virtual_sol_reserves,
          virtual_token_reserves,
          user,
          type,
          base_amount_out,
          base_amount_in,
        },
      };
    });
  };

  const handleTokenTrades = (payload) => {
    const {
      recipient,
      type,
      tokens_received,
      tokens_sold,
      virtual_sol_reserves,
      virtual_token_reserves,
      real_sol_reserves,
    } = payload;
    setTrackedHolders((prev) => {
      const holdersMap = new Map(Object.entries(prev?.holders || {}));
      const currentBalance = holdersMap.get(recipient) || 0;
      let updatedBalance = currentBalance;

      if (type === "Buy" && tokens_received) {
        updatedBalance += tokens_received;
      } else if (type === "Sell" && tokens_sold) {
        updatedBalance -= tokens_sold;
        if (updatedBalance < 10) updatedBalance = 0;
      }

      holdersMap.set(recipient, updatedBalance);

      return {
        holders: Object.fromEntries(holdersMap),
        createdAt: prev?.createdAt || Date.now(),
        lastTrade: {
          virtual_sol_reserves,
          virtual_token_reserves,
          real_sol_reserves,
          recipient,
          type,
          tokens_received,
          tokens_sold,
        },
      };
    });
  };

  useEffect(() => {
    if (!ca) return;
    const socket = createSocket(); // Create only one socket connection
    poolSocketRef.current = socket;

    const pool = getPumpPoolPdaString(ca);
    poolSocketRef.current.emit("updatePools", pool);
    poolSocketRef.current.emit("updateMints", [ca]);

    // Attach all event listeners
    socket.on("poolTrade", handlePoolTrade);
    socket.on("tokenCreation", handleTokenCreation);
    socket.on("tokenTrades", handleTokenTrades);

    return () => {
      // Clean up all listeners and disconnect
      socket.off("poolTrade", handlePoolTrade);
      socket.off("tokenCreation", handleTokenCreation);
      socket.off("tokenTrades", handleTokenTrades);
      socket.disconnect();
    };
  }, [ca]);

  const restartApp = () => {
    // Clear storages
    localStorage.removeItem(BUNDLE_FORM);
    localStorage.removeItem(BUNDLE_WALLETS);
    setTrackedHolders(trackedHoldersDefault);
    setWallets(walletsDefault);
    setForm(formDefault);
  };

  return (
    <div className="flex flex-col h-full relative">
      <Toast />
      <div className="flex w-full h-full opacity-100 xl:hidden justify-center items-center text-[12px] text-gray-500 absolute inset-0">
        <span>PumpAgent Launch Bundler is only availabe on desktop.</span>
      </div>
      <div className=" text-gray-600 text-[14px] hidden xl:flex border-b border-b-gray-900">
        <button
          className={`flex w-1/2 gap-1 justify-center items-center p-2 cursor-pointer ${
            activeTab === "Setup"
              ? "bg-[#3337] hover:bg-[#3337] text-gray-400"
              : "hover:bg-[#050505]"
          }`}
          onClick={() => setActiveTab("Setup")}
        >
          <HiCog8Tooth className="text-[12px]" /> Setup
        </button>
        <button
          className={`flex w-1/2 justify-center items-center p-2 cursor-pointer gap-1 ${
            activeTab === "Trade"
              ? "bg-[#3337] hover:bg-[#3337] text-gray-400"
              : "hover:bg-[#050505]"
          }`}
          onClick={() => setActiveTab("Trade")}
        >
          <IoIosRocket className="text-[12px]" /> Trade
        </button>
      </div>
      {activeTab === "Setup" && (
        <Setup
          form={form}
          setForm={setForm}
          wallets={wallets}
          setWallets={setWallets}
          userData={userData}
          restartApp={restartApp}
        />
      )}
      {activeTab === "Trade" && (
        <Trade
          userData={userData}
          form={form}
          wallets={wallets}
          trackedHolders={trackedHolders}
          solPrice={solPrice}
          ca={ca}
          refetchBalances={refetchBalances}
          setRefetchBalances={setRefetchBalances}
          setForm={setForm}
        />
      )}
    </div>
  );
};

export default Bundler;

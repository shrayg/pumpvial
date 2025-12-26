import { IoClose, IoRocket } from "react-icons/io5";
import { BsLightningChargeFill } from "react-icons/bs";
import { FaCog } from "react-icons/fa";
import { useContext, useEffect, useRef, useState } from "react";
import SOL from "../../../../../assets/SOL.png";
import { AuthContext } from "../../../../../utils/AuthProvider";
import {
  calculateMarketcap,
  getSolBalanceDifference,
} from "../../../../../utils/functions";

const LOCAL_STORAGE_KEY = "bumpSettings";

const ActionBar = ({
  chart,
  index,
  deleteChart,
  setRunBumps,
  runBumps,
  mint,
  traderWallet,
  setOpenPositions,
  setKolTrades,
  apiKey,
  trackedPoolTrades,
  solPrice,
  setSolBalance,
  setActiveTab,
}) => {
  const { user } = useContext(AuthContext);
  const [showBumpMenu, setShowBumpMenu] = useState(false);
  const bumpMenuRef = useRef(null);
  const [buying, setBuying] = useState(false);

  const [bumpSettings, setBumpSettings] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          solin: 0.022,
          interval: 7500,
        };
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bumpSettings));
  }, [bumpSettings]);

  const setBumpAmount = (val) =>
    setBumpSettings((prev) => ({ ...prev, solin: val }));
  const setBumpInterval = (val) =>
    setBumpSettings((prev) => ({ ...prev, interval: val * 1000 }));

  const bumpAmount = bumpSettings.solin;
  const bumpInterval = bumpSettings.interval / 1000;

  const activateBumps = runBumps[mint]; // Boolean if bump is toggled

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        bumpMenuRef.current &&
        !bumpMenuRef.current.contains(e.target) &&
        !e.target.closest(".cog-button")
      ) {
        setShowBumpMenu(false);
      }
    };

    if (showBumpMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBumpMenu]);

  if (!chart) return null;

  const handleBuy = async () => {
    setBuying(true);
    const solIn = +localStorage.getItem("quickBuyAmountCharts");
    if (!solIn) return;

    const ca = mint;
    const swapSetting = JSON.parse(localStorage.getItem("swapSettings"));
    const retryEnabled = swapSetting.autoRetry;
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second
    const startTime = performance.now();
    const migrated = trackedPoolTrades[ca];
    const jitoTip = Math.floor(Number(swapSetting.jitoTip) * 1e9);

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
          jitoTip,
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
          (response.real_sol_reserves / 1e9).toFixed(2)
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
        message: `${user} bought ${response.tokens} tokens for ${solIn} SOL`,
      };

      setKolTrades((prev) => [userKolEntry, ...prev]);

      const solSpend = await getSolBalanceDifference(
        response.txResult.txid,
        traderWallet
      );
      setSolBalance((prev) => prev + solSpend);
    } catch (err) {
      console.error("All buy attempts failed.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="flex h-[40px] mt-auto justify-between items-center z-1000 bg-black">
      <button
        className="z-10 text-gray-700 text-[24px] bg-[#33333322] cursor-pointer hover:text-gray-500 hover:bg-[#33333383] p-0.5 h-full w-10 flex justify-center items-center"
        onClick={() => {
          setActiveTab(null);
          deleteChart(index, chart);
        }}
      >
        <IoClose />
      </button>
      <div className="flex h-full">
        <div className="flex h-full ml-2">
          <button
            className={`flex gap-1 min-w-[72px] max-w-[72px] h-full justify-center items-center p-1 px-4  border border-[#00e12d11] text-[#555] hover:text-white cursor-pointer hover:bg-[#00e12d8c] flex-1 ${
              buying ? "gradbtn text-[12px]" : "bg-[#00e12d11] text-[12px]"
            }`}
            onClick={handleBuy}
            disabled={buying ? true : false}
          >
            <BsLightningChargeFill />
            <span>{!buying ? "BUY" : ""}</span>
          </button>
        </div>

        {!trackedPoolTrades[mint] && (
          <button
            className={`relative flex gap-1 h-full justify-center items-center pl-2 w-[100px] ${
              activateBumps ? "gradbtnsmall" : "bg-[#00e12d11]"
            }  border border-[#00e12d11] hover:text-white text-[#555] cursor-pointer hover:bg-[#00e12d8c] text-[12px]`}
            onClick={() =>
              setRunBumps((prev) => ({
                ...prev,
                [chart.mint]: !prev[chart.mint],
              }))
            }
          >
            <div className="flex gap-1.5 px-1 pr-1.5">
              <IoRocket className={`${activateBumps ? "rocket" : ""}`} /> BUMP
              {activateBumps && "ING"}
            </div>
            {!activateBumps && (
              <div
                className="border-l border-[#00e12d11] h-full flex justify-center items-center px-1.5 hover:bg-[#2121218c] cog-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBumpMenu((prev) => !prev);
                }}
              >
                <FaCog />
              </div>
            )}

            {showBumpMenu && (
              <div
                ref={bumpMenuRef}
                className="absolute w-[179px] bottom-8.75 right-0 flex flex-col bg-[#111] rounded-tl-md border-l border-t border-gray-700 p-3 gap-2 z-50 justify-evenly"
              >
                <div className="flex flex-col justify-start items-start gap-2">
                  <span className="text-[11px] text-white">Bump Amount</span>
                  <div className="w-full flex relative">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-3 h-3 absolute top-[4.5px] left-[3px]"
                    />{" "}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter SOL bump amount"
                      value={bumpAmount}
                      onChange={(e) => setBumpAmount(e.target.value)}
                      className="border-gray-700 border p-0.5 rounded-sm text-[10px] w-full py-1 pl-4 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] text-white bg-black"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-start items-start gap-2">
                  <span className="text-[11px] text-white">Bump Interval</span>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="0.5"
                    value={bumpInterval}
                    onChange={(e) =>
                      setBumpInterval(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">
                    {bumpInterval.toFixed(1)} seconds
                  </div>
                </div>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionBar;

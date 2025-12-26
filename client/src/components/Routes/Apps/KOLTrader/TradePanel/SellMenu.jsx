import { useEffect, useState } from "react";
import { FaCog } from "react-icons/fa";
import { BsLightningChargeFill } from "react-icons/bs";
import { IoRocket } from "react-icons/io5";
import { getSolBalanceDifference } from "../../../../../utils/functions";
import { useContext } from "react";
import { AuthContext } from "../../../../../utils/AuthProvider";
import SwapSettings from "./SwapSettings";

const SellMenu = ({
  activeTab,
  trackedHolders,
  openPositions,
  setOpenPositions,
  setKolTrades,
  traderWallet,
  apiKey,
  setSolBalance,
  trackedPoolTrades,
  showSwapsettings,
  setShowSwapsettings,
}) => {
  const { user } = useContext(AuthContext);
  const [tradeLoad, setTradeLoad] = useState(false);
  const [selected, setSelected] = useState(100);
  const [salePrice, setSalePrice] = useState(null);
  const activeMint = activeTab?.mint;
  const lastTrade =
    trackedPoolTrades[activeMint]?.lastTrade ||
    trackedHolders[activeMint]?.lastTrade;

  const heldTokenAmount =
    openPositions.find((t) => t.mint === activeMint)?.tokens || 0;

  const sellPrice =
    lastTrade?.virtual_sol_reserves && lastTrade?.virtual_token_reserves
      ? (Number(heldTokenAmount * (selected / 100)) *
          (lastTrade.virtual_sol_reserves / lastTrade.virtual_token_reserves)) /
        10
      : 0;

  useEffect(() => {
    if (!activeMint || salePrice) return;

    const getCurve = async () => {
      try {
        const request = await fetch(
          "https://api.pumpagent.com/pump-token-info",
          {
            method: "POST",
            body: JSON.stringify({
              ca: activeMint,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const { response } = await request.json();

        const sellPriceRaw =
          response?.virtual_sol_reserves && response?.virtual_token_reserves
            ? (Number(heldTokenAmount * (selected / 100)) *
                (response.virtual_sol_reserves /
                  response.virtual_token_reserves)) /
              1000
            : 0;
        const sellPrice = isNaN(sellPriceRaw) ? 0 : sellPriceRaw;
        setSalePrice(sellPrice);
      } catch (err) {
        console.error(err);
      }
    };

    getCurve();
  }, [activeMint, openPositions, selected, salePrice]);

  const handleClosePosition = async () => {
    const ca = activeMint;
    const recipient = traderWallet;
    const tokenAmount = (heldTokenAmount * selected) / 100;

    const swapSetting = JSON.parse(localStorage.getItem("swapSettings"));
    const prioFee = swapSetting.prioFee;
    const entry = openPositions.find((t) => t.mint === activeMint);
    const migrated = entry?.migrated;
    const jitoTip = Math.floor(Number(swapSetting.jitoTip) * 1e9);

    const sellUrl = migrated
      ? "https://api.pumpagent.com/koltrader-dex-sell"
      : "https://api.pumpagent.com/koltrader-sell";

    if (!ca || !recipient || !tokenAmount) return;
    setTradeLoad(true);
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        const start = performance.now(); // measure time start

        const request = await fetch(sellUrl, {
          method: "POST",
          body: JSON.stringify({
            ca,
            recipient,
            tokenAmount,
            prioFee,
            coinData: entry,
            slippage: swapSetting.slippage,
            jitoTip,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        const response = await request.json();

        if (response.txResult?.mint) {
          setOpenPositions(response.remainingTrades);
          response.txResult.kol = user;
          response.txResult.kol_twitter = "";
          setKolTrades((prev) => [response.txResult, ...prev]);
          setTradeLoad(false);
          // const solSpend = await getSolBalanceDifference(
          //   response.txResult.txid,
          //   traderWallet
          // );
          // setSolBalance((prev) => prev + solSpend);
          return; // Exit after successful sell
        } else {
          throw new Error("Invalid sell response");
        }
      } catch (err) {
        console.error(`Attempt ${attempt + 1} failed:`, err);
        if (attempt === maxRetries) {
          console.error("Sell failed after 3 attempts");
        }
        setTradeLoad(false);
      }
      attempt++;
    }
  };

  return (
    <>
      {showSwapsettings && (
        <SwapSettings setShowSwapsettings={setShowSwapsettings} />
      )}
      {!showSwapsettings && (
        <div className="">
          <div className="flex flex-col p-3 pb-0 gap-0 h-full justify-start max-h-[238px]">
            <div className="flex text-[12px] flex-col justify-start select-none min-h-[167px] relative bottom-[-4px]">
              <div className="flex flex-col justify-start items-center">
                <span className="text-gray-600">Balance</span>
                <span className="text-white">
                  {Math.floor(heldTokenAmount / 1e6)}{" "}
                  <span className="text-greener">{activeTab?.symbol}</span>
                </span>
              </div>
              <div className="flex w-full h-full gap-2 mt-4 text-greener">
                {[25, 50, 100].map((percent) => (
                  <div
                    key={percent}
                    className={`w-1/3 border h-12 rounded-md flex justify-center items-center cursor-pointer hover:bg-[#111] ${
                      selected === percent
                        ? "border-green-700 bg-[#121212]"
                        : "border-gray-800"
                    }`}
                    onClick={() => setSelected(percent)}
                  >
                    <BsLightningChargeFill className="mr-1 text-[10px]" />{" "}
                    {percent}%
                  </div>
                ))}
              </div>
              <div className="flex text-gray-700 gradreversed h-full flex-1 justify-center items-center mt-1 mb-[-10px] mx-[-10px]">
                SOL OUT{" "}
                <span className="text-white ml-2">
                  {(sellPrice / 1e9 || salePrice / 1e9)?.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="py-3 mt-0.5">
              <div
                className="flex p-2 text-[12px] text-gray-600 gap-2 items-center border-b group border-gray-800 py-3 cursor-pointer"
                onClick={() => setShowSwapsettings(true)}
              >
                <FaCog className="text-[16px]" />{" "}
                <span className="cursor-pointer group-hover:text-white font-lighter select-none">
                  Swap Settings
                </span>
              </div>
            </div>
          </div>
          {/* Trade CTA */}
          <div className={`w-full px-1 flex py-2 mb-1`}>
            <button
              className={`text-[14px]  p-3 min-h-[42px] max-h-[42px] rounded-full flex-1 flex justify-center items-center gap-1 mx-2 text-white text-shadow-emerald-950 ${
                tradeLoad
                  ? "gradbtn cursor-not-allowed"
                  : "buycta cursor-pointer"
              }`}
              onClick={handleClosePosition}
              disabled={tradeLoad ? true : false}
            >
              {!tradeLoad && (
                <>
                  <BsLightningChargeFill className="text-greener text-[16px]" />
                  {"QUICK SELL"}
                </>
              )}
              {tradeLoad && (
                <>
                  <IoRocket
                    className={`text-greener ${tradeLoad ? "rocket" : ""}`}
                  />
                  <span className="text-white">Sending</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SellMenu;

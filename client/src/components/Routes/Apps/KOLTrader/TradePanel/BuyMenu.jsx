import { useState, useEffect, useContext } from "react";
import { FaCog } from "react-icons/fa";
import SOL from "../../../../../assets/SOL.png";
import { FaPlus } from "react-icons/fa";
import { MdManageSearch } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";

import { IoRocket } from "react-icons/io5";
import { AuthContext } from "../../../../../utils/AuthProvider";
import SwapSettings from "./SwapSettings";
import { getSolBalanceDifference } from "../../../../../utils/functions";
import { useNavigate } from "react-router-dom";
const BuyMenu = ({
  setOverlay,
  cachedInput,
  setCachedInput,
  customInput,
  setCustomInput,
  cacheSelected,
  setCacheSelected,
  activeButton,
  setActiveButton,
  solBalance,
  tradeDirection,
  activeTab,
  traderWallet,
  apiKey,
  setOpenPositions,
  setKolTrades,
  trackedPoolTrades,
  setSolBalance,
  solPrice,
  showSwapsettings,
  setShowSwapsettings,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tradeLoad, setTradeLoad] = useState(false);
  const [buyMenuDisplay, setBuyMenuDisplay] = useState("Manual");

  const [quickBuyAmountTerminal, setQuickBuyAmountTerminal] = useState(
    localStorage.getItem("quickBuyAmountTerminal") || ""
  );
  const [quickBuyAmountCharts, setQuickBuyAmountCharts] = useState(
    localStorage.getItem("quickBuyAmountCharts") || ""
  );

  useEffect(() => {
    if (
      localStorage.getItem("quickBuyAmountTerminal") !== quickBuyAmountTerminal
    ) {
      localStorage.setItem("quickBuyAmountTerminal", quickBuyAmountTerminal);
    }
    if (localStorage.getItem("quickBuyAmountCharts") !== quickBuyAmountCharts) {
      localStorage.setItem("quickBuyAmountCharts", quickBuyAmountCharts);
    }
    if (localStorage.getItem("cachedInput") !== cachedInput) {
      localStorage.setItem("cachedInput", cachedInput);
    }
  }, [quickBuyAmountTerminal, quickBuyAmountCharts, cachedInput]);

  const sufficientFunds = cacheSelected
    ? solBalance > +cachedInput
    : customInput
    ? solBalance > +customInput
    : solBalance > +activeButton;

  const cachedAmount = cacheSelected ? cachedInput : "";
  const buyAmount = customInput || customInput || cachedAmount;

  const handleQuickBuy = async () => {
    if (!user) {
      localStorage.setItem("redirect", "/dex");
      navigate("/signin");
      return;
    }

    if (!activeTab) return;
    const solIn = activeButton?.toString() || customInput || cachedInput;
    if (!solIn) return;

    const ca = activeTab.mint;
    const swapSetting = JSON.parse(localStorage.getItem("swapSettings"));
    const retryEnabled = swapSetting.autoRetry;
    const jitoTip = Math.floor(Number(swapSetting.jitoTip) * 1e9);
    const migrated = trackedPoolTrades[ca] || activeTab.migrated;

    const buyUrl = migrated
      ? "https://api.pumpagent.com/koltrader-dex-buy"
      : "https://api.pumpagent.com/koltrader-buy";

    setTradeLoad(true);
    const startTime = performance.now();

    const maxRetries = retryEnabled ? 2 : 0; // 2 retries = 2 total attempts
    let attempt = 0;
    try {
      while (attempt <= maxRetries) {
        try {
          const request = await fetch(buyUrl, {
            method: "POST",
            body: JSON.stringify({
              ca,
              solIn,
              prioFee: swapSetting.prioFee,
              recipient: traderWallet,
              slippage: swapSetting.slippage,
              coinData: activeTab,
              solPrice,
              jitoTip,
            }),
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
          });

          const response = await request.json();
          if (!response.txResult?.tokens)
            throw new Error("No tokens received in response");

          setOpenPositions(response.remainingTrades);
          // Update localstorage cache

          const userKolEntry = {
            mint: ca,
            type: "Buy",
            virtual_sol_reserves: response.txResult.virtual_sol_reserves,
            virtual_token_reserves: response.txResult.virtual_token_reserves,
            marketCap: response.txResult.marketCap,
            timestamp: Date.now() / 1000,
            sol_buy: Number(solIn) * 1e9,
            tokens_received: response.txResult.tokens,
            kol: user,
            kol_twitter: "",
            entry: Date.now(),
          };

          setKolTrades((prev) => [userKolEntry, ...prev]);
          const solSpend = await getSolBalanceDifference(
            response.txResult.txid,
            traderWallet
          );
          setSolBalance((prev) => prev - solSpend);

          break; // success, exit the loop
        } catch (err) {
          attempt++;
          const endTime = performance.now();
          console.warn(
            `Attempt ${attempt} failed after ${(endTime - startTime).toFixed(
              2
            )} ms`
          );

          if (attempt > maxRetries) {
            console.error("All attempts failed:", err);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTradeLoad(false);
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem("swapSettings");
    if (savedSettings) return;

    const defaultSettings = {
      prioFee: "High",
      slippage: 15,
      autoRetry: true,
      jitoTip: "0.00002",
    };
    localStorage.setItem("swapSettings", JSON.stringify(defaultSettings));
  }, []);

  return (
    <div className="">
      {showSwapsettings && (
        <SwapSettings setShowSwapsettings={setShowSwapsettings} />
      )}
      {!showSwapsettings && (
        <div className="flex flex-col p-3 pb-0 gap-2 h-full">
          <div className="flex text-[12px] justify-evenly select-none ">
            {["Manual", "Quick Buy", "Scalp", "Strategy"].map((option) => (
              <button
                key={option}
                className={`${
                  option === "Scalp" || option === "Strategy"
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                } flex justify-center items-center gap-1`}
                onClick={() => setBuyMenuDisplay(option)}
                disabled={
                  option === "Scalp" || option === "Strategy" ? true : false
                }
              >
                <div className="border border-[#6f6f6f] rounded-full p-0.5">
                  <div
                    className={`w-2.5 h-2.5 ${
                      buyMenuDisplay === option ? "bg-[#32fb00]" : ""
                    } rounded-full`}
                  ></div>
                </div>
                <span
                  className={`${
                    buyMenuDisplay === option
                      ? "text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {option}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col min-h-[142px]">
            {buyMenuDisplay === "Manual" && (
              <>
                <div
                  className="text-white flex-wrap w-full justify-between pt-2 font-bold text-[12px] flex gap-1 cursor-pointer"
                  onClick={() => {
                    setCacheSelected(false);
                  }}
                >
                  <div
                    className="flex relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCacheSelected(true);
                      setActiveButton(null);
                    }}
                  >
                    <div className="p-2  absolute  top-0.5 left-0 w-9 pl-3.5 rounded-l-full">
                      <img
                        src={SOL}
                        alt="SOL"
                        className="min-w-5 min-h-5 cursor-pointer select-none"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="0.25"
                      className={`border border-gray-700 p-1.75 rounded-full flex justify-start pl-10.5 items-center placeholder:text-gray-700 gap-1 w-[105px] h-[40px]focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] ${
                        cacheSelected
                          ? "border-green-300 shadow-green-500 bg-[#23ff4011]"
                          : "hover:outline-1 hover:outline-gray-400"
                      }`}
                      value={cachedInput}
                      onChange={(e) => {
                        e.stopPropagation();
                        setCachedInput("");
                        setCachedInput(e.target.value);
                      }}
                    />
                  </div>
                  {[0.5, 1, 2, 5, 10].map((amount) => (
                    <button
                      key={amount}
                      className={`border border-gray-700 p-1.75 rounded-full w-[32%] h-[40px] flex justify-start pl-4 items-center gap-1 cursor-pointer  ${
                        activeButton === amount
                          ? "border-green-300 shadow-green-500 bg-[#23ff4011]"
                          : "hover:outline-1 hover:outline-gray-400"
                      } ${amount > 1 ? "mt-1.5" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCacheSelected(false);
                        setActiveButton(amount);
                      }}
                    >
                      <img src={SOL} alt="SOL" className="w-5 h-5" /> {amount}
                    </button>
                  ))}
                </div>
                <div className="w-full flex relative mt-2">
                  <img
                    src={SOL}
                    alt="Solana"
                    className="w-5.5 h-5.5 absolute top-2 left-2"
                  />
                  <input
                    type="number"
                    placeholder="Enter SOL Amount"
                    className="border border-gray-700 w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5"
                    onClick={() => {
                      setActiveButton("");
                      setCacheSelected(false);
                    }}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                </div>
              </>
            )}
            {buyMenuDisplay === "Quick Buy" && (
              <div className="flex flex-col min-h-[136px] justify-between py-2 my-1">
                <div className="flex justify-center items-center flex-col gap-1 mb-2">
                  <span className="text-gray-400 text-[12px]">
                    Quick Buy Amount For Terminal
                  </span>
                  <div className="w-full flex relative">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5.5 h-5.5 absolute top-2 left-2"
                    />
                    <input
                      type="number"
                      placeholder="Enter SOL Amount"
                      className="border border-gray-700 w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5"
                      value={quickBuyAmountTerminal}
                      onChange={(e) =>
                        setQuickBuyAmountTerminal(e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-center items-center flex-col gap-1">
                  <span className="text-gray-400 text-[12px]">
                    Quick Buy Amount For Charts
                  </span>
                  <div className="w-full flex relative">
                    <img
                      src={SOL}
                      alt="Solana"
                      className="w-5.5 h-5.5 absolute top-2 left-2"
                    />
                    <input
                      type="number"
                      placeholder="Enter SOL Amount"
                      className="border border-gray-700 w-full placeholder:text-gray-700 hover:outline-1 pl-8 outline-gray-400 focus:placeholder:text-gray-400 text-[12px] text-white rounded-full h-9 px-2 focus:outline-green-300 focus:outline-1 focus:bg-[#23ff4011] mt-0.5"
                      value={quickBuyAmountCharts}
                      onChange={(e) => setQuickBuyAmountCharts(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            {buyMenuDisplay === "Strategy" && (
              <div className="flex flex-col justify-center  py-1 text-gray-500 text-[12px] gap-4  min-h-[144px] pt-1.5">
                <button
                  className="flex justify-center items-center border border-gray-800 p-3.5 cursor-pointer gap-1 rounded-md hover:bg-[#3333336a] hover:text-white h-[48px]"
                  onClick={() => setOverlay("Create Strategy")}
                >
                  <FaPlus /> Create New Strategy
                </button>
                <button
                  className="flex justify-center items-center border border-gray-800 p-3.5 cursor-pointer gap-1 rounded-md hover:bg-[#3333336a] hover:text-white"
                  onClick={() => setOverlay("Manage Strategy")}
                >
                  <MdManageSearch className="text-[18px]" /> Manage Strategies
                </button>
              </div>
            )}
          </div>
          <div
            className="flex p-2 text-[12px] text-gray-600 gap-2 items-center border-t border-b group border-gray-800 py-3 mt-1 mb-1 cursor-pointer"
            onClick={() => setShowSwapsettings(true)}
          >
            <FaCog className="text-[16px]" />{" "}
            <span className="cursor-pointer group-hover:text-white font-lighter select-none">
              Swap Settings
            </span>
          </div>
        </div>
      )}
      {/* Trade CTA */}
      {!showSwapsettings && (
        <div className={`w-full px-1 flex py-2 mb-1`}>
          <button
            className={`text-[14px]  p-3 min-h-[42px] max-h-[42px] rounded-full flex-1 flex justify-center items-center gap-1 mx-2 text-white text-shadow-emerald-950 cursor-pointer ${
              tradeLoad ? "gradbtn" : "buycta"
            }`}
            onClick={handleQuickBuy}
            style={{
              // opacity: !solBalance ? "0" : "100",
              pointerEvents: user && !solBalance ? "none" : "initial",
            }}
          >
            {!tradeLoad && (
              <>
                {sufficientFunds && (
                  <BsLightningChargeFill className="text-greener text-[16px]" />
                )}
                {!sufficientFunds && !user && "SIGN IN TO TRADE"}
                {!sufficientFunds && user && "INSUFFICIENT FUNDS"}
                {sufficientFunds && (
                  <>
                    {tradeDirection === "BUY" ? "QUICK BUY" : "QUICK SELL"}{" "}
                    {buyAmount}
                    {buyAmount && " SOL"}
                  </>
                )}
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
      )}
    </div>
  );
};

export default BuyMenu;

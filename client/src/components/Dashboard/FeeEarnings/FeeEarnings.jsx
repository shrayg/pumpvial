import { FaRegCopy } from "react-icons/fa";
import { useState } from "react";
import Logo from "../../../assets/Logo.webp";
import { FaExternalLinkAlt } from "react-icons/fa";
import Transactions from "./Transactions";
import { formatBalance } from "../../../utils/functions";
import WithdrawModal from "./WithdrawModal";
import { Helmet } from "react-helmet";

const FeeEarnings = ({
  userData,
  setUserData,
  fundWalletBalance,
  setFundWalletBalance,
}) => {
  const [message, setMessage] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const wallet = userData?.api_key?.split("-").slice(1, -1).join("");
  const notFunded = fundWalletBalance.SOL < 0.0019;
  const URL = `https://solscan.io/account/${wallet}`;

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(wallet);

    setTimeout(() => setCopied(false), 1500);
  };

  const previousSOLEarnings = JSON.parse(userData?.withdrawals || "[]")
    .filter((val) => val.currency === "SOL")
    .reduce((acc, val) => acc + val.amount, 0);

  const previousUSDCEarnings = JSON.parse(userData?.ref_payouts || "[]")
    .filter((val) => val.currency === "USDC")
    .reduce((acc, val) => acc + val.amount, 0);

  const openSolanaWebpage = () =>
    window.open("https://solana.com/docs/core/accounts#rent", "_blank");

  const isMobile = window.innerWidth < 630;

  return (
    <div className="w-full mt-8 md:mt-14 px-4 md:px-10 max-w-[1048px] mb-4">
      <Helmet>
        <title>PumpAgent - Fee Earnings</title>
        <link rel="canonical" href="https://pumpagent.com/dashboard" />
        <meta property="og:title" content="PumpAgent - Fee Earnings" />
        <meta property="og:url" content="https://pumpagent.com/dashboard" />
      </Helmet>
      {notFunded && message && (
        <div className="w-full h-10 border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relativeitems-start px-4 py-4 flex mb-2 justify-between items-center">
          <span className="text-[12px]">
            Deposit a small amount of SOL (for rent) to start earning.{" "}
            <span
              className="text-greener ml-1 cursor-pointer"
              onClick={openSolanaWebpage}
            >
              Learn More
            </span>
          </span>
          <button
            className="text-[14px] cursor-pointer p-2 text-gray-400 hover:text-white transition"
            onClick={() => setMessage(false)}
          >
            x
          </button>
        </div>
      )}
      <div className="w-full h-auto xl:h-70 border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relativeitems-start p-5 md:p-10 py-6 md:py-12  flex flex-col lg:flex-row">
        <div className="flex flex-col gap-4">
          <h2 className="text-[18px] font-lighter text-gray-600">
            Fee Earnings
          </h2>
          <h1 className="text-[36px] text-greener">
            {formatBalance(fundWalletBalance.SOL)} SOL
          </h1>
          <h1 className="text-[36px] leading-2 text-greener">
            {fundWalletBalance.USDC} USD
          </h1>
          <button
            className={`transition mt-10 bg-[#62626232] hover:bg-green-700 hover:text-white dark:text-black dark:hover:text-white z-10  text-[14px] p-2 xl:mt-auto mr-auto cursor-pointer h-[46px] max-h-[46px] w-full xl:w-[240px] flex justify-center items-center`}
            onClick={() => setWithdrawing(!withdrawing)}
          >
            {withdrawing ? "Close" : "Claim Fees"}
          </button>
        </div>

        {withdrawing && (
          <WithdrawModal
            fundWalletBalance={fundWalletBalance}
            userData={userData}
            setFundWalletBalance={setFundWalletBalance}
            setUserData={setUserData}
            setWithdrawing={setWithdrawing}
          />
        )}
        {!withdrawing && (
          <div className="flex-1 lg:border-l border-l-gray-800 mt-4 lg:mt-0 lg:ml-8 lg:pl-8 flex justify-start items-start flex-col">
            <div className="p-3 bg-[#62626232] w-full flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <span className="text-[12px] text-gray-500 dark:text-black flex justify-start items-center gap-2">
                  Fee Wallet{" "}
                  <button
                    className="p-1 ml-[-4px] group cursor-pointer"
                    onClick={() => window.open(URL, "_blank")}
                  >
                    <FaExternalLinkAlt className="text-gray-400 dark:text-black text-[10px] cursor-pointer group-hover:text-white transition" />
                  </button>
                </span>
                <span className="text-[10px] mr-2 xl:text-[14px] dark:text-[#3333339f]">
                  {wallet.slice(0, isMobile ? 18 : wallet.length)}
                  {isMobile ? "..." : ""}
                </span>
              </div>
              <button
                className={`flex justify-center items-center dark:text-black dark:hover:text-black gap-2 text-gray-400 border-1 border-gray-700 cursor-pointer p-2 rounded-xl min-w-[73px] hover:text-white text-[14px] select-none ${
                  copied ? "bg-green-500 text-white" : ""
                }`}
                onClick={handleCopy}
              >
                {!copied && (
                  <>
                    Copy <FaRegCopy />
                  </>
                )}
                {copied && "Copied"}
              </button>
            </div>
            <div className="flex justify-center items-center flex-1 w-full pt-3">
              <div className="w-1/2 h-full border-1 border-gray-800 rounded-xl justify-center items-center gap-2 flex-col relative select-none hidden xl:flex">
                {!notFunded && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 glow "></div>
                    <span className="text-[12px] text-gray-600 text-center">
                      ACTIVELY EARNING
                    </span>
                  </>
                )}
                {notFunded && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 redglow"></div>
                    <span className="text-[12px] text-gray-600 ">
                      EARNINGS INACTIVE
                    </span>
                  </>
                )}
              </div>
              <img
                src={Logo}
                alt="Logo"
                className="w-20 opacity-30 mx-6 hidden xl:flex"
              />
              <div className="w-full xl:w-1/2 h-full border-1 border-gray-800 rounded-xl flex justify-center items-center p-2 gap-2 flex-col">
                <h2 className="text-[24px] text-greener ] text-center">
                  {formatBalance(previousSOLEarnings + fundWalletBalance.SOL)}{" "}
                  SOL
                </h2>
                <h2 className="text-[24px] leading-3 mb-3 text-greener ] text-center">
                  {previousUSDCEarnings + fundWalletBalance.USDC} USD
                </h2>
                <span className="text-[12px] text-gray-600 mt-[-6px] text-center">
                  LIFETIME EARNINGS
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <Transactions userData={userData} />
    </div>
  );
};

export default FeeEarnings;

import { useContext, useState } from "react";
import { AuthContext } from "../../../utils/AuthProvider";
import { FaRegCopy } from "react-icons/fa";
import PayOuts from "./PayOuts";
import { Helmet } from "react-helmet";

const Referrals = ({ userData }) => {
  const [copied, setCopied] = useState(false);
  const { user } = useContext(AuthContext);

  const isAlchemist = userData.tier === "Alchemist";
  const referrals = JSON.parse(userData.referrals);
  const referralPayouts = JSON.parse(userData.ref_payouts);
  const totalUSDPayout =
    referralPayouts.reduce((acc, val) => acc + val?.amount, 0) ?? 0;

  const URL = `https://pumpagent.com?ref=${user}`;

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(URL);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="w-full mt-8 md:mt-14 px-4 md:px-10 mb-4 max-w-[1048px]">
      <Helmet>
        <title>PumpAgent - Referrals</title>
        <link rel="canonical" href="https://pumpagent.com/dashboard" />
        <meta property="og:title" content="PumpAgent - Referrals" />
        <meta property="og:url" content="https://pumpagent.com/dashboard" />
      </Helmet>
      <div className="w-full border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relative p-5 md:p-10 py-2 md:py-12 flex-col md:flex-row flex gap-2  justify-start items-start md:h-[280px]">
        <div className="flex pb-4 md:pb-0 flex-col gap-4 md:w-[232px] h-full pt-4">
          <h2 className="text-[18px] font-lighter text-gray-600">Referrals</h2>
          <h1 className="text-[36px] text-greener">{isAlchemist ? 10 : 5}%</h1>
          <span className="text-[14px] text-gray-600 mt-auto">
            {isAlchemist && "Earn 10% of every user that becomes an Alchemist."}
            {!isAlchemist &&
              "Earn 5% of every user that becomes an Alchemist. Earn 10% as an Alchemist yourself."}
          </span>
        </div>
        <div className="flex- w-full md:border-l h-full border-l-gray-800 md:ml-8 md:pl-8 flex justify-start items-start flex-col pb-4">
          <div className="flex gap-2 bg-[#62626232] w-full p-3">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-gray-500 dark:text-black flex justify-start items-center gap-2">
                Referral Link{" "}
                <button
                  className="p-1 ml-[-4px] group cursor-pointer"
                  onClick={() => window.open(URL, "_blank")}
                ></button>
              </span>
              <span className="text-[10px] dark:text-[#333] sm:text-[14px]">
                {URL}
              </span>
            </div>
            <button
              className={`flex justify-center items-center gap-2 text-gray-400 border-1 border-gray-700 cursor-pointer p-2 rounded-xl min-w-[73px] dark:hover:text-black dark:text-black hover:text-white text-[14px] select-none ml-auto ${
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
          <div className="flex w-full h-full pt-4 gap-4">
            <div className="flex flex-col gap-1 p-4 w-1/2 border border-gray-800 rounded-md justify-center items-center">
              <span className="text-[28px] font-bold text-greener">
                {referrals.length}
              </span>
              <span className="text-[14px] text-gray-600">Referrals</span>
            </div>
            <div className="flex flex-col gap-1 w-1/2 border border-gray-800 rounded-md justify-center items-center">
              <span className="text-[28px] font-bold text-greener">
                ${totalUSDPayout}
              </span>
              <span className="text-[14px] text-gray-600">USDC Earned</span>
            </div>
          </div>
        </div>
      </div>
      <PayOuts userData={userData} />
    </div>
  );
};

export default Referrals;

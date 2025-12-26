import { useState } from "react";
import Logo from "../../../assets/Logo.webp";
import Sollogo from "../../../assets/Sol.png";
import USDClogo from "../../../assets/USDC.png";

import AlchemistUser from "./AlchemistUser";
import Checkout from "./Checkout";
import { Helmet } from "react-helmet";

const Tiers = ({ userData, setUserData }) => {
  const [checkingOut, setCheckingOut] = useState(false);
  const isApprentice = userData?.tier === "Apprentice";
  const [paymentWallet, setPaymentWallet] = useState("");

  return (
    <div className="w-full mt-8 md:mt-14 px-4 md:px-10 max-w-[1048px] mb-4">
      <Helmet>
        <title>PumpAgent - Tiers</title>
        <link rel="canonical" href="https://pumpagent.com/dashboard" />
        <meta property="og:title" content="PumpAgent - Tiers" />
        <meta property="og:url" content="https://pumpagent.com/dashboard" />
      </Helmet>
      {/* Plan modals*/}
      {isApprentice && !checkingOut && (
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="w-full md:w-1/2 border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relative px-4 py-4 flex flex-col gap-2 mb-2 justify-start items-center">
            <span className="text-[28px] text-greener text-center">
              Apprentice
            </span>
            <span className="text-[14px] mb-4 text-gray-500">
              LIFETIME FOR FREE
            </span>

            <div className="flex p-2 w-full md:w-45 h-45 justify-center items-center apprenticeBG rounded-md mt-0 md:mt-4">
              <img
                src={Logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <ul className="text-[12px] w-full md:text-[14px] pt-4 md:pt-8 flex flex-col gap-2 dark:text-black">
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Limit Free Access to All Endpoints
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Reduced Request Limits
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Community Support in Discord
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Claim Fee Earnings at No Additional Cost
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Earn 5% From Referrals
              </li>
            </ul>

            <button className="text-[14px] bg-[#26ff0056] dark:text-black w-full mt-4 md:mt-auto md:w-4/5 py-3 rounded-full h-[40px] opacity-40">
              CURRENT TIER
            </button>
          </div>

          <div className="w-full md:w-1/2 border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relative px-4 py-4 flex flex-col gap-2 justify-start items-center">
            <span className="text-[28px] text-purple-500 text-center">
              Alchemist
            </span>
            <span className="text-[14px] mb-4 text-gray-500">
              LIFETIME FOR $199
            </span>
            <div className="flex p-2 alchemistBG w-full md:w-45 h-45 justify-center items-center rounded-md mt-0 md:mt-4">
              <img
                src={Logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <ul className="text-[12px] w-full md:text-[14px] pt-4 md:pt-8 flex flex-col gap-2 dark:text-black">
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Increased Rate Limits
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4 text-greener">
                30% Reduced PumpAgent Platform Fees
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Alchemist Role + Priority Technical Support in Discord
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Claim Fee Earnings at No Additional Cost
              </li>
              <li className="bg-[#33333381] dark:bg-[#3333331e] p-2 rounded-md px-4">
                Earn 10% From Referrals
              </li>
            </ul>
            <button
              className="text-[14px] bg-purple-600 hover:bg-purple-500 w-full md:w-4/5 mt-4 py-3 rounded-full flex justify-center items-center gap-2 cursor-pointer transition"
              onClick={() => setCheckingOut(true)}
            >
              <img src={USDClogo} alt="Solana" className="w-4" />
              PAY WITH CRYPTO
              <img src={Sollogo} alt="Solana" className="w-4" />
            </button>
          </div>
        </div>
      )}
      {isApprentice && checkingOut && (
        <Checkout
          setCheckingOut={setCheckingOut}
          paymentWallet={paymentWallet}
          setPaymentWallet={setPaymentWallet}
          userData={userData}
          setUserData={setUserData}
        />
      )}
      {/* Is Alchemist*/}
      {!isApprentice && (
        <AlchemistUser userData={userData} setUserData={setUserData} />
      )}
    </div>
  );
};

export default Tiers;

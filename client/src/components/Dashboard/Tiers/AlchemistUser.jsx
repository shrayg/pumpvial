import { useState, useEffect, useRef } from "react";
import { FaHandHoldingMedical } from "react-icons/fa";
import { GiPayMoney } from "react-icons/gi";
import { PiLightningFill } from "react-icons/pi";
import Logo from "../../../assets/Logo.webp";

const AlchemistUser = ({ userData, setUserData }) => {
  const inputRef = useRef();
  const [discordUser, setDiscordUser] = useState(userData?.discord_name || "");
  const [showSave, setShowSave] = useState(false);
  const { api_key } = userData;

  useEffect(() => {
    if (!discordUser) inputRef.current?.focus();
  }, []);

  const proof = JSON.parse(
    localStorage.getItem("sb-ewvqgcnetcqmnlkyjuww-auth-token")
  )?.access_token;

  const updateUserDiscordProfile = async () => {
    setShowSave(false);
    try {
      const request = await fetch(
        "https://api.pumpagent.com/update-discord-profile",
        {
          method: "POST",
          body: JSON.stringify({
            proof,
            discordUser,
          }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api_key,
          },
        }
      );
      const { success } = await request.json();
      if (success)
        setUserData((prev) => ({ ...prev, discord_name: discordUser }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-full border border-gray-800 dark:border-gray-200 bg-tile dark:bg-white dark:hover:bg-[#fff] rounded-md relative p-5 md:p-10 py-6 md:py-12 flex-col md:flex-row flex gap-2 mb-2 justify-start items-start md:h-[280px]">
        <div className="flex flex-col gap-2 w-full md:w-[232px]">
          <span className="text-[18px] text-purple-500">Alchemist</span>

          <div className="flex p-2 alchemistBG rounded-md mt-4">
            <img src={Logo} alt="Logo" className="w-30 h-full" />
          </div>
        </div>
        <div className="flex-1 md:border-l h-full border-l-gray-800 md:ml-4 lg:ml-8 md:pl-4 lg:pl-8 flex justify-start items-start flex-col w-full">
          <div className="p-3 bg-[#62626232] w-full mt-2 md:mt-0 flex justify-between items-center text-[14px]">
            <span className="text-purple-600 select-none">Discord User</span>
            <div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter Discord Username"
                className="h-8 w-32 mr-2 dark:text-black focus:outline-none pl-2 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={discordUser}
                onChange={(e) => {
                  setDiscordUser(e.target.value);
                  setShowSave(true);
                }}
              />
              {showSave && (
                <button
                  className="bg-tile p-2 rounded-md text-gray-500 hover:text-white cursor-pointer"
                  onClick={updateUserDiscordProfile}
                >
                  Save
                </button>
              )}
            </div>
          </div>
          <div className="flex w-full h-full gap-4 pt-4 text-[10px] md:text-[14px] text-gray-600 select-none">
            <div className="w-1/3 border border-gray-800 h-full rounded-lg flex justify-center items-center text-center flex-col p-2 gap-2">
              <FaHandHoldingMedical className="text-[20px] text-greener" />
              <span>10% Discount on Fees</span>
            </div>
            <div className="w-1/3 border border-gray-800 h-full rounded-lg flex justify-center items-center text-center flex-col p-2 gap-2">
              <GiPayMoney className="text-[20px] text-greener scale-x-[-1]" />
              <span>10% Earnings Per Referral</span>
            </div>
            <div className="w-1/3 border border-gray-800 h-full rounded-lg flex justify-center items-center text-center flex-col p-2 gap-2">
              <PiLightningFill className="text-[20px] text-greener" />
              <span>Increased Rate Limits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlchemistUser;

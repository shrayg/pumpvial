import { useState, useEffect } from "react";
import PreviewTab from "./PreviewTab/PreviewTab";
import TokenSetup from "./TokenSetup";
import CreateWallets from "./WalletSetup/CreateWallets";
import Spinner from "../../../../../assets/Spinner.svg";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import Toast from "../Toast";
import { LuTriangleAlert } from "react-icons/lu";

const Setup = ({
  form,
  setForm,
  wallets,
  setWallets,
  userData,
  restartApp,
}) => {
  const [rentReclaimLoading, setRentReclaimLoading] = useState(false);
  const [solReclaimLoading, setSolReclaimLoading] = useState(false);
  const [restart, setRestart] = useState(false);
  const [activeForm, setActiveForm] = useState("Token");
  const [balances, setBalances] = useState([]);
  const [developerBalance, setDeveloperBalance] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!Object.entries(wallets.buyAmounts).filter(Boolean).length) return;

    const totalSolSpend = Object.values(wallets.buyAmounts).reduce(
      (acc, amount) => acc + (Number(amount) || 0),
      0
    );

    setForm((prev) => ({
      ...prev,
      solSpend: totalSolSpend,
    }));
  }, [wallets]);

  const handleReclaimRent = async () => {
    setRentReclaimLoading(true);
    try {
      const recipients = [wallets.developer, ...wallets.bundle];

      const request = await fetch("https://api.pumpagent.com/reclaim-rent", {
        method: "POST",
        body: JSON.stringify({ recipients }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
      });
      const response = await request.json();
      if (response.error) return setMessage("Failed To Claim Rent.");
      setMessage("Rent Claimed Successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setRentReclaimLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleReclaimSol = async () => {
    setSolReclaimLoading(true);
    const recipientKeypair = Keypair.fromSecretKey(bs58.decode(wallets.funder));
    const recipient = recipientKeypair.publicKey.toBase58();
    try {
      const bundle = [wallets.developer, ...wallets.bundle];

      const request = await fetch("https://api.pumpagent.com/reclaim-sol", {
        method: "POST",
        body: JSON.stringify({ recipient, bundle }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userData?.api_key,
        },
      });
      const response = await request.json();
      if (response.error) return setMessage("Failed To Claim SOL.");
      setMessage("Successfully Reclaimed SOL.");
    } catch (err) {
      console.error(err);
    } finally {
      setSolReclaimLoading(false);
    }
  };

  const handleRestart = () => {
    setRestart(true);
  };

  return (
    <div className="h-full hidden xl:flex ">
      {message && <Toast message={message} />}
      <div
        className={`flex  w-full canvasgrad ${
          form.creationTime ? "p-0" : "p-12"
        } flex-col`}
      >
        <div className="flex flex-col flex-1">
          {!form.creationTime && (
            <>
              <div className="flex text-gray-700 text-[14px] max-w-2xl mx-auto w-full border border-gray-800 border-b-transparent rounded-t-lg select-none">
                <button
                  className={`w-1/2 flex justify-center items-center py-3 rounded-tl-lg text-[12px] cursor-pointer ${
                    activeForm === "Token"
                      ? "bg-[#242424] text-white"
                      : "bg-[#111]"
                  }`}
                  onClick={() => setActiveForm("Token")}
                >
                  Manage Token
                </button>
                <button
                  className={`w-1/2 flex justify-center items-center py-3 rounded-tr-lg text-[12px] cursor-pointer ${
                    activeForm === "Wallets"
                      ? "bg-[#333] text-white"
                      : "bg-[#111]"
                  }`}
                  onClick={() => setActiveForm("Wallets")}
                >
                  Manage Wallets
                </button>
              </div>

              {/* Always render both, hide one using styles */}
              <div className={`${activeForm === "Token" ? "block" : "hidden"}`}>
                <TokenSetup form={form} setForm={setForm} userData={userData} />
              </div>
              <div
                className={`${activeForm === "Wallets" ? "block" : "hidden"}`}
              >
                <CreateWallets
                  wallets={wallets}
                  setWallets={setWallets}
                  form={form}
                  setForm={setForm}
                  userData={userData}
                  balances={balances}
                  setBalances={setBalances}
                  developerBalance={developerBalance}
                  setDeveloperBalance={setDeveloperBalance}
                />
              </div>
            </>
          )}
          {form.creationTime && (
            <div className="w-full flex-1 h-full items-center flex justify-center overflow-hidden relative">
              <div className="w-100 h-150 flex flex-col justify-center items-center text-[12px] text-gray-600 pb-15">
                {!restart && (
                  <>
                    <div className="border border-gray-800 flex flex-col gap-1 text-gray-500 p-2 rounded-md w-full relative group">
                      <span className="text-greener">Reclaim Account Rent</span>
                      <p>Burn wallet dust and close accounts to reclaim SOL.</p>
                      <button
                        className="bg-[#111] py-2 mt-2 cursor-pointer hover:text-white hover:bg-[#222] transition rounded-sm flex justify-center items-center h-[32px]"
                        onClick={handleReclaimRent}
                        disabled={rentReclaimLoading ? true : false}
                      >
                        {!rentReclaimLoading && <>Reclaim Rent</>}
                        {rentReclaimLoading && (
                          <img src={Spinner} alt="Spinner" className="w-5" />
                        )}
                      </button>
                      <h2 className="absolute text-greener text-[60px] left-[-50px] opacity-20 pt-1 group-hover:opacity-100">
                        1
                      </h2>
                    </div>

                    <div className="w-[2px] h-5 bg-[#26ff00]"></div>

                    <div className="border border-gray-800 flex flex-col gap-1 text-gray-500 p-2 rounded-md relative group">
                      <span className="text-greener">
                        Claim Leftover SOL from Bundle
                      </span>
                      <p>
                        Transfer the remaining SOL amounts in your bundle
                        wallets back to the funder.
                      </p>
                      <button
                        className="bg-[#111] py-2 mt-2 cursor-pointer hover:text-white hover:bg-[#222] transition rounded-sm h-[32px] flex justify-center items-center"
                        onClick={handleReclaimSol}
                        disabled={solReclaimLoading ? true : false}
                      >
                        {!solReclaimLoading && <>Reclaim SOL</>}
                        {solReclaimLoading && (
                          <img src={Spinner} alt="Spinner" className="w-5" />
                        )}
                      </button>

                      <h2 className="absolute text-greener text-[60px] left-[-50px] opacity-20 pt-1 group-hover:opacity-100">
                        2
                      </h2>
                    </div>

                    <div className="w-[2px] h-5 bg-[#26ff00]"></div>

                    <div className="border border-gray-800 flex flex-col gap-1 text-gray-500 p-2 rounded-md w-full relative group">
                      <span className="text-greener">Restart Bundle</span>
                      <p>Delete all bundle data and restart launch process.</p>
                      <button
                        className="bg-[#111] py-2 mt-2 cursor-pointer hover:text-white hover:bg-[#222] transition rounded-sm h-[32px]"
                        onClick={handleRestart}
                      >
                        Restart Bundle
                      </button>
                      <h2 className="absolute text-greener text-[60px] left-[-50px] opacity-20 pt-1 group-hover:opacity-100">
                        3
                      </h2>
                    </div>
                  </>
                )}
                {restart && (
                  <div className="h-[310px] w-[400px] bg-[#111] rounded-md border border-gray-800 flex justify-center items-center gap-1 flex-col">
                    <span className="flex items-center gap-1 text-white">
                      <LuTriangleAlert className="text-red-500" /> DELETE ALL
                      DATA AND RESTART BUNDLE PROCESS
                    </span>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="bg-[#222] p-2 px-3 border border-gray-800 cursor-pointer hover:text-white hover:bg-[#333]"
                        onClick={() => setRestart(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-[#730000a4] hover:bg-[#730000c2] p-2 px-3 border border-gray-800 text-white cursor-pointer"
                        onClick={restartApp}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <img
                src="/src/assets/Logo.webp"
                alt="Vial"
                className="w-100 absolute left-[-200px] opacity-40"
              />{" "}
            </div>
          )}
        </div>
        <button
          className="text-gray-400 hover:text-white fixed bottom-2 left-2 text-[12px] p-2 bg-[#222] cursor-pointer opacity-60 hover:opacity-100"
          onClick={restartApp}
        >
          Restart
        </button>
      </div>

      <PreviewTab
        form={form}
        setForm={setForm}
        wallets={wallets}
        balances={balances}
        setBalances={setBalances}
        developerBalance={developerBalance}
        userData={userData}
        setDeveloperBalance={setDeveloperBalance}
      />
    </div>
  );
};

export default Setup;
